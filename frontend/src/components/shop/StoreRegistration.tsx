import React, { useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Store,
  FileText,
} from "lucide-react";
import { cuahangService } from "@/services/cuahangService";

interface FormData {
  TenCH: string;
  MaHA_CuaHang: string;
  LoaiHinhKD: string;
  MaSoThue: string;
  DCLayHang: string;
}

const StoreRegistration: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<FormData>({
    TenCH: "",
    MaHA_CuaHang: "",
    LoaiHinhKD: "Bán lẻ",
    MaSoThue: "",
    DCLayHang: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (step === 1 && formData.TenCH.trim()) setStep(2);
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
  };

  const handleSubmit = async () => {
    const dataToSubmit = {
      TenCH: formData.TenCH,
      LoaiHinhKD: formData.LoaiHinhKD,
      ...(formData.MaHA_CuaHang && { MaHA_CuaHang: formData.MaHA_CuaHang }),
      ...(formData.MaSoThue && { MaSoThue: formData.MaSoThue }),
      ...(formData.DCLayHang && { DCLayHang: formData.DCLayHang }),
    };

    try {
      const result = await cuahangService.create(dataToSubmit);
      if (result) {
        alert(`🎉 Đăng ký thành công!\nCửa hàng: ${formData.TenCH}`);
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Lỗi đăng ký:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <a
            href="/"
            className="inline-flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity"
          >
            <img src="/logo.png" alt="SAP" className="h-12 w-auto" />
            <div className="text-left">
              <div className="text-2xl font-bold text-green-700">SAP</div>
              <div className="text-xs text-green-600">NÔNG SẢN VIỆT</div>
            </div>
          </a>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">
            Đăng ký Cửa hàng
          </h1>
          <p className="text-gray-600 mt-2">Bắt đầu kinh doanh nông sản Việt</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              step === 1
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {step > 1 ? (
              <Check className="w-4 h-4" />
            ) : (
              <Store className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">Thông tin cơ bản</span>
          </div>
          <div
            className={`w-12 h-0.5 ${
              step === 2 ? "bg-green-600" : "bg-gray-300"
            }`}
          />
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              step === 2
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium">Thông tin kinh doanh</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {step === 1 ? "Thông tin Cửa hàng" : "Thông tin Kinh doanh"}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {step === 1
                ? "Điền thông tin cơ bản về cửa hàng của bạn"
                : "Hoàn tất thông tin để bắt đầu kinh doanh"}
            </p>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {step === 1 ? (
                <>
                  <div className="space-y-2">
                    <label
                      htmlFor="TenCH"
                      className="text-sm font-medium text-gray-900"
                    >
                      Tên Cửa hàng <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="TenCH"
                      name="TenCH"
                      type="text"
                      value={formData.TenCH}
                      onChange={handleInputChange}
                      placeholder="VD: Nông sản Đồng Tháp"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="MaHA_CuaHang"
                      className="text-sm font-medium text-gray-900"
                    >
                      Mã hình ảnh đại diện
                    </label>
                    <input
                      id="MaHA_CuaHang"
                      name="MaHA_CuaHang"
                      type="text"
                      value={formData.MaHA_CuaHang}
                      onChange={handleInputChange}
                      placeholder="VD: IMG_001 (Tùy chọn)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500">
                      Để trống nếu chưa có hình ảnh
                    </p>
                  </div>

                  <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                    <p className="text-sm text-green-800">
                      <strong>Gợi ý:</strong> Tên cửa hàng nên ngắn gọn, dễ nhớ
                      và thể hiện sản phẩm nông sản đặc trưng.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label
                      htmlFor="LoaiHinhKD"
                      className="text-sm font-medium text-gray-900"
                    >
                      Loại hình kinh doanh
                    </label>
                    <select
                      id="LoaiHinhKD"
                      name="LoaiHinhKD"
                      value={formData.LoaiHinhKD}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="Bán lẻ">Bán lẻ</option>
                      <option value="Bán sỉ">Bán sỉ</option>
                      <option value="Cả hai">Cả hai (Bán sỉ & lẻ)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="MaSoThue"
                      className="text-sm font-medium text-gray-900"
                    >
                      Mã số thuế
                    </label>
                    <input
                      id="MaSoThue"
                      name="MaSoThue"
                      type="text"
                      value={formData.MaSoThue}
                      onChange={handleInputChange}
                      placeholder="VD: 0123456789 (Tùy chọn)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500">
                      Dành cho hộ kinh doanh/doanh nghiệp đã đăng ký
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="DCLayHang"
                      className="text-sm font-medium text-gray-900"
                    >
                      Địa chỉ kho/lấy hàng
                    </label>
                    <textarea
                      id="DCLayHang"
                      name="DCLayHang"
                      value={formData.DCLayHang}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="VD: 123 Nguyễn Văn Cừ, An Khánh, Ninh Kiều, Cần Thơ"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                    <p className="text-sm text-green-800">
                      <strong>Sắp hoàn tất!</strong> Sau khi đăng ký, bạn có thể
                      bắt đầu đăng sản phẩm ngay.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleBack}
                disabled={step === 1}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Quay lại
              </button>

              {step === 1 ? (
                <button
                  onClick={handleNext}
                  disabled={!formData.TenCH.trim()}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Tiếp tục
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Hoàn tất đăng ký
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Bằng việc đăng ký, bạn đồng ý với{" "}
          <a href="#" className="text-green-600 hover:underline">
            Điều khoản dịch vụ
          </a>{" "}
          và{" "}
          <a href="#" className="text-green-600 hover:underline">
            Chính sách bảo mật
          </a>
        </p>
      </div>
    </div>
  );
};

export default StoreRegistration;
