
export default function(sequelize, DataTypes) {
  return sequelize.define('yeucaudathang', {
    MaYCDH: {
      type: DataTypes.STRING(10),
      allowNull: false,
      primaryKey: true
    },
    MaTK_Buyer: {
      type: DataTypes.STRING(10),
      allowNull: false,
      references: {
        model: 'taikhoan',
        key: 'MaTK'
      }
    },
    MaDM: {
      type: DataTypes.STRING(10),
      allowNull: true,
      references: {
        model: 'danhmuc',
        key: 'MaDM'
      }
    },
    MaSP: {
      type: DataTypes.STRING(10),
      allowNull: true,
      references: {
        model: 'sanpham',
        key: 'MaSP'
      }
    },
    TenSP_YeuCau: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    SoLuongYeuCau: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ChatLuongYeuCau: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    GiaMongMuon: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: true
    },
    NgayTao: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    ThoiHan: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    TrangThai: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: "Open"
    }
  }, {
    sequelize,
    tableName: 'yeucaudathang',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "MaYCDH" },
        ]
      },
      {
        name: "MaDM",
        using: "BTREE",
        fields: [
          { name: "MaDM" },
        ]
      },
      {
        name: "MaSP",
        using: "BTREE",
        fields: [
          { name: "MaSP" },
        ]
      },
      {
        name: "idx_yeucaudathang_matk",
        using: "BTREE",
        fields: [
          { name: "MaTK_Buyer" },
        ]
      },
    ]
  });
};
