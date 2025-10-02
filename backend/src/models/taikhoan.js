import { DataTypes, Model } from "sequelize";
export default (sequelize) => {
  class Taikhoan extends Model {
    static associate(models) {
      Taikhoan.hasMany(models.cuahang, { as: "cuahangs", foreignKey: "MaTK" });
      Taikhoan.hasMany(models.denghicungcap, {
        as: "denghicungcaps",
        foreignKey: "MaTK_Seller",
      });
      Taikhoan.hasMany(models.donhang, { as: "donhangs", foreignKey: "MaTK" });
      Taikhoan.hasMany(models.hdbanhang, {
        as: "hdbanhangs",
        foreignKey: "MaTK",
      });
      Taikhoan.hasMany(models.yeucaudathang, {
        as: "yeucaudathangs",
        foreignKey: "MaTK_Buyer",
      });
      Taikhoan.belongsTo(models.hinhanh, {
        as: "MaHA_Avatar_hinhanh",
        foreignKey: "MaHA_Avatar",
      });
    }
  }

  Taikhoan.init(
    {
      MaTK: {
        type: DataTypes.STRING(10),
        allowNull: false,
        primaryKey: true,
      },
      TenDangNhap: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: "TenDangNhap",
      },
      MatKhau: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      HoTen: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      SDT: {
        type: DataTypes.STRING(15),
        allowNull: true,
      },
      Email: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      VaiTro: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      NgayTao: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      TrangThai: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      MaHA_Avatar: {
        type: DataTypes.STRING(10),
        allowNull: true,
        references: {
          model: "hinhanh",
          key: "MaHA",
        },
      },
    },
    {
      sequelize,
      tableName: "taikhoan",
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "MaTK" }],
        },
        {
          name: "TenDangNhap",
          unique: true,
          using: "BTREE",
          fields: [{ name: "TenDangNhap" }],
        },
        {
          name: "idx_taikhoan_tendangnhap",
          unique: true,
          using: "BTREE",
          fields: [{ name: "TenDangNhap" }],
        },
        {
          name: "MaHA_Avatar",
          using: "BTREE",
          fields: [{ name: "MaHA_Avatar" }],
        },
      ],
    }
  );
  return Taikhoan;
};
