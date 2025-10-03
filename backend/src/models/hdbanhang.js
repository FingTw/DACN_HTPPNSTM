
export default function(sequelize, DataTypes) {
  return sequelize.define('hdbanhang', {
    MaHD: {
      type: DataTypes.STRING(10),
      allowNull: false,
      primaryKey: true
    },
    MaTK: {
      type: DataTypes.STRING(10),
      allowNull: true,
      references: {
        model: 'taikhoan',
        key: 'MaTK'
      }
    },
    NgayLap: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    LoaiHinhKD: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    MaSoThue: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    DCLayHang: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'hdbanhang',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "MaHD" },
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
