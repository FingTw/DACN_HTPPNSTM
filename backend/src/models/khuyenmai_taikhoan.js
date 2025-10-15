export default function(sequelize, DataTypes) {
  return sequelize.define('khuyenmai_taikhoan', {
  MaKM: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    references: {
      model: 'khuyenmai',
      key: "MaKM"
    }
  },
  MaTK: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    references: {
      model: 'taikhoan',
      key: "MaTK"
    }
  },
  SoLanSuDung: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: "khuyenmai_taikhoan",
  timestamps: false
});
}

