import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
  class Chitietchapnhan extends Model {
    static associate(models) {
      Chitietchapnhan.belongsTo(models.denghicungcap, {
        as: "MaDNCC_denghicungcap",
        foreignKey: "MaDNCC",
      });
      Chitietchapnhan.belongsTo(models.donhang, {
        as: "MaDH_donhang",
        foreignKey: "MaDH",
      });
    }
  }

  Chitietchapnhan.init(
    {
      MaCTCN: {
        type: DataTypes.STRING(10),
        allowNull: false,
        primaryKey: true,
      },
      MaDNCC: {
        type: DataTypes.STRING(10),
        allowNull: false,
        references: {
          model: "denghicungcap",
          key: "MaDNCC",
        },
      },
      SoLuongChapNhan: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      NgayChapNhan: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      MaDH: {
        type: DataTypes.STRING(10),
        allowNull: true,
        references: {
          model: "donhang",
          key: "MaDH",
        },
      },
    },
    {
      sequelize,
      tableName: "chitietchapnhan",
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "MaCTCN" }],
        },
        {
          name: "MaDH",
          using: "BTREE",
          fields: [{ name: "MaDH" }],
        },
        {
          name: "idx_chitietchapnhan_madncc",
          using: "BTREE",
          fields: [{ name: "MaDNCC" }],
        },
      ],
    }
  );
  return Chitietchapnhan;
};
