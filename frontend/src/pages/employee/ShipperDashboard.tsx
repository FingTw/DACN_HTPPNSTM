import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Package, Truck, CheckCircle, MapPin, Camera } from "lucide-react";
// Giả sử có deliveryService để gọi API
import { deliveryService } from "@/services/deliveryService";

const ShipperDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"pickup" | "delivery" | "history">(
    "pickup"
  );
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load danh sách nhiệm vụ dựa trên Tab
  useEffect(() => {
    loadTasks();
  }, [activeTab]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await deliveryService.getMyTasks(activeTab);
      setTasks(data);
    } catch (error) {
      console.error("Lỗi tải tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickup = async (orderId: string) => {
    if (confirm("Xác nhận đã lấy hàng từ Shop?")) {
      await deliveryService.confirmPickup(orderId);
      loadTasks(); // Reload lại list
    }
  };

  // Modal/File upload state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const openProofModal = (task: any) => {
    setSelectedTask(task);
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const closeProofModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
    setSelectedFile(null);
  };

  const submitProof = async () => {
    if (!selectedTask) return;
    try {
      if (!selectedFile) return alert("Vui lòng chọn hình ảnh bằng chứng");
      const MaGH = selectedTask.MaGH || selectedTask.MaGH;
      await deliveryService.uploadProof(MaGH, selectedFile);
      alert("Upload ảnh bằng chứng thành công");
      closeProofModal();
      loadTasks();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Lỗi khi upload ảnh");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Mobile */}
      <div className="bg-blue-600 text-white p-4 sticky top-0 z-10 shadow-md">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-bold">Shipper: {user?.TenDangNhap}</h1>
          <div className="bg-blue-700 px-3 py-1 rounded-full text-xs">
            Online
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white shadow-sm mb-4">
        <button
          onClick={() => setActiveTab("pickup")}
          className={`flex-1 py-3 text-sm font-medium border-b-2 ${
            activeTab === "pickup"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500"
          }`}
        >
          Lấy hàng ({tasks.filter((t) => t.type === "pickup").length})
        </button>
        <button
          onClick={() => setActiveTab("delivery")}
          className={`flex-1 py-3 text-sm font-medium border-b-2 ${
            activeTab === "delivery"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500"
          }`}
        >
          Giao hàng
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-3 text-sm font-medium border-b-2 ${
            activeTab === "history"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500"
          }`}
        >
          Lịch sử
        </button>
      </div>

      {/* Task List */}
      <div className="px-4 space-y-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Đang tải...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Package size={48} className="mx-auto mb-2 opacity-50" />
            <p>Không có đơn hàng nào</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.MaDH}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    #{task.MaDH}
                  </span>
                  <h3 className="font-bold text-gray-800 mt-1">
                    {task.StoreName}
                  </h3>
                </div>
                <span className="text-sm font-bold text-blue-600">
                  {task.CodAmount > 0
                    ? `${task.CodAmount.toLocaleString()}đ`
                    : "Đã TT"}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-start gap-2">
                  <MapPin
                    size={16}
                    className="mt-0.5 text-red-500 flex-shrink-0"
                  />
                  <p className="line-clamp-2">{task.DeliveryAddress}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Package size={16} className="text-orange-500" />
                  <p>
                    {task.ProductCount} sản phẩm - {task.Weight}kg
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              {activeTab === "pickup" && (
                <button
                  onClick={() => handlePickup(task.MaDH)}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 active:bg-blue-800 transition flex items-center justify-center gap-2"
                >
                  <Package size={20} /> Xác nhận đã lấy hàng
                </button>
              )}

              {activeTab === "delivery" && (
                <div className="grid grid-cols-2 gap-3">
                  <button className="bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200">
                    Gọi khách
                  </button>
                  <button
                    onClick={() => openProofModal(task)}
                    className="bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <Camera size={20} /> Giao thành công
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Proof Modal */}
      {isModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-2">
              Upload ảnh bằng chứng - {selectedTask.MaDH || selectedTask.MaGH}
            </h3>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={closeProofModal}
                className="px-4 py-2 border rounded"
              >
                Hủy
              </button>
              <button
                onClick={submitProof}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Gửi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipperDashboard;
