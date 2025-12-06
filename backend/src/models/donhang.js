export default function(sequelize, DataTypes) {
  return sequelize.define('donhang', {
    MaDH: {
      type: DataTypes.STRING(10),
      allowNull: false,
      primaryKey: true
    },
    NgayTao: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    TongTien: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: true
    },
    GiamGia: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: true
    },
    TrangThai: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    DCNhanHang: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    MaTK: {
      type: DataTypes.STRING(10),
      allowNull: true,
      references: {
        model: 'taikhoan',
        key: 'MaTK'
      }
    },
    MaPTVC: {
      type: DataTypes.STRING(10),
      allowNull: true,
      references: {
        model: 'ptvc',
        key: 'MaPTVC'
      }
    },
    MaPTTT: {
      type: DataTypes.STRING(10),
      allowNull: true,
      references: {
        model: 'pttt',
        key: 'MaPTTT'
      }
    },
    // 🚚 THÊM CÁC TRƯỜNG MỚI CHO SHIPPER
    MaShipper: {
      type: DataTypes.STRING(10),
      allowNull: true,
      references: {
        model: 'taikhoan',
        key: 'MaTK'
      }
    },
    NgayBatDauGiao: {
      type: DataTypes.DATE,
      allowNull: true
    },
    NgayGiaoHang: {
      type: DataTypes.DATE,
      allowNull: true
    },
    HinhAnhXacNhan: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    PhiVanChuyen: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: true
    },
    MaKM: {
      type: DataTypes.STRING(10),
      allowNull: true,
      references: {
        model: 'khuyenmai',
        key: 'MaKM'
      }
    }
  }, {
    sequelize,
    tableName: 'donhang',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "MaDH" },
        ]
      },
      {
        name: "MaPTVC",
        using: "BTREE",
        fields: [
          { name: "MaPTVC" },
        ]
      },
      {
        name: "MaPTTT",
        using: "BTREE",
        fields: [
          { name: "MaPTTT" },
        ]
      },
      {
        name: "idx_donhang_matk",
        using: "BTREE",
        fields: [
          { name: "MaTK" },
        ]
      },
      // 🚚 THÊM INDEX CHO MASHIPPER
      {
        name: "idx_donhang_mashipper",
        using: "BTREE",
        fields: [
          { name: "MaShipper" },
        ]
      },
    ]
  });
};