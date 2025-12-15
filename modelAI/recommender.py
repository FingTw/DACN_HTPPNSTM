# fileName: recommender.py
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy import create_engine
import numpy as np

class ProductRecommender:
    def __init__(self, db_config=None):
        self.similarity_matrix = None
        self.product_list = []
        # Cấu hình kết nối DB
        # db_config format: "mysql+pymysql://user:password@host/db_name"
        self.db_engine = create_engine(db_config) if db_config else None

    def load_data_from_db(self):
        """
        Kết nối Database, lấy dữ liệu đơn hàng thực tế và train model.
        """
        if not self.db_engine:
            print("⚠️ Chưa cấu hình Database connection string.")
            return

        print("🔄 Đang lấy dữ liệu từ Database...")

        # 1. Câu lệnh SQL để lấy các sản phẩm trong các đơn hàng đã hoàn thành
        # Chúng ta JOIN 3 bảng: donhang -> chitiet_donhang -> sanpham
        # Chỉ lấy đơn hàng có trạng thái 'Hoàn thành' hoặc 'Đã giao' (tuỳ logic của bạn)
        query = """
        SELECT 
            dh.MaDH, 
            sp.TenSP
        FROM donhang dh
        JOIN chitiet_donhang ctdh ON dh.MaDH = ctdh.MaDH
        JOIN sanpham sp ON ctdh.MaSP = sp.MaSP
        WHERE dh.TrangThai IN ('Hoàn thành', 'Đã giao', 'Chờ xác nhận', 'Đang giao hàng') 
        ORDER BY dh.MaDH
        """

        try:
            # Đọc dữ liệu vào DataFrame
            df = pd.read_sql(query, self.db_engine)

            if df.empty:
                print("⚠️ Không tìm thấy dữ liệu đơn hàng nào trong DB.")
                return

            print(f"📊 Đã tải {len(df)} dòng dữ liệu chi tiết đơn hàng.")

            # 2. Gom nhóm: Chuyển đổi từ dạng bảng dọc sang dạng list of lists
            # Từ:
            # MaDH | TenSP
            # DH01 | Táo
            # DH01 | Cam
            # DH02 | Chuối
            #
            # Thành: [['Táo', 'Cam'], ['Chuối']]
            
            transactions = df.groupby('MaDH')['TenSP'].apply(list).tolist()
            
            # 3. Train model với dữ liệu vừa lấy
            self.fit(transactions)

        except Exception as e:
            print(f"❌ Lỗi khi đọc dữ liệu từ DB: {e}")

    def fit(self, transactions):
        """
        Train model dựa trên danh sách các đơn hàng.
        """
        print(f"🔄 Bắt đầu training với {len(transactions)} đơn hàng...")
        
        # Lấy tất cả sản phẩm duy nhất
        unique_products = sorted(list(set(item for sublist in transactions for item in sublist)))
        self.product_list = unique_products

        if not unique_products:
            print("⚠️ Không có sản phẩm nào để train.")
            return

        # Tạo ma trận dữ liệu (Orders x Products)
        # Sử dụng phương pháp vector hóa nhanh hơn loop thường
        # Cách đơn giản: Dùng pandas get_dummies hoặc crosstab (nhưng cần flatten data trước)
        
        # Cách thủ công nhưng kiểm soát tốt:
        data = []
        for transaction in transactions:
            row = {product: 0 for product in unique_products}
            for item in transaction:
                if item in unique_products:
                    row[item] = 1
            data.append(row)
        
        df_matrix = pd.DataFrame(data)

        # Tính toán Item-Item Similarity
        item_matrix = df_matrix.T 
        sim_matrix = cosine_similarity(item_matrix)
        
        self.similarity_matrix = pd.DataFrame(
            sim_matrix, 
            index=unique_products, 
            columns=unique_products
        )
        print("✅ Training hoàn tất!")

    def recommend(self, current_cart, top_n=5):
        """
        Gợi ý sản phẩm dựa trên giỏ hàng hiện tại.
        """
        if self.similarity_matrix is None:
            return []

        # Chuẩn hóa tên sản phẩm trong giỏ (lowercase hoặc title case tuỳ dữ liệu DB)
        # Ở đây giả sử DB lưu Title Case (VD: Apple) nhưng input có thể là lowercase
        # Bạn cần đảm bảo logic so sánh chuỗi khớp nhau
        
        valid_items = [item for item in current_cart if item in self.product_list]
        
        if not valid_items:
            return []

        similar_scores = pd.Series(dtype=float)

        for item in valid_items:
            if item in self.similarity_matrix.columns:
                item_scores = self.similarity_matrix[item]
                if similar_scores.empty:
                    similar_scores = item_scores
                else:
                    similar_scores = similar_scores.add(item_scores, fill_value=0)

        similar_scores = similar_scores.drop(valid_items, errors='ignore')
        recommendations = similar_scores.sort_values(ascending=False).head(top_n)
        
        results = []
        for product, score in recommendations.items():
            results.append({
                "product": product,
                "score": round(score, 4)
            })
            
        return results