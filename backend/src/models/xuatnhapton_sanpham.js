
export default function(sequelize, DataTypes) {
  return sequelize.define('xuatnhapton_sanpham', {
    MaXNT: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "",
      primaryKey: true,
      references: {
        model: 'xuatnhapton',
        key: 'MaXNT'
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
    SoLuong: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'xuatnhapton_sanpham',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "MaXNT" },
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
