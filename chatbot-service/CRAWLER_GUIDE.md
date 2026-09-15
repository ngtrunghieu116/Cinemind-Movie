# Hướng Dẫn Sử Dụng & Vận Hành Crawler Service (Python)

Tài liệu này cung cấp toàn bộ hướng dẫn về kiến trúc, cách cài đặt, cách chạy dòng lệnh riêng biệt (CLI), chạy tiến trình ngầm tự động (Scheduler) và cách bật Backend API Service cho hệ thống **Crawler Service** của CineMind Movie Reservation.

---

## 1. Tổng Quan Kiến Trúc

Crawler Service là một **microservice độc lập 100% bằng Python**, chịu trách nhiệm thu thập, làm sạch và đồng bộ toàn bộ dữ liệu thực tế vào cơ sở dữ liệu MySQL:

```
                          [ NGUỒN DỮ LIỆU THỰC TẾ ]
                                     |
         +---------------------------+---------------------------+
         |                           |                           |
         v                           v                           v
  Trung tâm Chiếu phim          Moveek.com                  TMDb Official
     Quốc gia (NCC)       (Phim cũ & Nhận xét)          (Đánh giá quốc tế)
         |                           |                           |
         +---------------------------+---------------------------+
                                     |
                                     v
                       [ CRAWLER SERVICE (PYTHON) ]
                   +-----------------------------------+
                   | Scrapers  -> Trích xuất HTML / RSC|
                   | Pipelines -> Chuẩn hóa & Lưu DB   |
                   +-----------------------------------+
                                     |
               +---------------------+---------------------+
               |                                           |
               v                                           v
    [ Giao Diện CLI / Scheduler ]              [ FastAPI Backend Service ]
     (main.py / scheduler.py)                    (api.py - Port 8002)
               |                                           |
               |                                           v
               |                             [ Admin Dashboard (Port 3001) ]
               |                                 (Nút bấm cào 1-click)
               |                                           |
               +---------------------+---------------------+
                                     |
                                     v
                       [ CƠ SỞ DỮ LIỆU MYSQL / MARIADB ]
                    (movies, showtimes, seats, articles, ...)
```

---

## 2. Cấu Trúc Thư Mục `crawler-service`

```text
crawler-service/
├── scrapers/                          # Các module cào dữ liệu thô
│   ├── ncc_movie_scraper.py           # Cào phim đang chiếu từ NCC
│   ├── moveek_movie_scraper.py        # Cào phim đã chiếu (lịch sử) từ Moveek
│   ├── ncc_news_scraper.py            # Cào tin tức chính thống, sự kiện từ NCC
│   ├── moveek_news_scraper.py         # Cào tin tức điện ảnh, review phim từ Moveek
│   ├── ncc_showtime_scraper.py        # Cào lịch chiếu thực tế từ NCC
│   ├── tmdb_review_scraper.py         # Lấy đánh giá từ TMDb API
│   └── moveek_review_scraper.py       # Cào bình luận tiếng Việt từ Moveek
│
├── pipelines/                         # Xử lý nghiệp vụ và ghi vào DB
│   ├── movie_pipeline.py              # Xử lý & lưu phim (phân loại, ảnh, ngày chiếu)
│   ├── showtime_pipeline.py           # Khớp phòng, tự sinh 60 ghế/phòng, lưu suất chiếu
│   ├── article_pipeline.py            # Làm sạch bài viết, trích xuất ảnh HD, lưu tin tức
│   └── review_pipeline.py             # Tự sinh tác giả (users), chuẩn hóa điểm 1-5 sao
│
├── api.py                             # Backend FastAPI Service (Cổng 8002)
├── main.py                            # Giao diện dòng lệnh (CLI Runner)
├── scheduler.py                       # Tiến trình chạy tự động định kỳ
├── db.py                              # Quản lý kết nối SQLAlchemy Connection Pool
├── config.py                          # Đọc biến môi trường từ .env
├── requirements.txt                   # Danh sách thư viện Python phụ thuộc
└── .env                               # File cấu hình biến môi trường
```

---

## 3. Cài Đặt & Cấu Hình Môi Trường

### Bước 1: Cài đặt thư viện Python
Mở Terminal tại thư mục `crawler-service`:
```bash
cd c:\private\job\movie\crawler-service
pip install -r requirements.txt
```

### Bước 2: Cấu hình file `.env`
Tạo hoặc kiểm tra file `c:\private\job\movie\crawler-service\.env`:
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=movie_reservation_db
DB_USER=root
DB_PASSWORD=root

NCC_BASE_URL=https://chieuphimquocgia.com.vn
TMDB_API_KEY=2dca580c2a14b55200e784d157207b4d
```

### Bước 3: Kiểm tra kết nối MySQL
```bash
python main.py --test-db
```
Nếu thành công, terminal sẽ báo:
```text
[INFO] Successfully connected to MySQL database!
```

---

## 4. Cách 1: Chạy Dòng Lệnh Riêng Biệt (CLI)

Bạn có thể chủ động chạy cào từng phần dữ liệu hoặc chạy toàn bộ thông qua lệnh `python main.py`:

### 4.1. Cào suất chiếu & tự động tạo ghế (Showtimes)
Cào toàn bộ lịch chiếu thực tế từ NCC, tự động tạo 60 ghế vật lý cho các phòng và sinh 60 vé suất chiếu trạng thái `AVAILABLE`:
```bash
python main.py --showtimes
```

### 4.2. Cào phim đang chiếu (Now Showing)
Cào danh sách phim đang chiếu trên website NCC:
```bash
python main.py --movies
```

### 4.3. Cào phim đã chiếu trong quá khứ (Past Movies)
Cào các phim kinh điển/đã chiếu từ Moveek (phục vụ người dùng tra cứu lịch sử):
```bash
python main.py --past-movies
```

### 4.4. Cào tin tức điện ảnh (Articles)
Cào bài viết, thông báo, sự kiện điện ảnh chính thức từ NCC:
```bash
python main.py --news
```

### 4.5. Cào đánh giá & bình luận (Reviews)
Cào review thật từ TMDb và Moveek cho tất cả các phim đang có trong cơ sở dữ liệu:
```bash
python main.py --reviews
```
*Hoặc chỉ cào review cho 1 phim cụ thể theo ID:*
```bash
python main.py --reviews --movie-id 8
```

### 4.6. Cào toàn bộ hệ thống trong 1 lệnh duy nhất
Thực hiện tuần tự: **Phim đang chiếu -> Phim đã chiếu -> Tin tức NCC -> Đánh giá phim -> Suất chiếu & Ghế**:
```bash
python main.py --all
# Hoặc chạy không đối số:
python main.py
```

---

## 5. Cách 2: Chạy Tiến Trình Tự Động Ngầm (Scheduler Daemon)

Nếu muốn hệ thống tự động cập nhật dữ liệu định kỳ không cần can thiệp thủ công, hãy khởi chạy file `scheduler.py`:

```bash
cd c:\private\job\movie\crawler-service
python scheduler.py
```

**Lịch trình hoạt động của Scheduler:**
- **Khi vừa khởi động**: Tự động chạy ngay 1 chu trình cào toàn diện.
- **Định kỳ hàng ngày**: Tự động kích hoạt lúc `08:00` sáng và `20:00` tối mỗi ngày.
- **Chu kỳ lặp**: Quét và cập nhật tin tức & suất chiếu mỗi `6 giờ`.

---

## 6. Cách 3: Bật Backend Service (FastAPI REST API)

Crawler Service có sẵn một máy chủ REST API viết bằng **FastAPI** (`api.py`) để các ứng dụng khác (như **Admin Dashboard** hoặc cron job từ xa) có thể gửi lệnh cào qua giao thức HTTP.

### 6.1. Lệnh khởi động Backend Service
Mở Terminal và chạy:
```bash
cd c:\private\job\movie\crawler-service
python -m uvicorn api:app --host 0.0.0.0 --port 8002 --reload
```
Dịch vụ sẽ khởi động tại: **`http://localhost:8002`** (Swagger Docs xem tại `http://localhost:8002/docs`).

### 6.2. Danh sách các Endpoint API

| Method | Đường Dẫn | Chức Năng | Kiểu Xử Lý |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Kiểm tra tình trạng hoạt động của service | Synchronous |
| `GET` | `/api/crawler/status` | Xem tiến trình đang chạy và kết quả lần cào gần nhất | Synchronous |
| `POST` | `/api/crawler/showtimes` | Kích hoạt cào suất chiếu từ NCC & sinh ghế | Synchronous (trả kết quả ngay) |
| `POST` | `/api/crawler/movies` | Kích hoạt cào phim đang chiếu & phim cũ | Background Task |
| `POST` | `/api/crawler/articles` | Kích hoạt cào tin tức điện ảnh từ NCC | Background Task |
| `POST` | `/api/crawler/reviews` | Kích hoạt cào đánh giá (hỗ trợ `?movie_id=X`) | Background Task |
| `POST` | `/api/crawler/all` | Kích hoạt chu trình cào toàn bộ dữ liệu | Background Task |

### 6.3. Ví dụ gọi API bằng cURL / PowerShell
```bash
# Kiểm tra sức khỏe service:
curl http://localhost:8002/health

# Cào suất chiếu:
curl -X POST http://localhost:8002/api/crawler/showtimes

# Cào toàn bộ:
curl -X POST http://localhost:8002/api/crawler/all
```

---

## 7. Cách Tích Hợp Với Admin Dashboard

Trong giao diện quản trị Admin Dashboard ([`movie-reservation-dashboard`](file:///c:/private/job/movie/movie-reservation-dashboard)):
1. File cấu hình API: [src/api/crawlerApi.js](file:///c:/private/job/movie/movie-reservation-dashboard/src/api/crawlerApi.js) đã kết nối trực tiếp đến `http://localhost:8002`.
2. Khi quản trị viên truy cập trang **Quản Lý Lịch Chiếu** (`http://localhost:3001/showtimes`) và bấm nút **"Crawl Suất Chiếu NCC"**, Dashboard sẽ gọi `POST /api/crawler/showtimes`.
3. Khi cào xong, hệ thống thông báo số suất chiếu được thêm mới/cập nhật và tự động tải lại bảng lịch chiếu.

---

## 8. Bảng Tổng Hợp Khởi Động Toàn Bộ Dự Án

Để toàn bộ hệ thống hoạt động hoàn chỉnh, hãy đảm bảo các dịch vụ sau đang chạy trên các cổng tương ứng:

| Dịch Vụ | Thư Mục | Lệnh Khởi Chạy | Cổng |
| :--- | :--- | :--- | :--- |
| **MySQL (MariaDB)** | `C:\xampp\mysql` | Bật qua XAMPP Control Panel hoặc `mysqld.exe` | `3306` |
| **Spring Boot API** | `Movie-Reservation-System` | `.\mvnw.cmd spring-boot:run` | `8080` |
| **Python Crawler API** | `crawler-service` | `python -m uvicorn api:app --port 8002` | `8002` |
| **Python Chatbot API** | `chatbot-service` | `python -m uvicorn main:app --port 8001` | `8001` |
| **Client Web App** | `movie-reservationsystem-fe` | `npm run dev -- --port 3000` | `3000` |
| **Admin Dashboard** | `movie-reservation-dashboard`| `npm run dev -- --port 3001` | `3001` |

---

## 9. Xử Lý Sự Cố Thường Gặp (Troubleshooting)

1. **Lỗi SSL khi cào từ NCC (`chieuphimquocgia.com.vn`):**
   - NCC dùng chứng chỉ SSL nội bộ / tự ký. Tất cả scrapers trong `scrapers/` đã được cấu hình cờ `verify=False` và tắt warning urllib3, đảm bảo không bao giờ bị lỗi SSL handshake.
2. **Tránh cào trùng lặp dữ liệu:**
   - Phim kiểm tra theo `source_id` và `title`.
   - Suất chiếu kiểm tra theo `source_id` (`ncc:sessionId`).
   - Tin tức kiểm tra theo `source_url`.
   - Review kiểm tra theo cặp `(user_id, movie_id)`.
3. **Phòng chiếu thiếu sơ đồ ghế:**
   - Pipeline `showtime_pipeline.py` tự động kiểm tra và khởi tạo 60 ghế (A-F, 10 ghế/hàng) cho bất kỳ phòng chiếu nào chưa có ghế trong cơ sở dữ liệu.
