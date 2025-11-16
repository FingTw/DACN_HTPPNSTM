import blockchainService from '../services/blockchainService.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sql from 'mssql';
import QRCode from 'qrcode';


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
    constructor() {
        // Gán supplyChain từ blockchainService
        this.supplyChain = blockchainService;
    }
    // Ánh xạ vai trò trong DB -> hành động trong blockchain
    getRoleMapping() {
        return {
            'Nông dân': 'Farmer',
            'Farmer': 'Farmer',
            'Nhà máy': 'Factory',
            'Factory': 'Factory',
            'Shipper': 'Shipper',
            'Cửa hàng': 'CuaHang',
            'CuaHang': 'CuaHang',
            'Khách hàng': 'KhachHang',
            'KhachHang': 'KhachHang',
            'Admin': 'Admin'
        };
    }

    // Blockchain operations với user mới
    async recordTransaction(user, data, signature = null, publicKey = null) {
        try {
            console.log('\n📦 Processing blockchain transaction:');
            console.log('👤 User:', {
                TenDangNhap: user.TenDangNhap,
                VaiTro: user.VaiTro,
                HoTen: user.HoTen
            });
            console.log('📝 Data:', data);

            // Map role to action
            const roleMapping = this.getRoleMapping();
            const action = data.action || roleMapping[user.VaiTro] || 'view';
            
            console.log(`🔐 Role mapping: ${user.VaiTro} -> ${action}`);

            // Check permission using supplyChain
            if (this.supplyChain.hasPermission) {
                const hasPermission = this.supplyChain.hasPermission(user.VaiTro, action);
                console.log(`🔐 Permission check: ${hasPermission ? '✅ ALLOWED' : '❌ DENIED'}`);
                
                if (!hasPermission) {
                    throw new Error(`Role ${user.VaiTro} không có quyền thực hiện action ${action}`);
                }
            } else {
                console.log('⚠️ Permission check skipped - hasPermission method not available');
            }

            // Smart Contract validation using supplyChain
            let validation = { success: true, message: 'Validation passed' };
            if (this.supplyChain.validateTransaction) {
                validation = this.supplyChain.validateTransaction(
                    user.VaiTro, 
                    action, 
                    data, 
                    user.TenDangNhap || user.username
                );
                console.log(`🔍 Smart Contract validation: ${validation.success ? '✅ PASS' : '❌ FAIL'} - ${validation.message}`);
                
                if (!validation.success) {
                    throw new Error(`Smart Contract validation failed: ${validation.message}`);
                }
            } else {
                console.log('⚠️ Smart Contract validation skipped - validateTransaction method not available');
            }

            // Prepare block data
            const blockData = this.prepareBlockData(user, data, signature, publicKey, action);
            console.log('📦 Prepared block data:', blockData);

            // Mine block using supplyChain
            console.log(`⛏️ Mining new block...`);
            const startMining = Date.now();
            if (!this.supplyChain) {
                throw new Error('supplyChain is not initialized');
            }

            if (!this.supplyChain.addBlock) {
                throw new Error('addBlock method not available in supplyChain');
            }

            console.log('🔍 SupplyChain methods:', Object.keys(this.supplyChain));

            const newBlock = this.supplyChain.addBlock(blockData);
            if (!newBlock) {
                throw new Error('addBlock returned null/undefined');
            }

            if (!newBlock.hash) {
                console.warn('⚠️ newBlock.hash is undefined, block might not be mined properly');
                // Gán hash tạm thời nếu cần
                newBlock.hash = 'pending_' + Date.now();
            }

            const miningTime = ((Date.now() - startMining) / 1000).toFixed(2);
            // Kiểm tra và gọi addBlock
            if (!this.supplyChain.addBlock) {
                throw new Error('addBlock method not available in supplyChain');
            }
            
            // const newBlock = this.supplyChain.addBlock(blockData);
            // const miningTime = ((Date.now() - startMining) / 1000).toFixed(2);

            console.log(`✅ Block mined: #${newBlock.index}, Hash: ${newBlock.hash ? newBlock.hash.substring(0, 16) + '...' : 'N/A'}, Time: ${miningTime}s`);            // Generate QR code if needed - CẢI THIỆN PHẦN NÀY
            let qrCode = null;
            const shouldGenerateQR = user.VaiTro === 'Farmer' || user.VaiTro === 'CuaHang' || data.batchNumber || data.productId;
            
            if (shouldGenerateQR) {
                const qrIdentifier = data.batchNumber || data.productId || data.productName;
                if (qrIdentifier) {
                    try {
                        console.log(`📱 Generating QR code for: ${qrIdentifier}`);
                        qrCode = await this.generateQRCode(qrIdentifier);
                        if (qrCode) {
                            console.log('✅ QR code generated successfully');
                        } else {
                            console.log('⚠️ QR code generation returned null');
                        }
                    } catch (qrError) {
                        console.error('❌ QR code generation failed:', qrError.message);
                        // Không throw error, tiếp tục không có QR code
                    }
                }
            }

            // Prepare response data
            const responseData = {
                success: true,
                message: 'Giao dịch đã được ghi vào blockchain thành công!',
                block: {
                    index: newBlock.index,
                    hash: newBlock.hash,
                    timestamp: newBlock.timestamp,
                    previousHash: newBlock.previousHash,
                    nonce: newBlock.nonce
                },
                miningTime: `${miningTime}s`,
                transaction: {
                    productId: data.productId,
                    eventType: data.eventType,
                    location: data.location,
                    actor: user.TenDangNhap,
                    role: user.VaiTro,
                    timestamp: newBlock.timestamp
                }
            };

            // Thêm QR code vào response nếu có
            if (qrCode) {
                responseData.qrCode = qrCode;
                responseData.message += ' QR code đã được tạo.';
            }

            console.log(`🎉 Transaction completed successfully!`);
            console.log(`📊 Block #${newBlock.index} mined in ${miningTime}s`);

            return responseData;

        } catch (error) {
            console.error('❌ Blockchain service error:', error);
            
            // Phân loại lỗi để trả về message phù hợp
            let errorMessage = error.message;
            if (error.message.includes('permission') || error.message.includes('quyền')) {
                errorMessage = `Lỗi quyền truy cập: ${error.message}`;
            } else if (error.message.includes('validation')) {
                errorMessage = `Lỗi xác thực: ${error.message}`;
            } else if (error.message.includes('addBlock')) {
                errorMessage = `Lỗi hệ thống blockchain: ${error.message}`;
            }
            
            throw new Error(errorMessage);
        }
    }

    // Thêm ngay trong class BlockchainController
    async recordTransactionHandler(req, res) {
    try {
        const user = req.user;
        const data = req.body;

        const result = await this.recordTransaction(user, data);

        res.status(200).json(result);
    } catch (error) {
        console.error('❌ recordTransactionHandler error:', error);
        res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi ghi giao dịch blockchain'
        });
    }
    }

    // Prepare block data - CẬP NHẬT THÊM
    prepareBlockData(user, data, signature, publicKey, action) {
        const timestamp = new Date().toISOString();
        
        // Tạo block data cơ bản
        let blockData = {
            // Thông tin giao dịch
            productId: data.productId,
            eventType: data.eventType,
            location: data.location,
            notes: data.notes,
            
            // Thông tin người thực hiện
            actor: user.TenDangNhap || user.username,
            actorName: user.HoTen || user.username,
            role: user.VaiTro,
            action: action,
            
            // Metadata
            timestamp: timestamp,
            version: '1.0',
            
            // Các trường dữ liệu bổ sung
            quantity: data.quantity,
            quality: data.quality,
            price: data.price,
            batchNumber: data.batchNumber,
            fromLocation: data.fromLocation,
            toLocation: data.toLocation,
            seedType: data.seedType,
            area: data.area,
            yield: data.yield,
            waterSource: data.waterSource,
            fertilizerType: data.fertilizerType,
            harvestDate: data.harvestDate,
            saleDate: data.saleDate,
            duration: data.duration,
            temperature: data.temperature,
            customerType: data.customerType,
            imageUrl: data.imageUrl
        };

        // Loại bỏ các trường null/undefined
        Object.keys(blockData).forEach(key => {
            if (blockData[key] === null || blockData[key] === undefined || blockData[key] === '') {
                delete blockData[key];
            }
        });

        // Add signature if available
        if (signature && publicKey) {
            blockData.signature = signature;
            blockData.publicKey = publicKey;
        }

        console.log('📦 Final block data (cleaned):', blockData);
        return blockData;
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

    // generateQRCode 
    async generateQRCode(productId) {
    try {
        console.log(`📱 Đang tạo QR code cho: ${productId}`);
        
        // Sử dụng IP và PORT từ server.js thay vì localhost
        const serverIP = process.env.SERVER_IP || 'localhost';
        const backendPort = process.env.PORT || 3000; 
        
        // 🔥 QUAN TRỌNG: Trỏ đến route /product/:productId trong server.js
        const url = `http://${serverIP}:${backendPort}/product/${encodeURIComponent(productId)}`;
        
        console.log(`🔗 QR Code URL: ${url}`);
        
        // Tạo QR code với options
        const qrCode = await QRCode.toDataURL(url, { 
            width: 300,
            height: 300,
            margin: 2,
            color: {
                dark: '#1a237e',      // Màu tối - xanh đậm
                light: '#FFFFFF'      // Màu sáng - trắng
            },
            errorCorrectionLevel: 'H' // High error correction
        });
        
        console.log(`✅ Generated QR code successfully for: ${productId}`);
        console.log(`📏 QR Code size: ${qrCode.length} characters`);
        
        return qrCode;
        
    } catch (error) {
        console.error('❌ QR Code generation error:', error);
        
        // Fallback: Tạo QR code đơn giản hơn
        try {
            console.log('🔄 Thử tạo QR code với cài đặt đơn giản...');
            const simpleUrl = `Product: ${productId}`;
            const simpleQR = await QRCode.toDataURL(simpleUrl, {
                width: 200,
                margin: 1
            });
            console.log('✅ Fallback QR code created');
            return simpleQR;
        } catch (fallbackError) {
            console.error('❌ Fallback QR code also failed:', fallbackError);
            return null;
        }
    }
}

    // Lấy tất cả blocks của một sản phẩm
    // Endpoint đơn giản để lấy blocks của sản phẩm
async getProductBlocks(req, res) {
    try {
        const { productId } = req.params;
        
        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu productId'
            });
        }

        console.log(`🔍 Getting blocks for product: ${productId}`);
        
        let productBlocks = [];
        try {
            const fullChain = blockchainService.getFullChain();
            productBlocks = fullChain.filter(block => 
                block.data && 
                block.data.productId && 
                block.data.productId.toString() === productId.toString()
            ).map(block => ({
                index: block.index,
                hash: block.hash,
                timestamp: block.timestamp,
                eventType: block.data.eventType || 'Unknown',
                location: block.data.location || 'Unknown',
                actor: block.data.actor || 'Unknown',
                role: block.data.role || 'Unknown',
                notes: block.data.notes
            }));
        } catch (error) {
            console.log('⚠️ Error filtering blocks:', error.message);
        }

        console.log(`✅ Found ${productBlocks.length} blocks for product: ${productId}`);

        res.json({
            success: true,
            data: {
                productId: productId,
                totalBlocks: productBlocks.length,
                blocks: productBlocks
            },
            message: `Tìm thấy ${productBlocks.length} blocks cho sản phẩm ${productId}`
        });

    } catch (error) {
        console.error('❌ Get product blocks error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy thông tin blocks'
        });
    }
}

    // Thêm method mới để get QR code cho block
    async generateBlockQRCode(req, res) {
        try {
            const { productId, blockIndex, blockHash } = req.params;
            
            if (!productId || !blockIndex) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu productId hoặc blockIndex'
                });
            }

            console.log(`📱 Request block QR code: Product ${productId}, Block #${blockIndex}`);

            const qrCode = await blockchainService.generateQRCodeForBlock(
                productId, 
                parseInt(blockIndex), 
                blockHash || 'unknown'
            );
            
            if (!qrCode) {
                return res.status(500).json({
                    success: false,
                    message: 'Không thể tạo QR code cho block'
                });
            }

            res.json({
                success: true,
                productId: productId,
                blockIndex: parseInt(blockIndex),
                blockHash: blockHash,
                qrCode: qrCode,
                message: 'Block QR code generated successfully'
            });

        } catch (error) {
            console.error('❌ Generate block QR code error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi tạo QR code cho block'
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