export default function(sequelize, DataTypes) {
  return sequelize.define('donhang_khuyenmai', {
  MaDH: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    references: {
      model: 'donhang',
      key: "MaDH"
    }
  },
  MaKM: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    references: {
      model: 'khuyenmai',
      key: "MaKM"
    }
  },
  SoTienGiam: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false
  }
}, {
  tableName: "donhang_khuyenmai",
  timestamps: false
});
}

