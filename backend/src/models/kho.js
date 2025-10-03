
export default function(sequelize, DataTypes) {
  return sequelize.define('kho', {
    MaKho: {
      type: DataTypes.STRING(10),
      allowNull: false,
      primaryKey: true
    },
    TenKho: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    DC: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    SucChua: {
      type: DataTypes.STRING(20),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'kho',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "MaKho" },
        ]
      },
    ]
  });
};
