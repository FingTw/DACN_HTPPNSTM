
export default function(sequelize, DataTypes) {
  return sequelize.define('sanpham_hinhanh', {
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
    MaHA: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "",
      primaryKey: true,
      references: {
        model: 'hinhanh',
        key: 'MaHA'
      }
    }
  }, {
    sequelize,
    tableName: 'sanpham_hinhanh',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "MaSP" },
          { name: "MaHA" },
        ]
      },
      {
        name: "MaHA",
        using: "BTREE",
        fields: [
          { name: "MaHA" },
        ]
      },
    ]
  });
};
