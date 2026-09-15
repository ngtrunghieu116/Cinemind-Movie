import logging
from datetime import datetime, timedelta
from sqlalchemy import text
from db import SessionLocal

logger = logging.getLogger(__name__)

class ShowtimePipeline:
    def __init__(self, buffer_minutes: int = 15):
        self.buffer_minutes = buffer_minutes

    def _ensure_room_seats(self, db_session):
        """
        Ensures all active rooms in the database have physical seats defined in `seats` table.
        Generates 60 seats (Rows A-F, 10 seats each) for any room missing seats.
        """
        rooms = db_session.execute(text("SELECT id, name FROM rooms WHERE is_active = 1")).fetchall()
        for r in rooms:
            r_id, r_name = r[0], r[1]
            seat_count = db_session.execute(
                text("SELECT count(*) FROM seats WHERE room_id = :rid"), {"rid": r_id}
            ).scalar()

            if seat_count == 0:
                logger.info(f"[SHOWTIME_PIPELINE] Initializing 60 physical seats for room '{r_name}' (ID: {r_id})...")
                new_seats = []
                # Rows A, B, C: STANDARD (1-10)
                # Rows D, E: VIP (1-10)
                # Row F: COUPLE (1-10)
                row_configs = [
                    ('A', 'STANDARD'),
                    ('B', 'STANDARD'),
                    ('C', 'STANDARD'),
                    ('D', 'VIP'),
                    ('E', 'VIP'),
                    ('F', 'COUPLE')
                ]
                for row_name, s_type in row_configs:
                    for num in range(1, 11):
                        new_seats.append({
                            "room_id": r_id,
                            "row_name": row_name,
                            "seat_number": num,
                            "seat_type": s_type,
                            "is_active": 1
                        })

                db_session.execute(
                    text("""
                        INSERT INTO seats (room_id, row_name, seat_number, seat_type, is_active)
                        VALUES (:room_id, :row_name, :seat_number, :seat_type, :is_active)
                    """),
                    new_seats
                )
                db_session.commit()
                logger.info(f"[SHOWTIME_PIPELINE] Initialized 60 seats for room ID {r_id}.")

    def process_and_save(self, raw_showtimes: list[dict]) -> dict:
        if not raw_showtimes:
            return {"inserted": 0, "updated": 0, "skipped": 0, "total": 0}

        db_session = SessionLocal()
        inserted_count = 0
        updated_count = 0
        skipped_count = 0
        now = datetime.now()

        try:
            # 1. Ensure all rooms have physical seats
            self._ensure_room_seats(db_session)

            # 2. Build lookups
            # Movies: source_id -> movie row
            movies = db_session.execute(
                text("SELECT id, title, source_id, status, duration, release_date, end_date FROM movies")
            ).fetchall()

            movie_by_source = {m[2]: m for m in movies if m[2]}
            movie_by_title = {}
            for m in movies:
                if m[1]:
                    norm_title = self._normalize_title(m[1])
                    movie_by_title[norm_title] = m

            # Rooms: source_room_id -> room row
            rooms = db_session.execute(
                text("SELECT id, name, source_room_id FROM rooms WHERE is_active = 1")
            ).fetchall()
            room_by_source = {str(r[2]): r for r in rooms if r[2]}

            logger.info(
                f"[SHOWTIME_PIPELINE] Processing {len(raw_showtimes)} showtimes against "
                f"{len(movies)} DB movies and {len(rooms)} DB rooms."
            )

            for item in raw_showtimes:
                source_id = item.get("source_id")
                film_source_id = item.get("film_source_id")
                raw_film_title = item.get("film_title", "")
                room_source_id = item.get("room_source_id")
                start_time = item.get("start_time")

                if not source_id or not start_time:
                    skipped_count += 1
                    continue

                # Ignore past showtimes
                if start_time < now:
                    skipped_count += 1
                    continue

                # Match Room
                matched_room = room_by_source.get(room_source_id)
                if not matched_room:
                    logger.debug(f"[SHOWTIME_PIPELINE] Unmapped room source ID: {room_source_id}. Skipping.")
                    skipped_count += 1
                    continue
                room_id = matched_room[0]

                # Match Movie
                matched_movie = movie_by_source.get(film_source_id)
                if not matched_movie and raw_film_title:
                    norm_title = self._normalize_title(raw_film_title)
                    matched_movie = movie_by_title.get(norm_title)

                if not matched_movie:
                    logger.debug(f"[SHOWTIME_PIPELINE] Unmapped movie source ID: {film_source_id} ('{raw_film_title}'). Skipping.")
                    skipped_count += 1
                    continue

                movie_id, m_title, _, m_status, m_duration, m_rel_date, m_end_date = matched_movie

                if m_status == "ENDED":
                    skipped_count += 1
                    continue

                duration = int(m_duration) if m_duration and m_duration > 0 else 110
                end_time = start_time + timedelta(minutes=duration)

                price_std = float(item.get("price_standard", 80000.0))
                price_vip = float(item.get("price_vip", 90000.0))
                price_cpl = float(item.get("price_couple", 120000.0))
                is_online = 1 if item.get("is_online_selling", True) else 0

                # Check if showtime exists by source_id
                existing_st = db_session.execute(
                    text("SELECT id, is_active FROM showtimes WHERE source_id = :sid"),
                    {"sid": source_id}
                ).fetchone()

                if existing_st:
                    st_id = existing_st[0]
                    db_session.execute(
                        text("""
                            UPDATE showtimes 
                            SET price_standard = :p_std,
                                price_vip = :p_vip,
                                price_couple = :p_cpl,
                                is_online_selling = :is_online,
                                is_active = 1,
                                last_seen_at = :now,
                                missing_count = 0
                            WHERE id = :id
                        """),
                        {
                            "p_std": price_std,
                            "p_vip": price_vip,
                            "p_cpl": price_cpl,
                            "is_online": is_online,
                            "now": now,
                            "id": st_id
                        }
                    )
                    updated_count += 1
                else:
                    # Check room time overlap
                    adj_start = start_time - timedelta(minutes=self.buffer_minutes)
                    adj_end = end_time + timedelta(minutes=self.buffer_minutes)
                    overlap = db_session.execute(
                        text("""
                            SELECT id FROM showtimes 
                            WHERE room_id = :rid 
                              AND is_active = 1 
                              AND start_time < :adj_end 
                              AND end_time > :adj_start
                            LIMIT 1
                        """),
                        {"rid": room_id, "adj_start": adj_start, "adj_end": adj_end}
                    ).fetchone()

                    if overlap:
                        logger.debug(
                            f"[SHOWTIME_PIPELINE] Overlap in room {room_id} at {start_time} - {end_time}. Skipping."
                        )
                        skipped_count += 1
                        continue

                    # Insert new showtime
                    insert_res = db_session.execute(
                        text("""
                            INSERT INTO showtimes 
                            (movie_id, room_id, start_time, end_time, price_standard, price_vip, price_couple,
                             source_id, last_seen_at, missing_count, is_active, is_online_selling)
                            VALUES 
                            (:mid, :rid, :stime, :etime, :p_std, :p_vip, :p_cpl,
                             :sid, :now, 0, 1, :is_online)
                        """),
                        {
                            "mid": movie_id,
                            "rid": room_id,
                            "stime": start_time,
                            "etime": end_time,
                            "p_std": price_std,
                            "p_vip": price_vip,
                            "p_cpl": price_cpl,
                            "sid": source_id,
                            "now": now,
                            "is_online": is_online
                        }
                    )
                    new_st_id = insert_res.lastrowid

                    # Populate showtime_seats for this newly created showtime
                    physical_seats = db_session.execute(
                        text("SELECT id, seat_type FROM seats WHERE room_id = :rid AND is_active = 1"),
                        {"rid": room_id}
                    ).fetchall()

                    if physical_seats:
                        showtime_seats_data = []
                        for s_row in physical_seats:
                            s_id, s_type = s_row[0], s_row[1]
                            seat_price = price_std
                            if s_type == "VIP":
                                seat_price = price_vip
                            elif s_type == "COUPLE":
                                seat_price = price_cpl

                            showtime_seats_data.append({
                                "showtime_id": new_st_id,
                                "seat_id": s_id,
                                "price": seat_price,
                                "status": "AVAILABLE",
                                "version": 0
                            })

                        db_session.execute(
                            text("""
                                INSERT INTO showtime_seats (showtime_id, seat_id, price, status, version)
                                VALUES (:showtime_id, :seat_id, :price, :status, :version)
                            """),
                            showtime_seats_data
                        )

                    inserted_count += 1

            db_session.commit()
            logger.info(
                f"[SHOWTIME_PIPELINE] Done: {inserted_count} inserted, {updated_count} updated, {skipped_count} skipped."
            )

        except Exception as e:
            db_session.rollback()
            logger.error(f"[SHOWTIME_PIPELINE] Error processing showtimes: {e}", exc_info=True)
            raise e
        finally:
            db_session.close()

        return {
            "inserted": inserted_count,
            "updated": updated_count,
            "skipped": skipped_count,
            "total": len(raw_showtimes)
        }

    def _normalize_title(self, title: str) -> str:
        import re
        t = re.sub(r'[-_\s]+(C18|T18|18\+|C16|T16|16\+|C13|T13|13\+|P|K)\s*$', '', title, flags=re.IGNORECASE)
        t = re.sub(r'\s*\(PHỤ ĐỀ\)\s*$', '', t, flags=re.IGNORECASE)
        t = re.sub(r'\s*\(LỒNG TIẾNG\)\s*$', '', t, flags=re.IGNORECASE)
        t = re.sub(r'\s*\(LT\)\s*$', '', t, flags=re.IGNORECASE)
        t = re.sub(r'\s*\(PĐ\)\s*$', '', t, flags=re.IGNORECASE)
        return t.strip().lower()
