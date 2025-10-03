
export default function(sequelize, DataTypes) {
  return sequelize.define('sanpham_danhmuc', {
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
    MaDM: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "",
      primaryKey: true,
      references: {
        model: 'danhmuc',
        key: 'MaDM'
      }
    }
  }, {
    sequelize,
    tableName: 'sanpham_danhmuc',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "MaSP" },
          { name: "MaDM" },
        ]
      },
      {
        name: "MaDM",
        using: "BTREE",
        fields: [
          { name: "MaDM" },
        ]
      },
    ]
  });
};
