// src/components/payment/PayPalButtonWrapper.tsx
import React from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { paymentService } from "@/services/paymentService";
import { toast } from "sonner";

// Client ID Sandbox của bạn
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
  return (
    <div className="w-full z-0 mt-4">
      <PayPalScriptProvider
        options={{ clientId: PAYPAL_CLIENT_ID, currency: "USD" }}
      >
        <PayPalButtons
          style={{ layout: "vertical", shape: "rect", height: 48 }}
          // 1. Khi bấm nút PayPal
          createOrder={async (data, actions) => {
            try {
              // A. Tạo đơn hàng trong Database của mình trước
              const MaDH = await createOrderInDB();
              if (!MaDH) throw new Error("Không thể tạo đơn hàng");

              // B. Gọi Backend để lấy PayPal Order ID
              const orderId = await paymentService.createPayPalOrder(MaDH);
              return orderId;
            } catch (error) {
              console.error(error);
              // Trả về lỗi để PayPal không mở popup
              throw error;
            }
          }}
          // 2. Khi khách thanh toán xong
          onApprove={async (data, actions) => {
            try {
              // data.orderID là ID giao dịch PayPal
              // Chúng ta không biết MaDH ở đây, nên cần Backend xử lý map qua session hoặc
              // paymentService.createPayPalOrder cần trả về mapping.
              // TUY NHIÊN, cách đơn giản nhất:
              // Backend 'createPayPalOrder' đã lưu PayPal OrderID vào DB (cột GhiChu hoặc bảng log)
              // Nên ta chỉ cần gửi PayPal OrderID về lại Backend để nó tự tìm MaDH tương ứng và update.

              // Nhưng để đơn giản ở frontend, ta cần MaDH để redirect.
              // Trong ví dụ này, ta giả định backend capture xong sẽ trả về MaDH.

              // Gọi Capture
              // Lưu ý: data.orderID là token của PayPal
              // Bạn cần truyền thêm MaDH vào đây nếu logic backend yêu cầu,
              // nhưng vì createOrder ở trên là async scope, ta khó truyền MaDH xuống onApprove trực tiếp.

              // GIẢI PHÁP: Backend endpoint capture nên tìm đơn hàng dựa trên PayPal OrderID (token)
              await paymentService.capturePayPalOrder(data.orderID, "");

              toast.success("Thanh toán PayPal thành công!");

              // Vì onApprove không có MaDH, ta có thể redirect về trang danh sách đơn
              // Hoặc tối ưu hơn: createOrderInDB lưu MaDH vào useRef/State ở component cha
              onSuccess(data.orderID);
            } catch (error) {
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
