
export default function(sequelize, DataTypes) {
  return sequelize.define('nhanvien', {
    MaNV: {
      type: DataTypes.STRING(10),
      allowNull: false,
      primaryKey: true
    },
    HoTen: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    SDT: {
      type: DataTypes.STRING(15),
      allowNull: true
    },
    Email: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    MaPB: {
      type: DataTypes.STRING(10),
      allowNull: true,
      references: {
        model: 'phongban',
        key: 'MaPB'
      }
    },
    MaCV: {
      type: DataTypes.STRING(10),
      allowNull: true,
      references: {
        model: 'chucvu',
        key: 'MaCV'
      }
    },
    MaHA_Avatar: {
      type: DataTypes.STRING(10),
      allowNull: true,
      references: {
        model: 'hinhanh',
        key: 'MaHA'
      }
    }
  }, {
    sequelize,
    tableName: 'nhanvien',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "MaNV" },
        ]
      },
      {
        name: "MaPB",
        using: "BTREE",
        fields: [
          { name: "MaPB" },
        ]
      },
      {
        name: "MaCV",
        using: "BTREE",
        fields: [
          { name: "MaCV" },
        ]
      },
      {
        name: "MaHA_Avatar",
        using: "BTREE",
        fields: [
          { name: "MaHA_Avatar" },
        ]
      },
    ]
  });
};
