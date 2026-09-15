# 🎬🍿 Cinema AI Chatbot Service (CineBot)

Microservice Trợ lý ảo AI thông minh phục vụ tư vấn phim, tra cứu lịch chiếu, hỗ trợ đặt vé và chăm sóc khách hàng tự động cho hệ thống rạp chiếu phim **CineMind**.

Dịch vụ được xây dựng trên nền tảng **FastAPI**, kết hợp mô hình ngôn ngữ lớn **DeepSeek LLM**, pipeline **RAG (Retrieval-Augmented Generation)** trên **Qdrant Vector Database**, mô hình reranker tiếng Việt **ViRanker**, hệ thống giám sát **Langfuse**, cùng kiến trúc **Multi-Agent** chuyên biệt hóa theo tác vụ.

---

## 📑 Mục Lục
1. [Kiến Trúc & Tính Năng Nổi Bật](#-kiến-trúc--tính-năng-nổi-bật)
2. [Yêu Cầu Tiền Đề (Prerequisites)](#-yêu-cầu-tiền-đề-prerequisites)
3. [Cách Chạy Dịch Vụ](#-cách-chạy-dịch-vụ)
   - [Cách 1: Chạy bằng Docker Compose (Khuyên dùng)](#cách-1-chạy-bằng-docker-compose-khuyên-dùng)
   - [Cách 2: Chạy trực tiếp bằng Python (Local Development)](#cách-2-chạy-trực-tiếp-bằng-python-local-development)
4. [Cấu Hình Biến Môi Trường (.env)](#-cấu-hình-biến-môi-trường-env)
5. [Khởi Tạo Dữ Liệu & RAG Indexing](#-khởi-tạo-dữ-liệu--rag-indexing)
6. [Danh Sách API Endpoints](#-danh-sách-api-endpoints)
7. [Kiểm Thử Nhanh (Smoke Test)](#-kiểm-thử-nhanh-smoke-test)
8. [Tích Hợp Frontend & Admin Dashboard](#-tích-hợp-frontend--admin-dashboard)
9. [Xử Lý Lỗi Thường Gặp (Troubleshooting)](#-xử-lý-lỗi-thường-gặp-troubleshooting)

---

## 🌟 Kiến Trúc & Tính Năng Nổi Bật

### 1. Kiến Trúc 3 Tầng Multi-Agent
```
                        [ Khách hàng / Frontend Widget ]
                                       │
                                       ▼ (POST /api/chat kèm JWT nếu có)
                     ┌────────────────────────────────────┐
                     │   Layer 1: SafeGuard Filter        │
                     │   (Kiểm duyệt nội dung, an toàn)   │
                     └─────────────────┬──────────────────┘
                                       │ (Chủ đề rạp phim hợp lệ)
                                       ▼
                     ┌────────────────────────────────────┐
                     │   Layer 2: Intent Orchestrator     │
                     │   (Phân loại ý định khách hàng)    │
                     └─────────────────┬──────────────────┘
                                       │
         ┌──────────────────┬──────────┴───────────┬──────────────────┐
         ▼                  ▼                      ▼                  ▼
┌─────────────────┐┌─────────────────┐  ┌──────────────────┐┌──────────────────┐
│ Discovery Agent ││ Booking Agent   │  │ Support Agent    ││ Navigation Agent │
│ • RAG Qdrant    ││ • SQL Tra cứu   │  │ • Lịch sử đặt vé ││ • Điều hướng     │
│ • Thông tin phim││ • Suất chiếu/ghế│  │ • Chi tiết vé    ││   trang web      │
│ • Tin tức/Review││ • Giá combo/bắp │  │ • Hủy vé hợp lệ  ││   (Routes)       │
└─────────────────┘└─────────────────┘  └──────────────────┘└──────────────────┘
```

- **SafeGuard**: Chặn các câu hỏi lạc đề (chính trị, tôn giáo, lập trình...), chống prompt injection, phản hồi lịch sự hướng khách hàng về dịch vụ rạp.
- **Context Enrichment**: Tự động nhận biết thời gian thực múi giờ Việt Nam (`Asia/Ho_Chi_Minh`) và giải mã token JWT để chào hỏi đích danh khách hàng, nắm được quyền hạn và lịch sử.
- **RAG Pipeline Thông Minh**:
  - **Vector Search**: Sử dụng `Qdrant` chứa tri thức về phim, bài báo điện ảnh và chính sách rạp.
  - **Embedding**: `jeffh/intfloat-multilingual-e5-large-instruct:Q8_0` (thông qua Ollama) hoặc `bge-m3`.
  - **Reranker**: `models--namdp-ptit--ViRanker` (Cross-Encoder tiếng Việt tối ưu thứ hạng ngữ nghĩa sát nhất).
- **Quản Lý Phiên Chat (Persistence)**:
  - Lưu trữ trực tiếp toàn bộ phiên (`chat_sessions`) và tin nhắn (`chat_messages`) vào cơ sở dữ liệu MySQL chính (`movie_reservation_db`).
- **Giám Sát Langfuse**:
  - Ghi vết (trace) toàn bộ quá trình suy luận của LLM, token usage, độ trễ và hoạt động gọi công cụ.

---

## 📋 Yêu Cầu Tiền Đề (Prerequisites)

Trước khi khởi chạy chatbot service, hãy đảm bảo các dịch vụ phụ trợ sau đang chạy:

| Dịch Vụ | Cổng Mặc Định | Mô Tả |
| :--- | :--- | :--- |
| **MySQL (MariaDB)** | `3306` | Lưu dữ liệu hệ thống và bảng `chat_sessions`, `chat_messages` |
| **Qdrant** | `6333` | Vector Database lưu trữ tri thức RAG |
| **Ollama** | `11434` | Phục vụ embedding model `jeffh/intfloat-multilingual-e5-large-instruct:Q8_0` |
| **Langfuse** *(Tùy chọn)* | `3300` | Giám sát và phân tích LLM Traces |

> [!TIP]
> Để tải model embedding vào Ollama, mở terminal và chạy:
> ```bash
> ollama pull jeffh/intfloat-multilingual-e5-large-instruct:Q8_0
> ```

---

## 🚀 Cách Chạy Dịch Vụ

### Cách 1: Chạy bằng Docker Compose (Khuyên dùng)

Dịch vụ chatbot đã được container hóa hoàn chỉnh cùng crawler service tại file `docker-compose.yml` ở thư mục gốc của dự án. Container được cấu hình mạng tự động kết nối tới các dịch vụ trên host (`host.docker.internal`).

#### 1. Khởi chạy container
Từ thư mục gốc dự án (`c:\private\job\movie`):
```bash
# Khởi động cả 2 service chạy ngầm (-d)
docker compose up -d
```

#### 2. Kiểm tra trạng thái & Xem logs
```bash
# Xem danh sách container đang chạy
docker compose ps

# Xem log realtime của chatbot container
docker compose logs -f chatbot-service
```

#### 3. Dừng container
```bash
docker compose down
```

#### 4. Build lại image (khi có sửa đổi mã nguồn)
```bash
docker compose build chatbot-service
docker compose up -d chatbot-service
```

---

### Cách 2: Chạy trực tiếp bằng Python (Local Development)

Dành cho quá trình phát triển, sửa đổi code và debug trực tiếp trên máy host.

#### Bước 1: Điều hướng vào thư mục service
```bash
cd c:\private\job\movie\chatbot-service
```

#### Bước 2: Tạo và kích hoạt môi trường ảo (Virtual Environment)
```powershell
# Tạo venv (khuyến nghị Python 3.10)
python -m venv venv

# Kích hoạt venv trên Windows PowerShell
.\venv\Scripts\Activate.ps1
```

#### Bước 3: Cài đặt PyTorch CPU & Dependencies
> [!IMPORTANT]
> **Lưu ý tối ưu dung lượng:** Cài đặt bản PyTorch CPU trước để tránh pip tải gói CUDA nặng hơn 2.5 GB!

```bash
# 1. Cài đặt PyTorch bản CPU siêu nhẹ (~190 MB)
pip install torch --extra-index-url https://download.pytorch.org/whl/cpu

# 2. Cài đặt toàn bộ các thư viện còn lại
pip install -r requirements.txt
```

#### Bước 4: Chuẩn bị file cấu hình `.env`
Sao chép từ `.env.example` nếu chưa có file `.env`:
```powershell
cp .env.example .env
```
Kiểm tra các thông số trong `.env` phù hợp với cấu hình máy của bạn (xem mục [Cấu Hình Biến Môi Trường](#-cấu-hình-biến-môi-trường-env)).

#### Bước 5: Khởi tạo database & Index dữ liệu
```bash
# 1. Tạo các bảng chat trong MySQL
python -m db.init_db

# 2. Index dữ liệu phim & bài viết vào Qdrant
python -m rag.indexer
```

#### Bước 6: Chạy server FastAPI
```bash
# Cách A: Chạy qua uvicorn với tính năng auto-reload
uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# Hoặc Cách B: Chạy qua file main.py
python main.py
```

Server sẽ lắng nghe tại: **`http://localhost:8001`**  
Tài liệu tương tác Swagger UI: **`http://localhost:8001/docs`**

---

## ⚙️ Cấu Hình Biến Môi Trường (.env)

Tạo hoặc chỉnh sửa file `chatbot-service/.env`:

```env
# ==========================================
# 1. CẤU HÌNH LLM (DEEPSEEK / OPENAI COMPATIBLE)
# ==========================================
CLOUD_MODEL_NAME=deepseek-chat
CLOUD_MODEL_URL=https://api.deepseek.com
CLOUD_API_KEY=your_deepseek_api_key_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat

# ==========================================
# 2. EMBEDDING & RERANKER
# ==========================================
# Model embedding đa ngôn ngữ chạy qua Ollama
EMBEDDING_MODEL=jeffh/intfloat-multilingual-e5-large-instruct:Q8_0
# Model Cross-Encoder tiếng Việt chạy bằng HuggingFace
RERANKER_MODEL=models--namdp-ptit--ViRanker
OLLAMA_BASE_URL=http://localhost:11434
DEVICE=cpu

# ==========================================
# 3. VECTOR DATABASE (QDRANT)
# ==========================================
QDRANT_HOST=localhost
QDRANT_PORT=6333
QDRANT_COLLECTION=movie_knowledge

# ==========================================
# 4. CƠ SỞ DỮ LIỆU MYSQL
# ==========================================
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=movie_reservation_db

# ==========================================
# 5. GIÁM SÁT HỘI THOẠI (LANGFUSE)
# ==========================================
LANGFUSE_SECRET_KEY=sk-lf-7b9a76f9-4e43-4156-8287-65964e3f9a34
LANGFUSE_PUBLIC_KEY=pk-lf-6ed7cd7b-7907-4c11-972b-ea20d16b1fc2
LANGFUSE_BASE_URL=http://localhost:3300
LANGFUSE_HOST=http://localhost:3300

# ==========================================
# 6. APP SERVICE & SECURITY
# ==========================================
APP_HOST=0.0.0.0
APP_PORT=8001
JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5173
```

> [!NOTE]
> Khi chạy trong môi trường **Docker Compose**, các địa chỉ kết nối nội bộ `localhost` (như MySQL, Qdrant, Ollama, Langfuse) sẽ tự động trỏ đến `host.docker.internal` theo định nghĩa trong `docker-compose.yml`.

---

## 🔄 Khởi Tạo Dữ Liệu & RAG Indexing

### 1. Tạo bảng MySQL cho Chat
Lệnh này tự động tạo 2 bảng:
- `chat_sessions`: Lưu mã session, ID người dùng, trạng thái, thời gian tạo và cập nhật.
- `chat_messages`: Lưu chi tiết từng tin nhắn (user/assistant), role, agent xử lý, action điều hướng và metadata.

```bash
python -m db.init_db
```

### 2. Index toàn bộ phim và tri thức vào Qdrant
Lệnh này đọc dữ liệu từ MySQL (danh sách phim, tóm tắt nội dung, đánh giá, bài báo điện ảnh) và chính sách rạp chiếu, tạo vector embedding rồi lưu vào collection `movie_knowledge` trên Qdrant:

```bash
python -m rag.indexer
```

### 3. Re-index riêng bài báo điện ảnh (sau khi cào mới)
Nếu bạn vừa chạy crawler để lấy thêm tin tức điện ảnh từ NCC và Moveek, hãy làm sạch vector rác và nạp lại tin mới:

```bash
# Qua API:
curl -X POST http://localhost:8001/api/rag/reindex-articles

# Hoặc qua script:
python -c "from rag.indexer import reindex_articles; print(reindex_articles())"
```

---

## 📡 Danh Sách API Endpoints

### 1. Tổng hợp Endpoints

| Phương thức | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/health` | Kiểm tra tình trạng hoạt động và kết nối các dịch vụ phụ trợ |
| `POST` | `/api/chat` | Nhận tin nhắn của người dùng, phân tích ý định và trả lời |
| `GET` | `/api/chat/history/{session_id}` | Lấy toàn bộ lịch sử tin nhắn của một phiên chat |
| `GET` | `/api/chat/sessions` | Lấy danh sách session của user hoặc danh sách quản trị kèm thống kê |
| `DELETE` | `/api/chat/sessions/{session_id}` | Xóa một phiên hội thoại |
| `POST` | `/api/rag/index` | Kích hoạt quét và index toàn bộ dữ liệu MySQL vào Qdrant |
| `POST` | `/api/rag/reindex-articles` | Làm sạch tin tức cũ và index lại các bài báo điện ảnh mới |

---

### 2. Chi tiết Endpoint Trò Chuyện: `POST /api/chat`

#### Headers
- `Content-Type: application/json`
- `Authorization: Bearer <JWT_TOKEN>` *(Tùy chọn - truyền token nếu user đã đăng nhập để AI nhận diện)*

#### Request Body
```json
{
  "message": "Hôm nay có suất chiếu phim Đào, Phở và Piano lúc mấy giờ?",
  "session_id": "optional-uuid-hoac-bo-trong-de-tao-moi",
  "user_id": 1
}
```

#### Response Body
```json
{
  "session_id": "7fa2be8a-e56a-48d6-953e-51c6c0e5a95f",
  "reply": "Dạ hôm nay tại rạp CineMind đang có các suất chiếu phim **Đào, Phở và Piano** vào các khung giờ: **14:30**, **18:15** và **20:45** tại Phòng 02.\n\nBạn có muốn mình hỗ trợ đặt vé cho suất chiếu nào không ạ?",
  "agent_used": "showtime_booking_agent",
  "route_action": {
    "action": "NAVIGATE",
    "route": "/movies/12"
  },
  "tool_calls": [
    {
      "tool": "get_showtimes_sql",
      "args": { "movie_name": "Đào, Phở và Piano", "date": "2026-09-05" }
    }
  ]
}
```

---

## 🧪 Kiểm Thử Nhanh (Smoke Test)

### 1. Kiểm tra Health Check
```bash
curl http://localhost:8001/health
```
Kết quả kỳ vọng:
```json
{
  "status": "healthy",
  "llm_model": "deepseek-chat",
  "embedding_model": "jeffh/intfloat-multilingual-e5-large-instruct:Q8_0",
  "reranker_model": "models--namdp-ptit--ViRanker",
  "mysql_host": "localhost",
  "qdrant_host": "localhost",
  "langfuse_enabled": true
}
```

### 2. Gửi tin nhắn thử nghiệm
```bash
curl -X POST http://localhost:8001/api/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"Chào CineBot, bạn có thể giúp gì cho tôi?\"}"
```

### 3. Chạy script kiểm thử RAG search
```bash
python test_rag_search.py
```

---

## 💻 Tích Hợp Frontend & Admin Dashboard

### 1. Dành cho Khách Hàng (`movie-reservationsystem-fe`)
- **Widget Trợ Lý Ảo**: Nút bấm nổi (Floating AI Trigger) ở góc phải màn hình cho phép người dùng mở khung chat trò chuyện bất kỳ lúc nào.
- **Render Markdown & Code block**: Tin nhắn từ bot hiển thị định dạng danh sách, in đậm, bảng giá vé trực quan.
- **Tự động gắn JWT Token**: Khi người dùng đã đăng nhập vào web khách hàng, token JWT sẽ được tự động đính kèm vào header `Authorization` để bot xưng hô đúng tên và hỗ trợ tra cứu lịch sử mua vé cá nhân.

### 2. Dành cho Quản Trị Viên (`movie-reservation-dashboard`)
- **Trang Quản Lý Hội Thoại AI** (`/admin/chat-sessions`):
  - Hiển thị danh sách tất cả các phiên chat của người dùng trong hệ thống.
  - Thống kê tổng số phiên, tổng số tin nhắn và phiên chat gần nhất.
  - Xem chi tiết từng lượt hỏi đáp giữa khách hàng và các Agent.
  - Hỗ trợ xóa phiên hội thoại rác hoặc không còn cần thiết.

---

## 🛠 Xử Lý Lỗi Thường Gặp (Troubleshooting)

### 1. Lỗi kết nối Qdrant: `Connection refused on port 6333`
- **Nguyên nhân**: Qdrant service chưa được bật.
- **Khắc phục**: Kiểm tra và khởi động container Qdrant:
  ```bash
  docker start qdrant
  ```

### 2. Lỗi kết nối Ollama: `Failed to fetch embeddings from http://localhost:11434`
- **Nguyên nhân**: Ứng dụng Ollama trên máy chưa chạy hoặc chưa tải model embedding.
- **Khắc phục**:
  ```bash
  ollama serve
  ollama pull jeffh/intfloat-multilingual-e5-large-instruct:Q8_0
  ```

### 3. Cảnh báo hoặc lỗi tải PyTorch nặng hơn 2.5 GB khi cài đặt
- **Nguyên nhân**: Cài đặt mặc định `pip install torch` sẽ tải cả thư viện CUDA của NVIDIA.
- **Khắc phục**: Sử dụng flag `--extra-index-url https://download.pytorch.org/whl/cpu`:
  ```bash
  pip install torch --extra-index-url https://download.pytorch.org/whl/cpu
  ```

### 4. Lỗi `Table 'movie_reservation_db.chat_sessions' doesn't exist`
- **Nguyên nhân**: Chưa tạo bảng chat trong MySQL.
- **Khắc phục**: Chạy lệnh khởi tạo:
  ```bash
  python -m db.init_db
  ```
