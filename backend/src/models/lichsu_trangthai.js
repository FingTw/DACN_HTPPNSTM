export default function (sequelize, DataTypes) {
  return sequelize.define('lichsu_trangthai', {
    MaLS: {
      type: DataTypes.STRING(15),
      allowNull: false,
      primaryKey: true
    },
    MaDH: {
      type: DataTypes.STRING(10),
      allowNull: false,
      references: {
        model: 'donhang',
        key: 'MaDH'
      }
    },
    TrangThaiCu: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    TrangThaiMoi: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    NgayCapNhat: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    NguoiCapNhat: {
      type: DataTypes.STRING(10),
      allowNull: true,
      references: {
        model: 'taikhoan',
        key: 'MaTK'
      }
    }
  }, {
    sequelize,
    tableName: 'lichsu_trangthai',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "MaLS" },
        ]
      },
      {
        name: "idx_lichsu_trangthai_madh",
        using: "BTREE",
        fields: [
          { name: "MaDH" },
        ]
      },
    ]
  });
};
