// models/giaodich_vi.js
export default function (sequelize, DataTypes) {
  return sequelize.define(
    "giaodich_vi",
    {
      MaGD: {
        type: DataTypes.STRING(20),
        primaryKey: true,
      },
      MaCH: {
        type: DataTypes.STRING(20),
        references: { model: "cuahang", key: "MaCH" },
      },
      LoaiGD: {
        type: DataTypes.STRING(20), // 'NAP_TIEN', 'RUT_TIEN', 'THANH_TOAN_DON_HANG'
      },
      SoTien: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      // Thêm 2 trường này để Admin biết chuyển khoản đi đâu
      TenNganHang: {
        type: DataTypes.STRING(100),
        allowNull: true, // Null nếu là giao dịch cộng tiền bán hàng
      },
      SoTaiKhoan: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      NoiDung: {
        type: DataTypes.STRING(255),
      },
      TrangThai: {
        type: DataTypes.STRING(20), // 'DangXuLy', 'ThanhCong', 'TuChoi'
      },
      NgayTao: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "giaodich_vi",
      timestamps: false,
    }
  );
}
