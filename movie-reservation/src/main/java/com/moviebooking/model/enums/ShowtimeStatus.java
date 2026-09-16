package com.moviebooking.model.enums;

import java.time.LocalDateTime;
import java.util.Arrays;

/**
 * Polymorphic Strategy Pattern for Showtime Lifecycle States (SOLID - SRP & OCP).
 * Mỗi trạng thái tự đóng gói quy tắc kiểm tra (matches) của chính nó, triệt tiêu hoàn toàn if-else.
 */
public enum ShowtimeStatus {

    UPCOMING {
        @Override
        public boolean matches(LocalDateTime start, LocalDateTime end, LocalDateTime now) {
            return now.isBefore(start);
        }
    },
    ONGOING {
        @Override
        public boolean matches(LocalDateTime start, LocalDateTime end, LocalDateTime now) {
            return !now.isBefore(start) && now.isBefore(end);
        }
    },
    ENDED {
        @Override
        public boolean matches(LocalDateTime start, LocalDateTime end, LocalDateTime now) {
            return !now.isBefore(end);
        }
    };

    /**
     * Hợp đồng trừu tượng kiểm tra mốc thời gian phù hợp với trạng thái.
     */
    public abstract boolean matches(LocalDateTime start, LocalDateTime end, LocalDateTime now);

    /**
     * Phân giải trạng thái tự động theo Stream API (Không dùng if-else).
     * Mở rộng thêm trạng thái mới chỉ cần thêm Enum constant mà không sửa đổi hàm resolve (OCP).
     */
    public static ShowtimeStatus resolve(LocalDateTime start, LocalDateTime end, LocalDateTime now) {
        if (start == null || now == null) {
            return UPCOMING;
        }
        LocalDateTime effectiveEnd = (end != null) ? end : start.plusMinutes(120);

        return Arrays.stream(values())
                .filter(status -> status.matches(start, effectiveEnd, now))
                .findFirst()
                .orElse(UPCOMING);
    }
}
