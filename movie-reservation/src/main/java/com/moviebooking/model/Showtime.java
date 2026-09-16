package com.moviebooking.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "showtimes")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Showtime {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movie_id", nullable = false)
    private Movie movie;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;
    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;
    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;
    @Column(name = "price_standard", nullable = false, precision = 10, scale = 2)
    private BigDecimal priceStandard;
    @Column(name = "price_vip", nullable = false, precision = 10, scale = 2)
    private BigDecimal priceVip;
    @Column(name = "price_couple", nullable = false, precision = 10, scale = 2)
    private BigDecimal priceCouple;

    // Crawler fields
    @Column(name = "source_id", length = 100, unique = true)
    private String sourceId;

    @Column(name = "last_seen_at")
    private LocalDateTime lastSeenAt;

    @Column(name = "missing_count", nullable = false, columnDefinition = "INT DEFAULT 0")
    @Builder.Default
    private Integer missingCount = 0;

    @Column(name = "is_active", nullable = false, columnDefinition = "BOOLEAN DEFAULT TRUE")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_online_selling", nullable = false, columnDefinition = "BOOLEAN DEFAULT TRUE")
    @Builder.Default
    private Boolean isOnlineSelling = true;

    /**
     * Thuộc tính miền xác định thời điểm kết thúc hiệu lực dựa trên thời lượng phim.
     * Entity không chịu trách nhiệm đánh giá trạng thái nghiệp vụ (Tuân thủ SRP).
     */
    public LocalDateTime getEffectiveEndTime() {
        if (this.endTime != null) {
            return this.endTime;
        }
        int duration = (this.movie != null && this.movie.getDuration() != null)
                ? this.movie.getDuration()
                : 120;
        return (this.startTime != null) ? this.startTime.plusMinutes(duration) : null;
    }
}