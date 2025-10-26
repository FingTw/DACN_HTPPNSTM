import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import "../styles/layout.css";

const Layout = () => {
  return (
    <div className="site">
      <Header />
      <main className="site__main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
