export default function(sequelize, DataTypes) {
  return sequelize.define('thongbao', {
    MaTB: {
      type: DataTypes.STRING(10),
      allowNull: false,
      primaryKey: true
    },
    MaShipper: {
      type: DataTypes.STRING(10),
      allowNull: false,
      references: {
        model: 'taikhoan',
        key: 'MaTK'
      }
    },
    MaDH: {
      type: DataTypes.STRING(10),
      allowNull: false,
      references: {
        model: 'donhang',
        key: 'MaDH'
      }
    },
    NoiDung: {
      type: DataTypes.STRING(1000),
      allowNull: true
    },
    LoaiThongBao: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    DaXem: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    ThoiGian: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    tableName: 'thongbao',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "MaTB" },
        ]
      },
      {
        name: "MaShipper",
        using: "BTREE",
        fields: [
          { name: "MaShipper" },
        ]
      },
      {
        name: "MaDH",
        using: "BTREE",
        fields: [
          { name: "MaDH" },
        ]
      },
    ]
  });
};