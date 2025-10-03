
export default function(sequelize, DataTypes) {
  return sequelize.define('chucvu', {
    MaCV: {
      type: DataTypes.STRING(10),
      allowNull: false,
      primaryKey: true
    },
    TenCV: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    MoTa: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'chucvu',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "MaCV" },
        ]
      },
    ]
  });
};
