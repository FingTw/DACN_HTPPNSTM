
export default function(sequelize, DataTypes) {
  return sequelize.define('pttt', {
    MaPTTT: {
      type: DataTypes.STRING(10),
      allowNull: false,
      primaryKey: true
    },
    TenPTTT: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    MoTa: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'pttt',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "MaPTTT" },
        ]
      },
    ]
  });
};
