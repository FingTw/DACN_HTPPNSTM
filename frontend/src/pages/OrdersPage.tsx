import React from "react";
import OrderList from "../components/order/OrderList";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const OrdersPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <Header />
      <div>
        <OrderList />
      </div>
      <Footer />
    </div>
  );
};

export default OrdersPage;
