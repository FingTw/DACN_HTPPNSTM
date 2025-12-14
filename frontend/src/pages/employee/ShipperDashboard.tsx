// src/pages/employee/ShipperDashboard.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Package,
  MapPin,
  Camera,
  Navigation,
  Box,
  Truck,
  Phone,
  User,
  Store,
  DollarSign,
} from "lucide-react";
import { deliveryService } from "@/services/deliveryService";

interface Task {
  MaGH: string;
  MaDH: string;
  LoaiNhiemVu: string;
  ShopName: string;
  ShopAddress: string;
  CustomerName: string;
  CustomerAddress: string;
  CodAmount: number;
  TrangThaiDon: string;
  NgayTao: string;
}

const ShipperDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"pickup" | "delivery">("pickup");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  // States Upload Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadTasks();
  }, [activeTab]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await deliveryService.getMyTasks(activeTab);
      setTasks(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTakeOrder = async (MaDH: string) => {
    try {
      await deliveryService.takeOrder(MaDH);
      alert("Đã nhận đơn! Bắt đầu đi thực hiện.");
      loadTasks();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleConfirmPickup = async (MaDH: string) => {
    if (!confirm("Xác nhận đã lấy hàng từ Shop?")) return;
    try {
      await deliveryService.confirmPickup(MaDH);
      alert("Đã lấy hàng thành công! Đơn chuyển sang trạng thái Đang Giao.");
      loadTasks();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const openProofModal = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const submitProof = async () => {
    if (!selectedTask || !selectedFile)
      return alert("Vui lòng chụp ảnh bằng chứng");
    try {
      await deliveryService.uploadProof(selectedTask.MaGH, selectedFile);
      alert(
        "Đã cập nhật: Giao hàng thành công! Đơn hàng chuyển sang trạng thái 'Đã giao'."
      );
      setIsModalOpen(false);
      setSelectedFile(null);
      loadTasks();
    } catch (e: any) {
      alert(e.message);
    }
  };
  // Component Card hiển thị từng đơn
  const TaskCard = ({ task }: { task: Task }) => {
    const isPickupTab = activeTab === "pickup";

    let actionButton;

    if (isPickupTab) {
      if (task.TrangThaiDon === "Chờ lấy hàng") {
        actionButton = (
          <button
            onClick={() => handleTakeOrder(task.MaDH)}
            className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black shadow-lg shadow-gray-200"
          >
            ✋ Nhận Đơn Lấy Hàng
          </button>
        );
      } else {
        // Đang đi lấy
        actionButton = (
          <button
            onClick={() => handleConfirmPickup(task.MaDH)}
            className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
          >
            <Box size={20} /> Xác Nhận Đã Lấy
          </button>
        );
      }
    } else {
      // Tab Delivery
      // Nếu là đơn "Đang giao hàng" nhưng mình chưa nhận (vừa từ kho ra) -> Logic này cần backend trả về flag isMine
      // Tạm thời hiển thị nút Giao Hàng Thành Công cho tất cả đơn trong tab này
      actionButton = (
        <div className="flex gap-2">
          <button className="flex-1 py-3 bg-green-100 text-green-700 rounded-xl font-bold flex items-center justify-center gap-2">
            <Phone size={18} /> Gọi Khách
          </button>
          <button
            onClick={() => openProofModal(task)}
            className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
          >
            <Camera size={20} /> Giao Thành Công
          </button>
        </div>
      );
    }

    return (
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-4 relative overflow-hidden">
        {/* Status Badge */}
        <div className="absolute top-0 right-0 p-3">
          <span
            className={`text-xs font-bold px-2 py-1 rounded-full border ${
              task.TrangThaiDon === "Hoàn thành"
                ? "bg-green-100 text-green-600 border-green-200"
                : task.TrangThaiDon === "Đang giao hàng"
                ? "bg-blue-50 text-blue-600 border-blue-100"
                : "bg-orange-50 text-orange-600 border-orange-100"
            }`}
          >
            {task.TrangThaiDon}
          </span>
        </div>

        <div className="mb-4">
          <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
            <Package className="text-gray-400" size={20} />
            {task.MaDH}
          </h3>
          <p className="text-xs text-gray-400 pl-7">
            {new Date(task.NgayTao).toLocaleString("vi-VN")}
          </p>
        </div>

        {/* Thông tin chính: LẤY vs GIAO */}
        <div className="space-y-4">
          {/* SHOP INFO */}
          <div
            className={`flex gap-3 ${
              !isPickupTab ? "opacity-50 grayscale" : ""
            }`}
          >
            <div className="mt-1">
              <Store size={18} className="text-orange-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Điểm lấy hàng
              </p>
              <p className="font-semibold text-gray-800">{task.ShopName}</p>
              <p className="text-sm text-gray-600 leading-snug">
                {task.ShopAddress}
              </p>
            </div>
          </div>

          {/* Dotted Line */}
          <div className="pl-2.5">
            <div className="h-4 border-l-2 border-dashed border-gray-300"></div>
          </div>

          {/* CUSTOMER INFO */}
          <div
            className={`flex gap-3 ${
              isPickupTab ? "opacity-50 grayscale" : ""
            }`}
          >
            <div className="mt-1">
              <MapPin size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Điểm giao hàng
              </p>
              <p className="font-semibold text-gray-800">{task.CustomerName}</p>
              <p className="text-sm text-gray-600 leading-snug">
                {task.CustomerAddress}
              </p>
            </div>
          </div>
        </div>

        {/* COD Section */}
        <div className="mt-4 bg-gray-50 rounded-xl p-3 flex items-center justify-between border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <DollarSign size={16} /> Tiền thu hộ (COD)
          </div>
          <span className="font-bold text-lg text-red-600">
            {task.CodAmount > 0
              ? task.CodAmount.toLocaleString() + "đ"
              : "0đ (Đã TT)"}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="mt-5">{actionButton}</div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-100 pb-24">
      {/* App Header */}
      <div className="bg-white px-4 pt-12 pb-4 sticky top-0 z-20 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Shipper App
            </h1>
            <p className="text-sm text-gray-500">
              Xin chào, {user?.TenDangNhap || "Tài xế"}
            </p>
          </div>
          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
            <Truck size={20} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab("pickup")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === "pickup"
                ? "bg-white text-orange-600 shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Box size={16} /> Lấy Hàng
          </button>
          <button
            onClick={() => setActiveTab("delivery")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === "delivery"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Truck size={16} /> Giao Khách
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="p-4 space-y-4">
        {loading ? (
          [1, 2].map((i) => (
            <div
              key={i}
              className="h-48 bg-white rounded-2xl animate-pulse"
            ></div>
          ))
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Box size={64} className="mb-4 opacity-20" />
            <p>Hiện không có nhiệm vụ nào</p>
          </div>
        ) : (
          tasks.map((t) => <TaskCard key={t.MaDH} task={t} />)
        )}
      </div>

      {/* Upload Proof Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 animate-in slide-in-from-bottom-10">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Xác nhận giao hàng
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Chụp ảnh gói hàng đã giao cho khách
              </p>
            </div>

            <label className="block w-full aspect-square rounded-2xl border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer relative flex flex-col items-center justify-center mb-6 bg-gray-50">
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              {selectedFile ? (
                <>
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                    alt="Preview"
                  />
                  <div className="absolute inset-0 bg-black/20 rounded-2xl flex items-center justify-center">
                    <span className="bg-white/90 text-xs font-bold px-3 py-1 rounded-full">
                      Thay đổi ảnh
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <Camera size={40} className="text-gray-300 mb-2" />
                  <span className="text-sm font-medium text-gray-400">
                    Chạm để chụp ảnh
                  </span>
                </>
              )}
            </label>

            <div className="flex gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200"
              >
                Để sau
              </button>
              <button
                onClick={submitProof}
                className="flex-1 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipperDashboard;
