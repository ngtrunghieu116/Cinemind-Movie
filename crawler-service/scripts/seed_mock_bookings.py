#!/usr/bin/env python3
"""
Seed Mock Bookings Script for CineMind
Generates realistic mock reservations, tickets, payments, and order items
from existing users and showtimes in movie_reservation_db.

Format specifications:
- booking_code: REV-<timestamp_ms>-<4_hex> (e.g. REV-1789197572548-4F28)
- ticket_code:  TKT-YYYYMMDD-<5_digits>   (e.g. TKT-20260912-69810)
"""

import os
import sys
import time
import uuid
import random
import argparse
from datetime import datetime, timedelta
from decimal import Decimal

# Try to import pymysql or mysql.connector
try:
    import pymysql
    import pymysql.cursors
except ImportError:
    print("pymysql not found. Installing pymysql...")
    os.system(f"{sys.executable} -m pip install pymysql cryptography")
    import pymysql
    import pymysql.cursors

# Default DB configuration (matches application.properties / .env)
DB_CONFIG = {
    'host': os.getenv('DB_HOST', '127.0.0.1'),
    'port': int(os.getenv('DB_PORT', 3306)),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', 'root'),
    'database': os.getenv('DB_NAME', 'movie_reservation_db'),
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor,
    'autocommit': False
}

BANK_CODES = ['NCB', 'VCB', 'MB', 'VNPAYQR', 'TCB', 'BIDV']


def get_db_connection():
    return pymysql.connect(**DB_CONFIG)


def generate_booking_code(created_at: datetime) -> str:
    """REV-<timestamp_ms>-<4_hex> (e.g. REV-1789197572548-4F28)"""
    epoch_ms = int(created_at.timestamp() * 1000)
    # Add random millisecond offset to prevent duplicate timestamp in batch
    epoch_ms += random.randint(10, 999)
    hex_suffix = uuid.uuid4().hex[:4].upper()
    return f"REV-{epoch_ms}-{hex_suffix}"


def generate_ticket_code(created_at: datetime) -> str:
    """TKT-YYYYMMDD-<5_digits> (e.g. TKT-20260912-69810)"""
    date_str = created_at.strftime('%Y%m%d')
    random_5 = f"{random.randint(10000, 99999)}"
    return f"TKT-{date_str}-{random_5}"


def find_contiguous_seats(available_seats: list, count: int) -> list:
    """
    Tries to find `count` contiguous seats in the same row.
    If not possible, returns `count` available seats.
    """
    if len(available_seats) <= count:
        return available_seats[:count]

    # Group seats by row_name
    rows = {}
    for s in available_seats:
        row = s['row_name']
        if row not in rows:
            rows[row] = []
        rows[row].append(s)

    # Sort each row by seat_number
    for row, s_list in rows.items():
        s_list.sort(key=lambda x: int(x['seat_number']) if str(x['seat_number']).isdigit() else x['seat_number'])
        if len(s_list) >= count:
            # Check for contiguous sub-sequence
            for i in range(len(s_list) - count + 1):
                chunk = s_list[i:i + count]
                # verify contiguity
                is_contiguous = True
                for j in range(len(chunk) - 1):
                    curr_str = str(chunk[j]['seat_number'])
                    next_str = str(chunk[j + 1]['seat_number'])
                    if curr_str.isdigit() and next_str.isdigit():
                        if int(next_str) - int(curr_str) != 1:
                            is_contiguous = False
                            break
                    else:
                        is_contiguous = False
                        break
                if is_contiguous:
                    return chunk

    # Fallback: pick random seats from available
    return random.sample(available_seats, count)


def seed_mock_bookings(count: int = 100):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # 1. Fetch available users (role = 'USER')
            cursor.execute("SELECT id, email, first_name, last_name FROM users WHERE role = 'USER'")
            users = cursor.fetchall()
            if not users:
                print("Error: No users found with role = 'USER' in database.")
                return

            print(f"Loaded {len(users)} available users.")

            # 2. Fetch active showtimes
            cursor.execute("""
                SELECT s.id, s.movie_id, s.room_id, s.start_time, s.end_time,
                       m.title as movie_title, r.name as room_name, t.name as theater_name
                FROM showtimes s
                JOIN movies m ON s.movie_id = m.id
                JOIN rooms r ON s.room_id = r.id
                JOIN theaters t ON r.theater_id = t.id
                WHERE s.start_time >= '2026-09-12'
                ORDER BY s.start_time ASC
            """)
            showtimes = cursor.fetchall()
            if not showtimes:
                print("Error: No showtimes found.")
                return

            print(f"Loaded {len(showtimes)} active showtimes.")

            # 3. Fetch active F&B products
            cursor.execute("SELECT id, name, price FROM products WHERE is_active = 1")
            products = cursor.fetchall()
            print(f"Loaded {len(products)} active F&B products.")

            # Counter
            success_count = 0
            confirmed_count = 0
            cancelled_count = 0
            expired_count = 0
            total_seats_booked = 0
            total_revenue = Decimal('0')

            print(f"\nStarting generation of {count} mock bookings...")

            for i in range(1, count + 1):
                # Pick random user
                user = random.choice(users)
                user_id = user['id']

                # Pick random showtime with available seats
                showtime = random.choice(showtimes)
                showtime_id = showtime['id']
                showtime_start = showtime['start_time']

                # Query AVAILABLE seats for this showtime
                cursor.execute("""
                    SELECT ss.seat_id, ss.price, s.row_name, s.seat_number, s.seat_type
                    FROM showtime_seats ss
                    JOIN seats s ON ss.seat_id = s.id
                    WHERE ss.showtime_id = %s AND ss.status = 'AVAILABLE'
                """, (showtime_id,))
                avail_seats = cursor.fetchall()

                if not avail_seats:
                    # If this showtime is full, try up to 5 other showtimes
                    for _ in range(5):
                        showtime = random.choice(showtimes)
                        showtime_id = showtime['id']
                        showtime_start = showtime['start_time']
                        cursor.execute("""
                            SELECT ss.seat_id, ss.price, s.row_name, s.seat_number, s.seat_type
                            FROM showtime_seats ss
                            JOIN seats s ON ss.seat_id = s.id
                            WHERE ss.showtime_id = %s AND ss.status = 'AVAILABLE'
                        """, (showtime_id,))
                        avail_seats = cursor.fetchall()
                        if avail_seats:
                            break

                if not avail_seats:
                    continue

                # Choose number of seats (1 seat: 40%, 2 seats: 45%, 3 seats: 15%)
                seat_roll = random.random()
                if seat_roll < 0.40:
                    num_seats = 1
                elif seat_roll < 0.85:
                    num_seats = min(2, len(avail_seats))
                else:
                    num_seats = min(3, len(avail_seats))

                chosen_seats = find_contiguous_seats(avail_seats, num_seats)
                if not chosen_seats:
                    continue

                # Status distribution: 85% CONFIRMED, 10% CANCELLED, 5% EXPIRED
                status_roll = random.random()
                if status_roll < 0.85:
                    status = 'CONFIRMED'
                elif status_roll < 0.95:
                    status = 'CANCELLED'
                else:
                    status = 'EXPIRED'

                # Calculate created_at time: between 1 to 5 days before showtime
                # But not after current simulation time or showtime
                days_before = random.uniform(0.5, 4.0)
                created_at = showtime_start - timedelta(days=days_before, hours=random.randint(1, 10))
                # Ensure it is at least from Sept 1, 2026 onwards
                if created_at < datetime(2026, 9, 1, 8, 0, 0):
                    created_at = datetime(2026, 9, 1, 9, 0, 0) + timedelta(days=random.randint(0, 10), hours=random.randint(0, 12))
                expires_at = created_at + timedelta(minutes=15)

                # Calculate seat price
                seat_subtotal = Decimal('0')
                for s in chosen_seats:
                    s_price = s['price'] if s['price'] is not None else Decimal('80000.00')
                    seat_subtotal += Decimal(str(s_price))

                # F&B items (35% probability if products exist)
                fnb_items = []
                fnb_subtotal = Decimal('0')
                if products and random.random() < 0.35:
                    num_fnb = random.choice([1, 2])
                    selected_prods = random.sample(products, min(num_fnb, len(products)))
                    for p in selected_prods:
                        qty = random.choice([1, 2])
                        unit_p = Decimal(str(p['price']))
                        sub = unit_p * qty
                        fnb_subtotal += sub
                        fnb_items.append({
                            'product_id': p['id'],
                            'unit_price': unit_p,
                            'quantity': qty,
                            'subtotal': sub
                        })

                total_price = seat_subtotal + fnb_subtotal

                # Generate booking code: REV-<epoch_ms>-<4_hex>
                booking_code = generate_booking_code(created_at)

                # 4. Insert into reservations
                cursor.execute("""
                    INSERT INTO reservations (booking_code, user_id, showtime_id, total_price, status, created_at, expires_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (booking_code, user_id, showtime_id, total_price, status, created_at, expires_at))
                reservation_id = cursor.lastrowid

                # 5. Insert into reserved_seats
                for s in chosen_seats:
                    s_price = s['price'] if s['price'] is not None else Decimal('80000.00')
                    cursor.execute("""
                        INSERT INTO reserved_seats (reservation_id, seat_id, price)
                        VALUES (%s, %s, %s)
                    """, (reservation_id, s['seat_id'], s_price))

                # 6. Insert into order_items (if any)
                for fnb in fnb_items:
                    cursor.execute("""
                        INSERT INTO order_items (reservation_id, product_id, unit_price, quantity, subtotal)
                        VALUES (%s, %s, %s, %s, %s)
                    """, (reservation_id, fnb['product_id'], fnb['unit_price'], fnb['quantity'], fnb['subtotal']))

                # 7. If CONFIRMED:
                # - Update showtime_seats to SOLD
                # - Generate tickets
                # - Generate payment (SUCCESS)
                if status == 'CONFIRMED':
                    # Update showtime_seats
                    seat_ids = [s['seat_id'] for s in chosen_seats]
                    format_strings = ','.join(['%s'] * len(seat_ids))
                    cursor.execute(f"""
                        UPDATE showtime_seats
                        SET status = 'SOLD', reservation_id = %s
                        WHERE showtime_id = %s AND seat_id IN ({format_strings})
                    """, [reservation_id, showtime_id] + seat_ids)

                    # Generate tickets
                    for s in chosen_seats:
                        s_price = s['price'] if s['price'] is not None else Decimal('80000.00')
                        ticket_code = generate_ticket_code(created_at)
                        qr_code_url = f"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='%23eee'/><text x='10' y='50' font-size='10'>{ticket_code}</text></svg>"
                        
                        # Checked in logic: if showtime was in past relative to now, 75% checked in
                        now = datetime.now()
                        checked_in_at = None
                        ticket_status = 'ISSUED'
                        if showtime_start < now and random.random() < 0.75:
                            checked_in_at = showtime_start - timedelta(minutes=random.randint(5, 30))
                            ticket_status = 'USED'

                        cursor.execute("""
                            INSERT INTO tickets (ticket_code, reservation_id, seat_id, showtime_id, price, qr_code_url, checked_in_at, status, created_at)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """, (ticket_code, reservation_id, s['seat_id'], showtime_id, s_price, qr_code_url, checked_in_at, ticket_status, created_at))

                    # Insert payment (COMPLETED)
                    txn_ref = f"vnp_{created_at.strftime('%Y%m%d%H%M%S')}_{random.randint(1000, 9999)}"
                    txn_no = str(random.randint(14000000, 15999999))
                    bank_code = random.choice(BANK_CODES)
                    paid_at = created_at + timedelta(minutes=random.randint(1, 4))

                    cursor.execute("""
                        INSERT INTO payments (reservation_id, transaction_ref, transaction_no, payment_method, bank_code, amount, status, created_at, paid_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (reservation_id, txn_ref, txn_no, 'VNPAY', bank_code, total_price, 'COMPLETED', created_at, paid_at))

                    confirmed_count += 1
                    total_seats_booked += len(chosen_seats)
                    total_revenue += total_price

                else:
                    # CANCELLED or EXPIRED
                    txn_ref = f"vnp_fail_{created_at.strftime('%Y%m%d%H%M%S')}_{random.randint(1000, 9999)}"
                    cursor.execute("""
                        INSERT INTO payments (reservation_id, transaction_ref, transaction_no, payment_method, bank_code, amount, status, created_at, paid_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NULL)
                    """, (reservation_id, txn_ref, None, 'VNPAY', 'NCB', total_price, 'FAILED', created_at))

                    if status == 'CANCELLED':
                        cancelled_count += 1
                    else:
                        expired_count += 1

                # Commit each reservation transaction
                conn.commit()
                success_count += 1

                if i % 10 == 0 or i == count:
                    print(f"[{i:3d}/{count:3d}] Created {booking_code} | {status:9s} | {len(chosen_seats)} seats | {total_price:,.0f} VND")

            print("\n=======================================================")
            print("         MOCK BOOKINGS GENERATION COMPLETED!           ")
            print("=======================================================")
            print(f"Total bookings created:  {success_count}")
            print(f" - CONFIRMED:            {confirmed_count} ({confirmed_count/success_count*100:.1f}%)")
            print(f" - CANCELLED:            {cancelled_count} ({cancelled_count/success_count*100:.1f}%)")
            print(f" - EXPIRED:              {expired_count} ({expired_count/success_count*100:.1f}%)")
            print(f"Total seats sold:        {total_seats_booked}")
            print(f"Total revenue generated: {total_revenue:,.0f} VND")
            print("=======================================================\n")

    except Exception as e:
        conn.rollback()
        print(f"Error during execution: {e}")
        raise
    finally:
        conn.close()


def clear_mock_bookings():
    """Removes all mock bookings and restores seats to AVAILABLE"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Find mock bookings (or all reservations if desired)
            # Find reservation IDs
            cursor.execute("SELECT id FROM reservations")
            rows = cursor.fetchall()
            res_ids = [r['id'] for r in rows]

            if not res_ids:
                print("No bookings found to clear.")
                return

            print(f"Found {len(res_ids)} bookings. Resetting seats and clearing records...")

            # Reset showtime_seats to AVAILABLE
            cursor.execute("UPDATE showtime_seats SET status = 'AVAILABLE', reservation_id = NULL WHERE reservation_id IS NOT NULL")
            # Delete order_items
            cursor.execute("DELETE FROM order_items")
            # Delete tickets
            cursor.execute("DELETE FROM tickets")
            # Delete payments
            cursor.execute("DELETE FROM payments")
            # Delete reserved_seats
            cursor.execute("DELETE FROM reserved_seats")
            # Delete reservations
            cursor.execute("DELETE FROM reservations")

            conn.commit()
            print("Successfully cleared all booking data and reset seats to AVAILABLE.")
    except Exception as e:
        conn.rollback()
        print(f"Error clearing bookings: {e}")
        raise
    finally:
        conn.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Seed mock bookings for CineMind")
    parser.add_argument('--count', type=int, default=100, help="Number of bookings to generate (default: 100)")
    parser.add_argument('--clear', action='store_true', help="Clear all bookings and reset seats to AVAILABLE")

    args = parser.parse_args()

    if args.clear:
        clear_mock_bookings()
    else:
        seed_mock_bookings(count=args.count)
