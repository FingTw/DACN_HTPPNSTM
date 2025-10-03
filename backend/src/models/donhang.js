
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
    ]
  });
};
