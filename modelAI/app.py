from flask import Flask, request, jsonify
import tensorflow as tf
import numpy as np
from PIL import Image

app = Flask(__name__)

# Load model khi khởi động server
model = tf.keras.models.load_model("fruit_veg_model.h5")


CLASS_NAMES = ["Apple", "Banana", "Orange", "Tomato", "Cucumber"]

# Hàm xử lý ảnh
def preprocess_image(image):
    image = image.resize((224, 224))      # resize đúng input model
    image = np.array(image) / 255.0       # chuẩn hóa pixel
    image = np.expand_dims(image, axis=0) # thêm batch dimension
    return image

@app.route("/predict", methods=["POST"])
def predict():
    file = request.files["file"]
    img = Image.open(file)
    img = preprocess_image(img)
    pred = model.predict(img)
    class_idx = int(np.argmax(pred))
    confidence = float(np.max(pred))
    return jsonify({
        "class": CLASS_NAMES[class_idx],
        "confidence": confidence
    })

if __name__ == "__main__":
    app.run(debug=True)
