from flask import Flask, request, jsonify
import tensorflow as tf
import numpy as np
from PIL import Image
import os
from werkzeug.utils import secure_filename
from flask_cors import CORS
from recommender import ProductRecommender

app = Flask(__name__)
CORS(app)

DB_USER = 'root'          
DB_PASSWORD = ''          
DB_HOST = 'localhost'    
DB_NAME = 'nong_san_db'

DB_CONNECTION_STRING = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"

recommender = ProductRecommender(db_config=DB_CONNECTION_STRING)

try:
    model = tf.keras.models.load_model("fruit_veg_model.h5")
    print("✅ Model loaded successfully!")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None

try:
    recommender.load_data_from_db()
except Exception as e:
    print(f"❌ Không thể khởi tạo Recommender từ DB: {e}")

# 🟢 DANH SÁCH ĐẦY ĐỦ CLASS NAMES
CLASS_NAMES = [
    'apple', 'banana', 'beetroot', 'bell pepper', 'cabbage', 'capsicum', 
    'carrot', 'cauliflower', 'chilli pepper', 'corn', 'cucumber', 
    'eggplant', 'garlic', 'ginger', 'grapes', 'jalepeno', 'kiwi', 
    'lemon', 'lettuce', 'mango', 'onion', 'orange', 'paprika', 
    'pear', 'peas', 'pineapple', 'pomegranate', 'potato', 'raddish', 
    'soy beans', 'spinach', 'sweetcorn', 'sweetpotato', 'tomato', 
    'turnip', 'watermelon'
]

# 🟢 CẤU HÌNH UPLOAD
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

# 🟢 TẠO THƯ MỤC UPLOAD NẾU CHƯA TỒN TẠI
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# 🟢 KIỂM TRA FILE HỢP LỆ
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# 🟢 HÀM XỬ LÝ ẢNH
def preprocess_image(image):
    image = image.resize((224, 224))      # resize đúng input model
    image = np.array(image) / 255.0       # chuẩn hóa pixel
    image = np.expand_dims(image, axis=0) # thêm batch dimension
    return image

# 🟢 HÀM DỰ ĐOÁN
def predict_image(image):
    if model is None:
        return None, 0.0
    
    processed_image = preprocess_image(image)
    pred = model.predict(processed_image, verbose=0)
    class_idx = int(np.argmax(pred))
    confidence = float(np.max(pred))
    return class_idx, confidence

# 🟢 API GỢI Ý SẢN PHẨM (Đã dùng dữ liệu thật)
@app.route("/recommend", methods=["POST"])
def recommend_products():
    try:
        data = request.get_json()
        if not data or 'cart' not in data:
            return jsonify({"success": False, "message": "Thiếu thông tin 'cart'"}), 400
            
        current_cart = data['cart'] # List tên sản phẩm, VD: ["Cà chua", "Trứng"]
        
        # Gọi hàm gợi ý
        recommendations = recommender.recommend(current_cart, top_n=5)
        
        return jsonify({
            "success": True,
            "input_cart": current_cart,
            "recommendations": recommendations,
            "source": "database_history"
        })

    except Exception as e:
        print(f"❌ Lỗi gợi ý: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

# 🟢 API TRAIN LẠI MODEL (Gọi thủ công khi cần update dữ liệu mới từ DB)
@app.route("/retrain", methods=["POST"])
def retrain_model():
    try:
        recommender.load_data_from_db()
        return jsonify({
            "success": True, 
            "message": "Đã tải lại dữ liệu từ Database và train lại model."
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# 🟢 API DỰ ĐOÁN
@app.route("/predict", methods=["POST"])
def predict():
    try:
        # Kiểm tra file có tồn tại không
        if 'file' not in request.files:
            return jsonify({
                "success": False,
                "message": "Không tìm thấy file trong request"
            }), 400
        
        file = request.files['file']
        
        # Kiểm tra file có tên không
        if file.filename == '':
            return jsonify({
                "success": False,
                "message": "Không có file được chọn"
            }), 400
        
        # Kiểm tra định dạng file
        if file and allowed_file(file.filename):
            # Lưu file để debug (tùy chọn)
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            # Mở và xử lý ảnh
            img = Image.open(filepath)
            
            # Chuyển đổi sang RGB nếu cần
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Dự đoán
            class_idx, confidence = predict_image(img)
            
            if class_idx is None:
                return jsonify({
                    "success": False,
                    "message": "Lỗi model, không thể dự đoán"
                }), 500
            
            # Xóa file tạm sau khi xử lý
            try:
                os.remove(filepath)
            except:
                pass
            
            # Format tên class (viết hoa chữ cái đầu)
            class_name = CLASS_NAMES[class_idx].title()
            
            return jsonify({
                "success": True,
                "data": {
                    "class": class_name,
                    "class_original": CLASS_NAMES[class_idx],
                    "confidence": round(confidence * 100, 2),  # phần trăm
                    "class_index": class_idx
                },
                "message": "Dự đoán thành công"
            })
        else:
            return jsonify({
                "success": False,
                "message": "Định dạng file không hợp lệ. Chỉ chấp nhận: PNG, JPG, JPEG, GIF, BMP"
            }), 400
            
    except Exception as e:
        print(f"❌ Lỗi dự đoán: {e}")
        return jsonify({
            "success": False,
            "message": f"Lỗi server: {str(e)}"
        }), 500

# 🟢 API KIỂM TRA SỨC KHỎE
@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "success": True,
        "message": "Server đang hoạt động",
        "model_loaded": model is not None,
        "total_classes": len(CLASS_NAMES)
    })

# 🟢 API LẤY DANH SÁCH CLASS
@app.route("/classes", methods=["GET"])
def get_classes():
    return jsonify({
        "success": True,
        "data": {
            "classes": CLASS_NAMES,
            "total": len(CLASS_NAMES)
        }
    })

# 🟢 API DỰ ĐOÁN TỪ URL
@app.route("/predict-url", methods=["POST"])
def predict_from_url():
    try:
        data = request.get_json()
        
        if not data or 'image_url' not in data:
            return jsonify({
                "success": False,
                "message": "Thiếu image_url trong request"
            }), 400
        
        image_url = data['image_url']
        
        # Ở đây bạn có thể thêm code để download ảnh từ URL
        # Tạm thời trả về thông báo
        return jsonify({
            "success": False,
            "message": "Tính năng dự đoán từ URL đang được phát triển"
        }), 501
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Lỗi server: {str(e)}"
        }), 500

# 🟢 XỬ LÝ LỖI 404
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "success": False,
        "message": "Endpoint không tồn tại"
    }), 404

# 🟢 XỬ LÝ LỖI 500
@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        "success": False,
        "message": "Lỗi server nội bộ"
    }), 500

if __name__ == "__main__":
    print("🚀 Starting Fruit & Vegetable Classification Server...")
    print(f"📊 Total classes: {len(CLASS_NAMES)}")
    print("🌱 Available classes:", CLASS_NAMES)
    
    if model is not None:
        print("✅ Model ready for predictions!")
    else:
        print("❌ Model not loaded - running in limited mode")
    
    app.run(debug=True, host='0.0.0.0', port=5000)