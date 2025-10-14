export default function(sequelize, DataTypes) {
  return sequelize.define('khuyenmai', {
  MaKM: {
    type: DataTypes.STRING(20),
    primaryKey: true
  },
  TenKM: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  MoTa: {
    type: DataTypes.TEXT
  },
  LoaiKM: {
    type: DataTypes.ENUM("PRODUCT", "SHIPPING", "ORDER"),
    allowNull: false
  },
  GiaTriGiam: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false
  },
  HinhThucGiam: {
    type: DataTypes.ENUM("PERCENT", "FIXED"),
    allowNull: false,
    defaultValue: "PERCENT"
  },
  DieuKien: {
    type: DataTypes.DECIMAL(10,2),
    defaultValue: 0
  },
  SoTienGiamToiDa: {
    type: DataTypes.DECIMAL(10,2),
    defaultValue: 0
  },
  NgayBatDau: {
    type: DataTypes.DATE,
    allowNull: false
  },
  NgayKetThuc: {
    type: DataTypes.DATE,
    allowNull: false
  },
  GioiHanSuDung: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  SoLanDaSuDung: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  MaCH: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  TrangThai: {
    type: DataTypes.ENUM("ACTIVE", "INACTIVE", "EXPIRED"),
    defaultValue: "ACTIVE"
  },
  NgayTao: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: "khuyenmai",
  timestamps: false
});
}

