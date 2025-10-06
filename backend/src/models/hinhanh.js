
export default function(sequelize, DataTypes) {
  return sequelize.define('hinhanh', {
    MaHA: {
      type: DataTypes.STRING(10),
      allowNull: false,
      primaryKey: true
    },
    URL: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    MoTa: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'hinhanh',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "MaHA" },
        ]
      },
    ]
  });
};
