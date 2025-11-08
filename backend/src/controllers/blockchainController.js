import blockchainService from '../services/blockchainService.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sql from 'mssql';

// Database config
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true,
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true'
    }
};

class BlockchainController {
    // Blockchain operations với user mới
    async recordTransaction(req, res) {
        try {
            console.log('📥 Nhận request recordTransaction:', req.body);
            console.log('👤 User từ token:', req.user);

            const transactionData = {
                ...req.body,
                // Đảm bảo dùng thông tin từ user token
                actor: req.user.TenDangNhap || req.body.actor,
                role: req.user.VaiTro || req.user.role || req.body.role,
                timestamp: req.body.timestamp || new Date().toISOString()
            };

            console.log('📝 Transaction data sau khi xử lý:', transactionData);

            // Ghi vào blockchain
            const newBlock = await blockchainService.addBlock(transactionData);
            
            console.log('✅ Block mới được tạo:', {
                index: newBlock.index,
                hash: newBlock.hash,
                timestamp: newBlock.timestamp
            });

            res.json({
                success: true,
                message: 'Giao dịch đã được ghi vào blockchain thành công!',
                data: {
                    blockIndex: newBlock.index,
                    blockHash: newBlock.hash,
                    transactionHash: newBlock.hash,
                    timestamp: newBlock.timestamp,
                    actor: transactionData.actor,
                    role: transactionData.role,
                    eventType: transactionData.eventType,
                    productId: transactionData.productId,
                    location: transactionData.location
                }
            });

        } catch (error) {
            console.error('❌ Lỗi recordTransaction:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server: ' + error.message
            });
        }
    }

    // Các method khác giữ nguyên...
    getProductHistory(req, res) {
        try {
            const { productId } = req.params;
            const history = blockchainService.getProductHistory(productId);
            
            res.json({
                success: true,
                data: history || []
            });
        } catch (error) {
            console.error('❌ Get product history error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi lấy lịch sử sản phẩm',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
            });
        }
    }

    getFullChain(req, res) {
        try {
            const chain = blockchainService.getFullChain();
            res.json({
                success: true,
                data: chain
            });
        } catch (error) {
            console.error('❌ Get full chain error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi lấy blockchain',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
            });
        }
    }

    getBlockchainStats(req, res) {
        try {
            const stats = blockchainService.getBlockchainStats();
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('❌ Get blockchain stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi lấy thống kê blockchain',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
            });
        }
    }

    validateChain(req, res) {
        try {
            const isValid = blockchainService.validateChain();
            res.json({
                success: true,
                isValid,
                message: isValid ? 'Blockchain hợp lệ!' : 'Blockchain không hợp lệ!',
                stats: blockchainService.getBlockchainStats()
            });
        } catch (error) {
            console.error('❌ Validate chain error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi kiểm tra blockchain',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
            });
        }
    }

    getBlockByIndex(req, res) {
        try {
            const index = parseInt(req.params.index);
            const block = blockchainService.getBlockByIndex(index);
            
            res.json({
                success: true,
                data: block
            });
        } catch (error) {
            console.error('❌ Get block error:', error);
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }

    async generateQRCode(req, res) {
        try {
            const { productId } = req.params;
            const qrCode = await blockchainService.generateQRCode(productId);
            
            if (!qrCode) {
                return res.status(500).json({
                    success: false,
                    message: 'Không thể tạo QR code'
                });
            }

            res.json({
                success: true,
                productId,
                qrCode,
                url: `http://${process.env.SERVER_IP || 'localhost'}:${process.env.PORT || 3000}/product/${productId}`
            });
        } catch (error) {
            console.error('❌ Generate QR code error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi tạo QR code',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
            });
        }
    }

    // Lấy danh sách user theo role (cho Admin)
    async getUsersByRole(req, res) {
        try {
            const { role } = req.params;
            const pool = await sql.connect(dbConfig);
            
            const result = await pool.request()
                .input('VaiTro', sql.VarChar, role)
                .query(`
                    SELECT MaTK, TenDangNhap, HoTen, Email, SDT, NgayTao 
                    FROM TaiKhoan 
                    WHERE VaiTro = @VaiTro AND TrangThai = 'Active'
                `);

            res.json({
                success: true,
                data: result.recordset
            });
        } catch (error) {
            console.error('❌ Get users by role error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi lấy danh sách user',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
            });
        }
    }
    // Lấy danh sách sự kiện blockchain theo username
    async getUserEvents(req, res) {
    try {
        const { username, limit } = req.query;

        if (!username) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu tham số username'
        });
        }

        // Gọi service để lấy dữ liệu
        const events = await blockchainService.getUserEvents(username, limit);

        if (!events || events.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Không tìm thấy sự kiện nào cho người dùng này'
        });
        }

        res.json({
        success: true,
        data: events
        });
    } catch (error) {
        console.error('❌ Lỗi khi lấy sự kiện người dùng:', error);
        res.status(500).json({
        success: false,
        message: 'Lỗi server khi truy xuất sự kiện',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
    }
}

export default new BlockchainController();