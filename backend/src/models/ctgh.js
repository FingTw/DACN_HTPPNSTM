// src/models/ctgh.js
export default function (sequelize, DataTypes) {
  return sequelize.define('ctgh', {
    MaGH: {
      type: DataTypes.STRING(10),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'giohang',
        key: 'MaGH'
      }
    },
    MaSP: {
      type: DataTypes.STRING(10),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'sanpham',
        key: 'MaSP'
      }
    },
    SL: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    TongTien: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'ctgh',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [{ name: "MaGH" }, { name: "MaSP" }]
      }
    ]
  });
}
