# 🎬 CineMind - Smart Cinema Ticket Booking Ecosystem

Hệ sinh thái ứng dụng đặt vé xem phim trực tuyến kết hợp AI Tư Vấn Thông Minh (RAG Chatbot) và Hệ Thống Thu Thập Dữ Liệu Tự Động (Movie & Showtime Crawler).

---

## 🏗️ Kiến Trúc Hệ Thống (Monorepo)

Hệ thống được tổ chức dưới dạng **Monorepo** bao gồm toàn bộ các dịch vụ và giao diện:

| Thư mục | Vai trò | Công nghệ | Cổng mặc định |
| :--- | :--- | :--- | :--- |
| **`movie-reservation/`** | Backend API trung tâm, xác thực JWT, quản lý vé, rạp, thanh toán VNPAY | Java 21, Spring Boot 3.x, MySQL, Hibernate JPA | `8080` |
| **`movie-reservation-fe/`** | Web Khách hàng (Client Portal): xem phim, chọn ghế, thanh toán, AI Chat | React, Vite, TailwindCSS / CSS Modules | `3000` / `5173` |
| **`movie-reservation-admin-fe/`** | Web Quản trị (Admin Portal): thống kê doanh thu, quản lý rạp, phim, suất chiếu | React, Vite, NiceAdmin UI | `3001` / `5174` |
| **`chatbot-service/`** | AI Chatbot Agent tư vấn thông minh, hỗ trợ đặt vé, tìm kiếm lịch chiếu | Python, FastAPI, LangChain, Gemini API, Qdrant | `8000` / `8001` |
| **`crawler-service/`** | Thu thập tự động dữ liệu phim, tin tức, lịch chiếu từ đối tác | Python, FastAPI, BeautifulSoup4, Scrapy | `8002` |

---

## 🚀 Hướng Dẫn Khởi Chạy Nhanh

### 1. Yêu cầu môi trường
- **Java**: OpenJDK 21+ & Apache Maven 3.9+
- **Node.js**: v18+ & npm
- **Python**: 3.10+
- **MySQL**: 8.0+ (Port `3306`)

### 2. Khởi chạy từng dịch vụ

#### Backend Java (Spring Boot)
```bash
cd movie-reservation
mvn spring-boot:run
```

#### Client Frontend (Khách hàng)
```bash
cd movie-reservation-fe
npm install
npm run dev
```

#### Admin Frontend (Quản trị)
```bash
cd movie-reservation-admin-fe
npm install
npm run dev
```

#### AI Chatbot Service
```bash
cd chatbot-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

#### Crawler Service
```bash
cd crawler-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8002
```

---

## 🐳 Khởi Chạy Bằng Docker
```bash
docker-compose up -d
```
