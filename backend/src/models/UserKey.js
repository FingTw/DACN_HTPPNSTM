// backend/models/UserKey.js 
import { DataTypes } from 'sequelize';

// Export dưới dạng function như các model khác
const UserKeyModel = (sequelize) => {
  const UserKey = sequelize.define('UserKey', {
    MaUK: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    MaTK: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'TaiKhoan',
            key: 'MaTK'
        }
    },
    PublicKey: {
        type: DataTypes.TEXT('long'),
        allowNull: false
    },
    PrivateKeyEncrypted: {
        type: DataTypes.TEXT('long'),
        allowNull: false,
        comment: 'Private key được mã hóa bằng master key'
    },
    KeyId: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false
    },
    Algorithm: {
        type: DataTypes.STRING(20),
        defaultValue: 'RS256'
    },
    KeySize: {
        type: DataTypes.INTEGER,
        defaultValue: 2048
    },
    CreatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    LastUsed: {
        type: DataTypes.DATE,
        allowNull: true
    },
    Status: {
        type: DataTypes.ENUM('active', 'revoked', 'expired'),
        defaultValue: 'active'
    },
    Metadata: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const raw = this.getDataValue('Metadata');
            return raw ? JSON.parse(raw) : {};
        },
        set(value) {
            this.setDataValue('Metadata', JSON.stringify(value));
        }
    }
  }, {
    tableName: 'UserKeys',
    timestamps: false,
    indexes: [
      {
        name: 'IX_UserKeys_MaTK',
        fields: ['MaTK']
      },
      {
        name: 'IX_UserKeys_KeyId',
        fields: ['KeyId'],
        unique: true
      }
    ]
  });

  return UserKey;
};

export default UserKeyModel;