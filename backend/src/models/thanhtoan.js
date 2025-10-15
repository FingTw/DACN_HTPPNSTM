export default function(sequelize, DataTypes) {
  return sequelize.define('thanhtoan', {
    MaTT: {
      type: DataTypes.STRING(20),
      allowNull: false,
      primaryKey: true
    },
    MaDH: {
      type: DataTypes.STRING(20),
      allowNull: false,
      references: { model: 'donhang', key: 'MaDH' }
    },
    Sotien: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false,
      defaultValue: 0.00
    },
    TrangThai: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    MaPTTT: {
      type: DataTypes.STRING(20),
      allowNull: true,
      references: { model: 'pttt', key: 'MaPTTT' }
    },
    NgayTao: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    Thoigian: {
      type: DataTypes.TIME,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'thanhtoan',
    timestamps: false
  });
};
