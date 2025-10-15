export default function(sequelize, DataTypes) {
  return sequelize.define('giaohang', {
    MaGH: {
      type: DataTypes.STRING(20),
      allowNull: false,
      primaryKey: true
    },
    MaShipper: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    MaDH: {
      type: DataTypes.STRING(20),
      allowNull: false,
      references: { model: 'donhang', key: 'MaDH' }
    },
    TrangThai: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'PENDING'
    },
    ProofImage: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    GhiChu: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    NgayTao: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'giaohang',
    timestamps: false
  });
};
