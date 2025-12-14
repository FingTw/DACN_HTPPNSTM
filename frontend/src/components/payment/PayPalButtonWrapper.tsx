import React, { useRef } from "react"; // Thêm useRef
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { paymentService } from "@/services/paymentService";
import { toast } from "sonner";

const PAYPAL_CLIENT_ID =
  "AZ8qA4E9fk9EOVRYrXUVu81HF5k6vobR5ql-nuegzYqRbCsZJG1ovxlWSvnlUK6VY4j9tbW3TWcJLVDS";

interface PayPalWrapperProps {
  amount: number;
  createOrderInDB: () => Promise<string | null>;
  onSuccess: (MaDH: string) => void;
}

const PayPalButtonWrapper: React.FC<PayPalWrapperProps> = ({
  amount,
  createOrderInDB,
  onSuccess,
}) => {
  // 👇 Dùng ref để lưu MaDH tạm thời
  const tempMaDH = useRef<string | null>(null);

  return (
    <div className="w-full z-0 mt-4">
      <PayPalScriptProvider
        options={{ clientId: PAYPAL_CLIENT_ID, currency: "USD" }}
      >
        <PayPalButtons
          style={{ layout: "vertical", shape: "rect", height: 48 }}
          createOrder={async (data, actions) => {
            try {
              // 1. Tạo đơn hàng và lấy MaDH
              const MaDH = await createOrderInDB();
              if (!MaDH) throw new Error("Không thể tạo đơn hàng");

              // 👇 Lưu MaDH vào ref để dùng sau này
              tempMaDH.current = MaDH;

              // 2. Gọi API tạo PayPal Order
              const orderId = await paymentService.createPayPalOrder(MaDH);
              return orderId;
            } catch (error) {
              console.error(error);
              throw error;
            }
          }}
          onApprove={async (data, actions) => {
            try {
              // 👇 Lấy MaDH từ ref ra
              const currentMaDH = tempMaDH.current;

              if (!currentMaDH) {
                toast.error("Không tìm thấy mã đơn hàng để xác nhận");
                return;
              }

              // 👇 Gửi kèm MaDH xuống backend để update trạng thái
              await paymentService.capturePayPalOrder(
                data.orderID,
                currentMaDH
              );

              toast.success("Thanh toán PayPal thành công!");
              onSuccess(data.orderID);
            } catch (error) {
              console.error(error);
              toast.error("Lỗi khi xác nhận thanh toán");
            }
          }}
          onError={(err) => {
            console.error("PayPal Error:", err);
            toast.error("Thanh toán thất bại");
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
};

export default PayPalButtonWrapper;
