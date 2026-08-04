# DACN_HTPPNSTM — Hệ Thống Phân Phối Nông Sản Thông Minh

Đồ án chuyên ngành xây dựng nền tảng thương mại điện tử cho nông sản, kết nối cửa hàng/nhà cung cấp, khách hàng, nhân viên vận hành và shipper trên cùng một hệ thống. Dự án tích hợp thanh toán điện tử, truy xuất nguồn gốc bằng blockchain, chatbot AI tư vấn, và nhận diện nông sản qua hình ảnh bằng mô hình học sâu.

📌 Tổng quan

Hệ thống gồm 3 thành phần chính:

Thành phần	Công nghệ	Vai trò
backend/	Node.js, Express, Sequelize	API chính: xác thực, sản phẩm, đơn hàng, thanh toán, blockchain, realtime
frontend/	React 19, Vite, TailwindCSS	Giao diện web cho khách hàng, cửa hàng và quản trị
modelAI/	Python, Flask, TensorFlow	Nhận diện rau củ quả qua ảnh + gợi ý sản phẩm
✨ Tính năng chính
Đa vai trò người dùng: Khách hàng, Cửa hàng/Nhà cung cấp, Nhân viên, Quản trị viên, Nhân viên giao hàng
Quản lý sản phẩm & danh mục kèm đánh giá sản phẩm và đánh giá cửa hàng
Giỏ hàng, đặt hàng, khuyến mãi và theo dõi trạng thái đơn hàng theo thời gian thực (Socket.IO)
RFQ (Request for Quotation) — cho phép khách sỉ/đối tác gửi yêu cầu báo giá cho nhà cung cấp
Thanh toán đa kênh: PayPal, ví điện tử nội bộ (wallet)
Truy xuất nguồn gốc bằng Blockchain cho chuỗi cung ứng nông sản
Trợ lý AI (chatbot) sử dụng Google Gemini để tư vấn, hỗ trợ khách hàng
Nhận diện nông sản qua hình ảnh (35+ loại rau củ quả) bằng mô hình TensorFlow/Keras
Gợi ý sản phẩm thông minh dựa trên giỏ hàng hiện tại
Quản lý giao hàng & vận đơn, tích hợp dữ liệu địa chỉ hành chính Việt Nam và Google Places Autocomplete
Mã QR cho đơn hàng/vận đơn, xác thực JWT, gửi email tự động
🛠️ Công nghệ sử dụng

Backend

Node.js + Express, Sequelize (MySQL) / mssql
Socket.IO (realtime), JWT + bcrypt (xác thực)
PayPal Checkout SDK, Google Generative AI SDK
Multer (upload file), Nodemailer, QRCode, Vietnam Provinces

Frontend

React 19 + Vite, TailwindCSS 4, Radix UI, shadcn-style components
React Router 7, React Hook Form + Zod, Zustand (state management)
Axios, Socket.IO Client, PayPal React SDK, Sass/Bootstrap

Model AI

Python, Flask + Flask-CORS
TensorFlow/Keras (mô hình phân loại ảnh fruit_veg_model.h5)
Pillow (xử lý ảnh), SQLAlchemy/PyMySQL (đọc dữ liệu gợi ý sản phẩm từ MySQL)
📂 Cấu trúc thư mục
DACN_HTPPNSTM/
├── backend/            # REST API (Express) — auth, sản phẩm, đơn hàng, thanh toán, blockchain...
│   └── src/
│       ├── config/      # Cấu hình DB
│       ├── controllers/ # Xử lý nghiệp vụ
│       └── routes/      # Định tuyến API
├── frontend/            # Giao diện web (React + Vite)
│   └── src/
├── modelAI/              # Service AI (Flask) — nhận diện ảnh + gợi ý sản phẩm
│   └── app.py
├── package.json
└── README.md
🚀 Bắt đầu nhanh
Yêu cầu hệ thống
Node.js ≥ 18
Python ≥ 3.9
MySQL Server
1. Clone dự án
bash
git clone https://github.com/FingTw/DACN_HTPPNSTM.git
cd DACN_HTPPNSTM
2. Cài đặt & chạy Backend
bash
cd backend
npm install

Tạo file .env trong thư mục backend/ với các biến môi trường cần thiết, ví dụ:

env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=nong_san_db
JWT_SECRET=your_jwt_secret
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
GEMINI_API_KEY=your_google_generative_ai_key

Chạy server (chế độ phát triển):

bash
npm run dev
3. Cài đặt & chạy Frontend
bash
cd frontend
npm install
npm run dev
4. Cài đặt & chạy Model AI
bash
cd modelAI
pip install flask flask-cors tensorflow pillow sqlalchemy pymysql numpy
python app.py

⚠️ Đảm bảo cơ sở dữ liệu MySQL nong_san_db đã được tạo và cấu hình kết nối trong modelAI/app.py khớp với môi trường của bạn trước khi chạy service này.

🗺️ API tổng quan

Backend cung cấp các nhóm route chính (xem chi tiết trong backend/src/routes/):

auth — đăng ký, đăng nhập, xác thực JWT
sanpham, danhmuc — sản phẩm, danh mục
cuahang, danhGiaCuaHang, danhGiaSanPham — cửa hàng và đánh giá
cart, order, khuyenmai — giỏ hàng, đơn hàng, khuyến mãi
rfq — yêu cầu báo giá (B2B)
payment, wallet, blockchain — thanh toán và truy xuất nguồn gốc
admin, employee, delivery — quản trị, nhân sự, vận chuyển
ai — chatbot tư vấn (Gemini)

