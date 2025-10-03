
export default function(sequelize, DataTypes) {
  return sequelize.define('danhmuc', {
    MaDM: {
      type: DataTypes.STRING(10),
      allowNull: false,
      primaryKey: true
    },
    TenDM: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    MoTa: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    MaHA_DanhMuc: {
      type: DataTypes.STRING(10),
      allowNull: true,
      references: {
        model: 'hinhanh',
        key: 'MaHA'
      }
    }
  }, {
    sequelize,
    tableName: 'danhmuc',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "MaDM" },
        ]
      },
      {
        name: "MaHA_DanhMuc",
        using: "BTREE",
        fields: [
          { name: "MaHA_DanhMuc" },
        ]
      },
    ]
  });
};
