// pages/MyStoreRedirect.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cuahangService } from "../services/cuahangService"; // Import service bạn đã có

const MyStoreRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyStore = async () => {
      try {
        // 1. Gọi API lấy thông tin cửa hàng của user đang đăng nhập
        // Hàm này đã có sẵn trong file cuahangService.ts bạn gửi
        const myStore = await cuahangService.getMyStore();

        if (myStore && myStore.MaCH) {
          // 2. Nếu ĐÃ có cửa hàng -> Chuyển hướng thẳng vào trang chi tiết
          console.log("✅ Tìm thấy cửa hàng:", myStore.MaCH);
          navigate(`/cuahang/${myStore.MaCH}`);
        } else {
          // 3. Nếu CHƯA có cửa hàng -> Chuyển hướng sang trang đăng ký
          console.log("⚠️ Chưa có cửa hàng, chuyển sang đăng ký");
          navigate("/signupshop"); // Hoặc trang nào bạn dùng để tạo shop
        }
      } catch (error) {
        console.error("❌ Lỗi kiểm tra cửa hàng:", error);
        navigate("/signin");
      }
    };

    fetchMyStore();
  }, [navigate]);

  // Hiển thị màn hình loading trong lúc đang kiểm tra
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Đang truy cập cửa hàng của bạn...</p>
      </div>
    </div>
  );
};

export default MyStoreRedirect;
