
export default function(sequelize, DataTypes) {
  return sequelize.define('password_reset_tokens', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    MaTK: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    resetToken: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    tokenExpiry: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'password_reset_tokens',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
