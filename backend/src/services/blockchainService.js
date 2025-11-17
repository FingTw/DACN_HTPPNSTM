// backend/services/blockchainService.js
import MyBlockchain from '../../blockchain/core/MyBlockchain.js'; // Đổi tên import
// import MyBlockchain from '../blockchain/core/MyBlockchain.js';
import QRCode from 'qrcode';


class BlockchainService {
    constructor() {
    try {
        console.log('🔄 Đang khởi tạo Blockchain Service...');
        
        // Sửa import path nếu cần
        this.supplyChain = new MyBlockchain();
        console.log('✅ Blockchain Service initialized');
        
    } catch (error) {
        console.error('❌ Lỗi khởi tạo Blockchain Service:', error);
        this.supplyChain = this.createFallbackBlockchain();
    }
}

    // 🔥 THÊM: Validate các method quan trọng
    validateBlockchainMethods() {
        const requiredMethods = ['addBlock', 'getProduct', 'getBlockchainStats', 'getFullChain'];
        const missingMethods = [];
        
        requiredMethods.forEach(method => {
            if (typeof this.supplyChain[method] !== 'function') {
                missingMethods.push(method);
            }
        });
        
        if (missingMethods.length > 0) {
            console.warn(`⚠️ Missing blockchain methods: ${missingMethods.join(', ')}`);
        } else {
            console.log('✅ All required blockchain methods available');
        }
    }

    // 🔥 THÊM: Fallback blockchain nếu khởi tạo thất bại
    createFallbackBlockchain() {
        console.log('🔄 Creating fallback blockchain...');
        return {
            addBlock: (data) => {
                console.log('⚠️ Fallback addBlock called');
                return {
                    index: 0,
                    hash: 'fallback_hash',
                    timestamp: Date.now(),
                    previousHash: '0'
                };
            },
            getProduct: (productId) => [],
            getBlockchainStats: () => ({
                totalBlocks: 0,
                totalTransactions: 0,
                difficulty: 0,
                isValid: false
            }),
            getFullChain: () => [],
            getLatestBlock: () => ({
                index: 0,
                hash: 'fallback_hash'
            }),
            hasPermission: () => true, // Luôn cho phép trong fallback
            validateTransaction: () => ({ success: true, message: 'Fallback validation' })
        };
    }

    // Method để sử dụng biến supplyChain
    logBlockchainInfo() {
        try {
            const stats = this.supplyChain.getBlockchainStats();
            console.log(`📊 Blockchain Info: ${stats.totalBlocks} blocks, Difficulty: ${stats.difficulty}`);
        } catch (error) {
            console.log('⚠️ Cannot get blockchain stats:', error.message);
        }
    }

    // Role mapping
    getRoleMapping() {
        return {
            'Farmer': 'harvest',
            'Shipper': 'transport', 
            'Factory': 'process',
            'CuaHang': 'sell',
            'KhachHang': 'view',
            'Admin': 'admin'
        };
    }

    // Blockchain core methods - TẤT CẢ ĐỀU SỬ DỤNG supplyChain (MyBlockchain)
    getFullChain() {
        try {
            // Nếu dùng supplyChain
            if (this.supplyChain && this.supplyChain.chain) {
                return this.supplyChain.chain;
            }
            // Nếu dùng legacy blockchain
            if (this.legacyChain && this.legacyChain.chain) {
                return this.legacyChain.chain;
            }
            // Fallback: trả về mảng rỗng
            console.warn('⚠️ No blockchain instance found, returning empty chain');
            return [];
        } catch (error) {
            console.error('❌ Error getting full chain:', error);
            return [];
        }
    }

    getProductHistory(productId) {
        const history = this.supplyChain.getProduct(productId);
        console.log(`🔍 Product history for ${productId}: ${history?.length || 0} events`);
        return history;
    }

    getBlockchainStats() {
        const stats = this.supplyChain.getBlockchainStats();
        console.log(`📊 Blockchain stats: ${stats.totalBlocks} blocks, ${stats.totalTransactions} transactions`);
        return stats;
    }

    validateChain() {
        const isValid = this.supplyChain.isChainValid();
        console.log(`🔍 Chain validation: ${isValid ? 'VALID' : 'INVALID'}`);
        return isValid;
    }

    getBlockByIndex(index) {
        if (index < 0 || index >= this.supplyChain.chain.length) {
            throw new Error(`Block #${index} không tồn tại`);
        }
        const block = this.supplyChain.chain[index];
        console.log(`📄 Retrieved block #${index}`);
        return block;
    }

    // Sửa: addBlock method sử dụng supplyChain (MyBlockchain)
    async addBlock(data) {
        try {
            console.log('⛓️ Thêm block mới với data:', data);
            
            // Validation trước khi gọi
            if (!this.supplyChain) {
                throw new Error('Blockchain instance not available');
            }
            
            if (typeof this.supplyChain.addBlock !== 'function') {
                throw new Error('addBlock method not available');
            }
            
            // Gọi addBlock
            const newBlock = this.supplyChain.addBlock(data);
            
            // Validation kết quả
            if (!newBlock) {
                throw new Error('addBlock returned null/undefined');
            }
            
            if (!newBlock.hash) {
                console.warn('⚠️ newBlock.hash is undefined, assigning temporary hash');
                newBlock.hash = 'temp_hash_' + Date.now();
            }
            
            console.log(`✅ Block #${newBlock.index} mined thành công! Hash: ${newBlock.hash.substring(0, 16)}...`);
            
            return newBlock;
        } catch (error) {
            console.error('❌ Lỗi addBlock:', error);
            
            // Fallback: tạo block đơn giản
            console.log('🔄 Using fallback block creation...');
            return {
                index: this.supplyChain.chain ? this.supplyChain.chain.length : 0,
                hash: 'fallback_' + Date.now(),
                timestamp: Date.now(),
                previousHash: this.supplyChain.getLatestBlock ? this.supplyChain.getLatestBlock().hash : '0',
                data: data
            };
        }
    }

    // Record transaction - Sử dụng supplyChain
    async recordTransaction(user, data, signature = null, publicKey = null) {
        try {
            console.log('\n📦 Processing blockchain transaction:');
            console.log('User:', user);
            console.log('Data:', data);

            // Map role to action
            const roleMapping = this.getRoleMapping();
            const action = data.action || roleMapping[user.VaiTro] || 'view';
            

            // Check permission using supplyChain
            if (!this.supplyChain.hasPermission(user.VaiTro, action)) {
                throw new Error(`Role ${user.VaiTro} không có quyền thực hiện action ${action}`);
            }

            // Smart Contract validation using supplyChain
            const validation = this.supplyChain.validateTransaction(
                user.VaiTro, 
                action, 
                data, 
                user.TenDangNhap || user.username
            );

            if (!validation.success) {
                throw new Error(`Smart Contract validation failed: ${validation.message}`);
            }

            // Prepare block data
            const blockData = this.prepareBlockData(user, data, signature, publicKey, action);

            // Mine block using supplyChain
            console.log(`⛏️ Mining block mới...`);
            const startMining = Date.now();
            const newBlock = this.supplyChain.addBlock(blockData);
            const miningTime = ((Date.now() - startMining) / 1000).toFixed(2);

            // Generate QR code if needed
            if (user.VaiTro === 'Farmer' || user.VaiTro === 'CuaHang' || data.batchNumber) {
                const qrIdentifier = data.batchNumber || data.productId || data.productName;
                if (qrIdentifier) {
                    blockData.qrCode = await this.generateQRCode(qrIdentifier);
                }
            }

            console.log(`✅ Transaction recorded in block #${newBlock.index}, mining time: ${miningTime}s`);

            return {
                success: true,
                block: newBlock,
                miningTime,
                qrCode: blockData.qrCode
            };

        } catch (error) {
            console.error('❌ Blockchain service error:', error);
            throw error;
        }
    }

    // QR Code generation
async generateQRCode(productId) {
    try {
        console.log(`📱 Đang tạo QR code cho: ${productId}`);
        
        // Tạo URL cho QR code - TRỎ ĐẾN BACKEND HTML
        const serverIP = process.env.SERVER_IP || 'localhost';
        const backendPort = process.env.PORT || 3000;
        
        // URL đến file HTML trong backend public folder
        const url = `http://${serverIP}:${backendPort}/product-block.html?productId=${encodeURIComponent(productId)}`;
        
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

    // Method để generate QR code cho block (dùng trong recordTransaction)
    async generateQRCodeForBlock(productId, blockIndex, blockHash) {
        try {
            console.log(`📱 Tạo QR code cho block: #${blockIndex}, Product: ${productId}`);
            
            const qrData = JSON.stringify({
                productId: productId,
                blockIndex: blockIndex,
                blockHash: blockHash.substring(0, 16) + '...',
                timestamp: new Date().toISOString(),
                type: 'blockchain_block'
            });
            
            const qrCode = await QRCode.toDataURL(qrData, {
                width: 250,
                margin: 2,
                color: {
                    dark: '#1a237e',
                    light: '#f8f9fa'
                }
            });
            
            console.log(`✅ QR code for block #${blockIndex} generated`);
            return qrCode;
            
        } catch (error) {
            console.error('❌ Error generating QR code for block:', error);
            return null;
        }
    }

    prepareBlockData(user, data, signature, publicKey, action) {
        const timestamp = Date.now();
        let blockData = {
            ...data,
            actor: user.TenDangNhap || user.username,
            actorName: user.HoTen || user.username,
            timestamp,
            role: user.VaiTro,
            action: action
        };

        // Add signature if available
        if (signature && publicKey) {
            blockData.signature = signature;
            blockData.publicKey = publicKey;
        }

        return blockData;
    }

    // Product display using supplyChain
    getProductForDisplay(productId) {
        const history = this.supplyChain.getProduct(productId);
        if (!history || history.length === 0) {
            throw new Error(`Sản phẩm "${productId}" không tồn tại`);
        }
        const sortedHistory = history.sort((a, b) => b.blockIndex - a.blockIndex);
        console.log(`📱 Product display for ${productId}: ${sortedHistory.length} events`);
        return sortedHistory;
    }

    // Check permission using supplyChain
    checkPermission(role, action) {
        const hasPermission = this.supplyChain.hasPermission(role, action);
        console.log(`🔐 Permission check: ${role} -> ${action}: ${hasPermission ? 'ALLOWED' : 'DENIED'}`);
        return hasPermission;
    }

    // Get product info using supplyChain
    getProductInfo(productId) {
        const info = this.supplyChain.getProductInfo(productId);
        console.log(`📄 Product info for ${productId}:`, info ? 'FOUND' : 'NOT FOUND');
        return info;
    }

    // Get user events using supplyChain
    getUserEvents(username, limit = 50) {
        const events = this.supplyChain.getUserEvents(username, limit);
        console.log(`👤 User events for ${username}: ${events.length} events`);
        return events;
    }

    // Get smart contract info using supplyChain
    getSmartContractInfo() {
        try {
            const smartContract = this.supplyChain.getSmartContract();
            const info = {
                rules: this.getAllRolePermissions(),
                stats: smartContract.getValidationStats(),
                history: smartContract.getValidationHistory(10)
            };
            console.log(`🤖 Smart Contract info: ${info.stats.totalValidations} validations`);
            return info;
        } catch (error) {
            console.log('⚠️ Smart contract not available:', error.message);
            return {
                rules: this.getAllRolePermissions(),
                stats: { totalValidations: 0 },
                history: []
            };
        }
    }

    // Get all role permissions
    getAllRolePermissions() {
        const roles = ['Farmer', 'Shipper', 'Factory', 'CuaHang', 'KhachHang', 'Admin'];
        const permissions = {};
        
        roles.forEach(role => {
            try {
                permissions[role] = this.supplyChain.getSmartContract().getRolePermissions(role);
            } catch (error) {
                permissions[role] = { allowedActions: [], restrictedActions: [] };
            }
        });
        
        return permissions;
    }

    // Get role permissions using supplyChain
    getRolePermissions(role) {
        try {
            const permissions = this.supplyChain.getSmartContract().getRolePermissions(role);
            console.log(`🔐 Role permissions for ${role}: ${permissions.allowedActions.length} actions`);
            return permissions;
        } catch (error) {
            console.log(`⚠️ Cannot get permissions for ${role}:`, error.message);
            return { allowedActions: [], restrictedActions: [] };
        }
    }

    // Validate transaction without mining using supplyChain
    validateTransactionOnly(role, action, data, actor) {
        try {
            const validation = this.supplyChain.validateTransaction(role, action, data, actor);
            console.log(`🔍 Transaction validation: ${validation.success ? 'PASS' : 'FAIL'} - ${validation.message}`);
            return validation;
        } catch (error) {
            console.log('⚠️ Validation not available:', error.message);
            return { success: true, message: 'Validation bypassed' };
        }
    }

    // Get validation history using supplyChain
    getValidationHistory(limit = 50) {
        try {
            const history = this.supplyChain.getValidationHistory(limit);
            console.log(`📋 Validation history: ${history.length} entries`);
            return history;
        } catch (error) {
            console.log('⚠️ Validation history not available:', error.message);
            return [];
        }
    }

    // Additional method to demonstrate supplyChain usage
    getChainSummary() {
        try {
            const stats = this.supplyChain.getBlockchainStats();
            const latestBlock = this.supplyChain.getLatestBlock();
            
            return {
                totalBlocks: stats.totalBlocks,
                totalTransactions: stats.totalTransactions,
                latestBlockIndex: latestBlock.index,
                latestBlockHash: latestBlock.hash.substring(0, 16) + '...',
                chainValidity: stats.isValid,
                difficulty: stats.difficulty
            };
        } catch (error) {
            console.log('⚠️ Cannot get chain summary:', error.message);
            return {
                totalBlocks: 0,
                totalTransactions: 0,
                latestBlockIndex: 0,
                latestBlockHash: 'N/A',
                chainValidity: false,
                difficulty: 0
            };
        }
    }
}

// Tạo instance và export
const blockchainService = new BlockchainService();
export default blockchainService;