import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
  class PasswordResetToken extends Model {}

  PasswordResetToken.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      MaTK: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      resetToken: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      tokenExpiry: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: "password_reset_tokens",
      timestamps: false,
    }
  );

  return PasswordResetToken;
};
