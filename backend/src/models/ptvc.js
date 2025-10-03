
export default function(sequelize, DataTypes) {
  return sequelize.define('ptvc', {
    MaPTVC: {
      type: DataTypes.STRING(10),
      allowNull: false,
      primaryKey: true
    },
    TenPTVC: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    MoTa: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'ptvc',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "MaPTVC" },
        ]
      },
    ]
  });
};
