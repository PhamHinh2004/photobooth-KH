# TÀI LIỆU HỆ THỐNG AI CHATBOX & TRỢ LÝ TẠO DÁNG (PHOTOBOOTH STYLIST)

> **Dự án:** KH Photobooth  
> **Module Backend:** `src/modules/chatbox`  
> **Kiến trúc:** Multi-Model AI Engine với Failover tự động (Gemini 2.0 Flash / Groq Llama 3.3 / OpenRouter / Local Expert Engine) + RAG theo Frame Database thực tế.

---

## 1. Tổng quan & Mục tiêu

Chatbox trong hệ thống KH Photobooth không phải là một chatbot thông thường chỉ query DB hay trả lời câu mẫu cứng nhắc, mà là một **Trợ lý AI Nhiếp ảnh & Stylist Studio (AI Photobooth Copilot)**. Trợ lý này sở hữu tư duy phân tích không gian chụp, phối hợp nhóm, am hiểu các tỷ lệ khung hình và tâm lý khách hàng để:

1. **Điều phối quy trình chụp**: Hướng dẫn khách chụp đơn hoặc chụp nhóm từ 2 đến 6+ người (mẹo đứng, khoảng cách với lens, phân tầng độ cao tránh che khuất mặt).
2. **Tư vấn chọn Khung ảnh (Frame Advisor)**: Phân tích dựa trên dữ liệu Frame thực tế trong database (chiều rộng, chiều cao, tỷ lệ, số slot ô ảnh) để gợi ý frame ổn định và giải thích lý do vì sao.
3. **Lên Kịch bản Tạo dáng (Posing Script Generator)**: Xây dựng kịch bản chia theo từng hiệp (ví dụ Frame 4x2 có 8 slot chia làm 2 hiệp chụp 4 shot), phân vai cụ thể từng người (ai ngồi, ai đứng, ai làm điểm tựa) theo nhiều style: *Vui vẻ*, *Nghiêm túc*, *Năng động*, *Tình cảm*, *Gen Z*, *Cool ngầu*.
4. **Sáng tạo Caption & Hashtags**: Soạn caption đa dạng phong cách (thả thính, hài hước, kỷ niệm, song ngữ) để khách hàng đăng lên Bảng tin Social của app hoặc Instagram/TikTok/Facebook.
5. **Tra cứu thông số kỹ thuật Frame**: Chiều rộng, chiều cao canvas, kích thước từng ô slot, tỷ lệ tương thích.

---

## 2. Kiến trúc Multi-Model AI & Cơ chế Failover (Chống cạn Token)

Để tối ưu chi phí và đảm bảo hệ thống **luôn luôn phản hồi 100% không bao giờ sập hay báo lỗi 500**, backend sử dụng cơ chế **Failover tự động qua nhiều tầng nhà cung cấp (Cascade Fallback)**:

```mermaid
graph TD
    User([Người dùng / Client UI]) --> API[/api/v1/chatbox]
    API --> Controller[ChatboxController]
    Controller --> Service[ChatboxService]
    Service -->|RAG Context: Frames DB| DB[(Postgres Frame Table)]
    Service --> MultiAI[AiProviderService]
    
    MultiAI -->|Tầng 1: Ưu tiên| Gemini[Google Gemini 2.0 Flash API<br/>Miễn phí, 15 RPM, 1M TPM]
    Gemini -- Lỗi 429 / Quota / Timeout --> Groq[Groq Cloud API<br/>Llama 3.3 70B, Siêu nhanh, Miễn phí]
    Groq -- Lỗi 429 / Quota / Timeout --> OpenRouter[OpenRouter Free Tier<br/>Llama 3.3 Instruct Free]
    OpenRouter -- Hết token / Không có key --> LocalEngine[PhotoboothKnowledgeService<br/>Heuristic Expert Rule Engine Cục bộ]
    
    Gemini --> Result([Kết quả thông minh cho người dùng])
    Groq --> Result
    OpenRouter --> Result
    LocalEngine --> Result
```

### Chi tiết các tầng Model:
1. **Tầng 1 - Google Gemini (`gemini-2.0-flash` / `gemini-1.5-flash`)**:
   - Model chính với khả năng suy luận logic xuất sắc, hiểu tiếng Việt rất tự nhiên.
   - Gói miễn phí từ Google AI Studio hỗ trợ hạn mức rất cao: **15 requests/phút (RPM)** và **1.500 requests/ngày (RPD)**.
2. **Tầng 2 - Groq Cloud (`llama-3.3-70b-versatile`)**:
   - Tự động nhảy qua khi Gemini chạm ngưỡng rate limit hoặc lỗi mạng.
   - Tốc độ xử lý cực nhanh (vài trăm token/giây), miễn phí và hỗ trợ suy luận sắc bén.
3. **Tầng 3 - OpenRouter Free Tier (`meta-llama/llama-3.3-70b-instruct:free`)**:
   - Dự phòng thêm một lớp dịch vụ AI bên ngoài khi các nhà cung cấp trên bảo trì hoặc cạn quota.
4. **Tầng 4 - Local Photobooth Knowledge Engine (`photobooth-expert-v1`)**:
   - Được nạp sẵn toàn bộ thuật toán phân tích tỷ lệ khung ảnh, kịch bản tạo dáng từng shot theo lượt, thư viện caption đa phong cách.
   - **Tác dụng:** Dù người phát triển chưa điền API Key hoặc khi rớt mạng internet hoàn toàn, hệ thống vẫn trả về kịch bản pose và phân tích frame chuẩn xác!

---

## 3. Các Tính năng & Quy tắc Nghiệp vụ Chuyên sâu

### 3.1. Quy trình Chụp Đơn vs Chụp Nhóm
| Tiêu chí | Chụp Đơn (Single Session) | Chụp Nhóm (Group Session - ví dụ 4 người) |
| :--- | :--- | :--- |
| **Trọng tâm bố cục** | Chân dung cận cảnh / Bán thân, bắt trọn 4 góc mặt. | Phân tầng độ cao (Layering): 2 người ngồi trước, 2 người đứng sau nghiêng vai vào giữa. |
| **Khoảng cách camera** | 1.2m - 1.5m thẳng tầm mắt. | 1.8m - 2.2m để bao quát toàn bộ nhóm không bị lẹm góc ngoài. |
| **Thời gian đếm ngược** | 3 - 5 giây là đủ để đổi góc mặt. | 5 - 7 giây, cần 1 bạn hô nhịp "3-2-1" để cả nhóm đổi pose đồng bộ. |
| **Frame khuyên dùng** | **Strip 1x4** hoặc **Grid 2x2 vuông**. | **Grid 4x2** (8 ô), **Grid 2x4**, hoặc **Grid 3x2** (6 ô). |

---

### 3.2. Phân tích Frame & Lý do đề xuất
- **Frame Strip 1x4 (Dải 4 ảnh dọc phong cách Hàn Quốc)**:
  - *Chụp đơn/đôi:* 10/10 điểm. Tôn trọn biểu cảm khuôn mặt từ trên xuống dưới.
  - *Nhóm 4 người:* 4/10 điểm. Chiều ngang slot quá hẹp, nhóm 4 người sẽ phải đứng ép sát nhau, người đứng sau dễ bị che mất mặt.
- **Frame Grid 4x2 (8 ô ảnh xếp dạng 4 hàng x 2 cột)**:
  - *Chụp đơn:* 6/10 điểm. 8 ô ảnh quá nhiều cho 1 người, dễ bị bí ý tưởng pose.
  - *Nhóm 4 người:* **10/10 điểm (Tối ưu tuyệt đối)**. 
    - Cho phép chia làm **2 hiệp chụp** (Hiệp 1: 4 ô đầu, Hiệp 2: 4 ô sau).
    - Cả 4 người có thể vừa chụp chung tập thể, vừa chia cặp 2-2 hoặc chụp solo mà không bị giới hạn slot.

---

### 3.3. Kịch bản Pose Nhóm 4 người với Frame 4x2 theo Phong cách

#### Ví dụ: Phong cách "Vui vẻ / Nhí nhảnh (Gen Z)"
* **Hiệp 1: Đồng bộ và gắn kết (Shot 1 - 4)**
  * **Shot 1 - Đội hình Kim Tự Tháp**: 2 bạn ngồi trước tựa vai nhau cười tươi; 2 bạn đứng sau tựa cằm lên vai bạn trước.
  * **Shot 2 - Biểu cảm mỗi người một vẻ**: Bạn 1 phồng má đáng yêu, bạn 2 làm kính ngố bằng tay, bạn 3 nháy mắt v-sign, bạn 4 cười tít mắt.
  * **Shot 3 - Trái tim khổng lồ (Group Heart)**: 2 bạn rìa ngoài ghép tay làm vòng cung tim lớn bao bọc 2 bạn ở giữa.
  * **Shot 4 - Nhìn nhau bật cười (Candid Moment)**: 4 bạn cùng quay mặt nhìn nhau và cười tự nhiên như vừa nghe câu chuyện cười.
* **Hiệp 2: Bùng nổ phụ kiện & Đổi vai trò (Shot 5 - 8)**
  * **Shot 5 - Hoán đổi vị trí**: 2 bạn đứng chuyển sang ngồi ghế, 2 bạn ngồi bước ra sau làm điểm tựa.
  * **Shot 6 - Phụ kiện Swag**: Cả nhóm cùng đeo kính đen ngầu hoặc bờm tai thỏ/tai gấu.
  * **Shot 7 - Dìm hàng nhân vật chính**: 3 bạn cùng chỉ tay / trêu chọc bạn nhân vật chính ở giữa.
  * **Shot 8 - High-Five chào tạm biệt**: Cả nhóm cùng vẫy tay hoặc chạm tay high-five khép lại phiên chụp.

#### Ví dụ: Phong cách "Nghiêm túc / High-Fashion"
* Mặt lạnh cuốn hút, chống cằm nghiêng 30 độ, ánh mắt sắc sảo nhìn thẳng ống kính mô phỏng bìa tạp chí Vogue.

---

## 4. Hướng dẫn Cấu hình API Keys (`.env`)

Mở file `Back-end/photobooth-backend/.env` và thêm các biến môi trường sau (tùy chọn hoặc cả 3 để kích hoạt Failover):

```env
# ================================
# AI Model Providers (Chatbox Stylist)
# ================================
# 1. Google Gemini (Lấy key miễn phí tại: https://aistudio.google.com/)
GEMINI_API_KEY=AIzaSy...

# 2. Groq Cloud (Lấy key miễn phí siêu nhanh tại: https://console.groq.com/)
GROQ_API_KEY=gsk_...

# 3. OpenRouter (Lấy key tại: https://openrouter.ai/)
OPENROUTER_API_KEY=sk-or-v1-...
```

> **Lưu ý:** Nếu bạn chưa có API key ngay lập tức, hệ thống sẽ tự động dùng **Local Heuristic Expert Engine** mà không gây ra bất kỳ lỗi nào!

---

## 5. Danh sách REST API Endpoints

### 5.1. Chat trò chuyện tự do (`POST /api/v1/chatbox/message`)
* **URL:** `http://localhost:3000/api/v1/chatbox/message`
* **Method:** `POST`
* **Request Body:**
```json
{
  "message": "Gợi ý cho mình pose chụp nhóm 4 người với frame 4x2 phong cách vui vẻ",
  "memberCount": 4,
  "style": "vui_ve",
  "frameId": "uuid-cua-frame-neu-co",
  "history": []
}
```
* **Response Mẫu:**
```json
{
  "success": true,
  "reply": "Chào bạn! Với nhóm 4 người và Frame 4x2 (8 ô ảnh), mình khuyên bạn chia thành 2 hiệp chụp...",
  "provider": "gemini",
  "modelUsed": "gemini-2.0-flash",
  "context": {
    "frameId": "uuid-cua-frame",
    "memberCount": 4
  }
}
```

---

### 5.2. Sinh kịch bản Tạo dáng chi tiết (`POST /api/v1/chatbox/suggest-pose`)
* **URL:** `http://localhost:3000/api/v1/chatbox/suggest-pose`
* **Request Body:**
```json
{
  "frameIdOrRatio": "4x2",
  "memberCount": 4,
  "style": "vui_ve",
  "notes": "Có mang theo kính đen và băng đô tai thỏ"
}
```
* **Response Mẫu:**
Trả về cả phân tích AI dạng văn bản chi tiết và cấu trúc mảng `rounds -> shots` có sẵn các bước hướng dẫn cụ thể từng người.

---

### 5.3. Gợi ý Frame phù hợp từ Database (`POST /api/v1/chatbox/suggest-frame`)
* **URL:** `http://localhost:3000/api/v1/chatbox/suggest-frame`
* **Request Body:**
```json
{
  "memberCount": 4,
  "sessionType": "group",
  "conceptOrTheme": "Hội bạn thân kỷ niệm tốt nghiệp"
}
```
* **Response Mẫu:**
```json
{
  "success": true,
  "memberCount": 4,
  "recommendedFrames": [
    {
      "id": "2b6b15a6-...",
      "name": "Vintage 4x2 Besties",
      "aspect_ratio": "4x2",
      "slotsCount": 8,
      "suitabilityScore": 10,
      "suitabilityReason": "Tuyệt phẩm cho nhóm từ 3 - 6 người! Bố cục 8 ô cho phép chia thành 2 hiệp chụp..."
    }
  ],
  "advice": "Đối với nhóm 4 người trở lên, các frame dạng lưới 4x2, 2x4 hoặc 3x2 là lựa chọn tối ưu nhất..."
}
```

---

### 5.4. Gợi ý Caption & Hashtags (`POST /api/v1/chatbox/suggest-caption`)
* **URL:** `http://localhost:3000/api/v1/chatbox/suggest-caption`
* **Request Body:**
```json
{
  "concept": "Đi chụp photobooth kỷ niệm 4 năm bạn thân cùng nhau",
  "mood": "gen_z",
  "memberCount": 4,
  "keywords": "quẩy hết mình, thanh xuân, 10 điểm"
}
```

---

### 5.5. Tra cứu & Phân tích thông số kỹ thuật Frame (`GET /api/v1/chatbox/specs/:frameId`)
* **URL:** `http://localhost:3000/api/v1/chatbox/specs/{frameId}`
* **Response:**
Bao gồm `canvas_width`, `canvas_height`, số lượng ô slot, kích thước từng ô, đánh giá điểm phù hợp cho chụp đơn (single) và chụp nhóm (group).
