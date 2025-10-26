// src/pages/AccountInfo.jsx
import { useState } from "react";

export default function AccountInfo() {
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);

    try {
      const response = await fetch("http://localhost:3000/api/account/update-info", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("HTTP error");

      const data = await response.json();
      setMessage(data.message || "Cập nhật thành công!");
    } catch (error) {
      console.error(error);
      setMessage("Lỗi khi lưu thông tin.");
    }
  };

  return (
    <form id="infoForm" onSubmit={handleSubmit}>
      <label>Họ tên:</label>
      <input type="text" name="HoTen" />

      <button type="submit">Lưu</button>

      {message && <p>{message}</p>}
    </form>
  );
}
