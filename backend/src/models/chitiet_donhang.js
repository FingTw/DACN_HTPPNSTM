
export default function(sequelize, DataTypes) {
  return sequelize.define('chitiet_donhang', {
    MaDH: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "",
      primaryKey: true,
      references: {
        model: 'donhang',
        key: 'MaDH'
      }
    },
    MaSP: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "",
      primaryKey: true,
      references: {
        model: 'sanpham',
        key: 'MaSP'
      }
    },
    TenSP: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    SoLuong: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    GiaBan: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'chitiet_donhang',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "MaDH" },
          { name: "MaSP" },
        ]
      },
      {
        name: "MaSP",
        using: "BTREE",
        fields: [
          { name: "MaSP" },
        ]
      },
    ]
  });
};
