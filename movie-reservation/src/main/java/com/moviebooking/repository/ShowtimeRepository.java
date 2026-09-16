package com.moviebooking.repository;

import com.moviebooking.model.Showtime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ShowtimeRepository extends JpaRepository<Showtime, Long> {
    Optional<Showtime> findBySourceId(String sourceId);

    List<Showtime> findBySourceIdStartingWithAndIsActiveTrue(String prefix);

    boolean existsByRoomIdAndEndTimeAfter(Long roomId, LocalDateTime time);

    @Query("SELECT COUNT(s) > 0 FROM Showtime s WHERE s.room.id = :roomId " +
           "AND :adjustedStartTime < s.endTime AND :adjustedEndTime > s.startTime " +
           "AND (:excludeId IS NULL OR s.id <> :excludeId)")
    boolean existsOverlappingShowtime(@Param("roomId") Long roomId,
                                      @Param("adjustedStartTime") LocalDateTime adjustedStartTime,
                                      @Param("adjustedEndTime") LocalDateTime adjustedEndTime,
                                      @Param("excludeId") Long excludeId);

    Page<Showtime> findByRoomIdOrderByStartTimeDesc(Long roomId, Pageable pageable);
    
    @Query(value = "SELECT s FROM Showtime s JOIN FETCH s.movie JOIN FETCH s.room r JOIN FETCH r.theater WHERE " +
           "(:theaterId IS NULL OR r.theater.id = :theaterId) AND " +
           "(:roomId IS NULL OR r.id = :roomId) AND " +
           "(:movieId IS NULL OR s.movie.id = :movieId) AND " +
           "(:search IS NULL OR :search = '' OR LOWER(s.movie.title) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:status IS NULL OR :status = '' OR " +
           "  (:status = 'UPCOMING' AND s.startTime > :now) OR " +
           "  (:status = 'ONGOING' AND s.startTime <= :now AND s.endTime > :now) OR " +
           "  (:status = 'ENDED' AND s.endTime <= :now)) AND " +
           "(:fromDate IS NULL OR s.startTime >= :fromDate) AND " +
           "(:toDate IS NULL OR s.startTime <= :toDate)",
           countQuery = "SELECT COUNT(s) FROM Showtime s WHERE " +
           "(:theaterId IS NULL OR s.room.theater.id = :theaterId) AND " +
           "(:roomId IS NULL OR s.room.id = :roomId) AND " +
           "(:movieId IS NULL OR s.movie.id = :movieId) AND " +
           "(:search IS NULL OR :search = '' OR LOWER(s.movie.title) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:status IS NULL OR :status = '' OR " +
           "  (:status = 'UPCOMING' AND s.startTime > :now) OR " +
           "  (:status = 'ONGOING' AND s.startTime <= :now AND s.endTime > :now) OR " +
           "  (:status = 'ENDED' AND s.endTime <= :now)) AND " +
           "(:fromDate IS NULL OR s.startTime >= :fromDate) AND " +
           "(:toDate IS NULL OR s.startTime <= :toDate)")
    Page<Showtime> searchShowtimes(@Param("theaterId") Long theaterId,
                                   @Param("roomId") Long roomId,
                                   @Param("movieId") Long movieId,
                                   @Param("search") String search,
                                   @Param("status") String status,
                                   @Param("fromDate") LocalDateTime fromDate,
                                   @Param("toDate") LocalDateTime toDate,
                                   @Param("now") LocalDateTime now,
                                   Pageable pageable);

    @Query(value = "SELECT s FROM Showtime s JOIN FETCH s.movie JOIN FETCH s.room r JOIN FETCH r.theater WHERE " +
           "s.isActive = true AND s.isOnlineSelling = true AND s.startTime > :now AND " +
           "(:theaterId IS NULL OR r.theater.id = :theaterId) AND " +
           "(:roomId IS NULL OR r.id = :roomId) AND " +
           "(:movieId IS NULL OR s.movie.id = :movieId) AND " +
           "(:fromDate IS NULL OR s.startTime >= :fromDate) AND " +
           "(:toDate IS NULL OR s.startTime <= :toDate)",
           countQuery = "SELECT COUNT(s) FROM Showtime s WHERE " +
           "s.isActive = true AND s.isOnlineSelling = true AND s.startTime > :now AND " +
           "(:theaterId IS NULL OR s.room.theater.id = :theaterId) AND " +
           "(:roomId IS NULL OR s.room.id = :roomId) AND " +
           "(:movieId IS NULL OR s.movie.id = :movieId) AND " +
           "(:fromDate IS NULL OR s.startTime >= :fromDate) AND " +
           "(:toDate IS NULL OR s.startTime <= :toDate)")
    Page<Showtime> searchPublicShowtimes(@Param("theaterId") Long theaterId,
                                         @Param("roomId") Long roomId,
                                         @Param("movieId") Long movieId,
                                         @Param("fromDate") LocalDateTime fromDate,
                                         @Param("toDate") LocalDateTime toDate,
                                         @Param("now") LocalDateTime now,
                                         Pageable pageable);

    @Query("SELECT DISTINCT CAST(s.startTime AS LocalDate) FROM Showtime s " +
           "WHERE (:movieId IS NULL OR s.movie.id = :movieId) AND s.startTime >= :now AND s.isActive = true " +
           "ORDER BY CAST(s.startTime AS LocalDate) ASC")
    List<LocalDate> findAvailableShowDates(@Param("movieId") Long movieId,
                                           @Param("now") LocalDateTime now);
}
