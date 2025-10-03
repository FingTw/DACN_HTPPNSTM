
export default function(sequelize, DataTypes) {
  return sequelize.define('taikhoan', {
    MaTK: {
      type: DataTypes.STRING(10),
      allowNull: false,
      primaryKey: true
    },
    TenDangNhap: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "idx_taikhoan_tendangnhap"
    },
    MatKhau: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    HoTen: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    SDT: {
      type: DataTypes.STRING(15),
      allowNull: true
    },
    Email: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    VaiTro: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    NgayTao: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    TrangThai: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    MaHA_Avatar: {
      type: DataTypes.STRING(10),
      allowNull: true,
      references: {
        model: 'hinhanh',
        key: 'MaHA'
      }
    }
  }, {
    sequelize,
    tableName: 'taikhoan',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "MaTK" },
        ]
      },
      {
        name: "TenDangNhap",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "TenDangNhap" },
        ]
      },
      {
        name: "idx_taikhoan_tendangnhap",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "TenDangNhap" },
        ]
      },
      {
        name: "MaHA_Avatar",
        using: "BTREE",
        fields: [
          { name: "MaHA_Avatar" },
        ]
      },
    ]
  });
};
