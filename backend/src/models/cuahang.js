
export default function(sequelize, DataTypes) {
  return sequelize.define('cuahang', {
    MaCH: {
      type: DataTypes.STRING(10),
      allowNull: false,
      primaryKey: true
    },
    TenCH: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    SLTheoDoi: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    DiemDG: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    MaHA_CuaHang: {
      type: DataTypes.STRING(10),
      allowNull: true,
      references: {
        model: 'hinhanh',
        key: 'MaHA'
      }
    },
    MaTK: {
      type: DataTypes.STRING(10),
      allowNull: true,
      references: {
        model: 'taikhoan',
        key: 'MaTK'
      }
    }
  }, {
    sequelize,
    tableName: 'cuahang',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "MaCH" },
        ]
      },
      {
        name: "MaHA_CuaHang",
        using: "BTREE",
        fields: [
          { name: "MaHA_CuaHang" },
        ]
      },
      {
        name: "MaTK",
        using: "BTREE",
        fields: [
          { name: "MaTK" },
        ]
      },
    ]
  });
};
