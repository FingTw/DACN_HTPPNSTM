// src/models/giohang.js
export default function (sequelize, DataTypes) {
  return sequelize.define('giohang', {
    MaGH: {
      type: DataTypes.STRING(10),
      allowNull: false,
      primaryKey: true
    },
    MaTK: {
      type: DataTypes.STRING(50),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'giohang',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [{ name: "MaGH" }]
      },
      {
        name: "idx_giohang_matk",
        using: "BTREE",
        fields: [{ name: "MaTK" }]
      }
    ]
  });
}
