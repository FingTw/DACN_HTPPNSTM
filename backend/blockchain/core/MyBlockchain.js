// backend/blockchain/core/MyBlockchain.js
import crypto from "crypto";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Định nghĩa Block class
class Block {
    constructor(timestamp, data, previousHash = '') {
        this.index = 0;
        this.timestamp = timestamp;
        this.data = data;
        this.previousHash = previousHash;
        this.nonce = 0;
        this.hash = this.calculateHash();
    }

    calculateHash() {
        return crypto.createHash('sha256')
            .update(
                this.index + 
                this.timestamp + 
                this.previousHash + 
                JSON.stringify(this.data) + 
                this.nonce
            )
            .digest('hex');
    }

    // SỬA TRONG MyBlockchain.js - mineBlock method
mineBlock(difficulty) {
    console.log(`⚡ DEVELOPMENT MODE - Bỏ qua mining cho block #${this.index}`);
    
    // 🔥 SIMPLE HASH - không mining (fix timeout)
    this.hash = this.calculateHash();
    
    console.log(`✅ Block #${this.index} đã tạo (không mining)`);
    console.log(`   Hash: ${this.hash}\n`);
    
    return this.hash;
}
}

// Smart Contract với role mới
class SimpleSmartContract {
    constructor() {
        this.validationHistory = [];
        console.log('🤖 Simple Smart Contract đã được khởi tạo');
    }

    validateTransaction(role, action, data, actor) {
        const validation = {
            success: true,
            error: null,
            timestamp: new Date().toISOString(),
            rule: `${role}.${action}`,
            message: 'Validation passed'
        };

        // Basic validation
        if (!data.location) {
            validation.success = false;
            validation.error = 'Location là bắt buộc';
            validation.message = 'Thiếu thông tin địa điểm';
        }

        // Role-specific validation
        switch(role) {
            case 'Farmer':
                if (!data.productName && !data.productId) {
                    validation.success = false;
                    validation.error = 'Farmer cần cung cấp productName hoặc productId';
                    validation.message = 'Thiếu thông tin sản phẩm';
                }
                break;
            case 'Shipper':
                if (!data.fromLocation || !data.toLocation) {
                    validation.success = false;
                    validation.error = 'Shipper cần cung cấp fromLocation và toLocation';
                    validation.message = 'Thiếu thông tin vận chuyển';
                }
                break;
            case 'Factory':
                if (!data.processType) {
                    validation.success = false;
                    validation.error = 'Factory cần cung cấp processType';
                    validation.message = 'Thiếu thông tin quy trình sản xuất';
                }
                break;
            case 'CuaHang':
                if (!data.quantity || !data.price) {
                    validation.success = false;
                    validation.error = 'CuaHang cần cung cấp quantity và price';
                    validation.message = 'Thiếu thông tin bán hàng';
                }
                break;
        }

        this.validationHistory.push(validation);
        return validation;
    }

    getValidationStats() {
        const total = this.validationHistory.length;
        const success = this.validationHistory.filter(v => v.success).length;
        return {
            totalValidations: total,
            successRate: total > 0 ? Math.round((success / total) * 100) : 100,
            successCount: success,
            failedCount: total - success
        };
    }

    getRolePermissions(role) {
        const permissions = {
            'Farmer': ['harvest', 'planting', 'fertilizing', 'watering', 'quality_check'],
            'Shipper': ['transport', 'pickup', 'intransit', 'warehouse', 'delivered'],
            'Factory': ['process', 'cleaning', 'sorting', 'roasting', 'grinding', 'packaging'],
            'CuaHang': ['sell', 'received', 'sale', 'display', 'promotion'],
            'KhachHang': ['view'],
            'Admin': ['admin', 'view_all', 'manage_users']
        };
        
        return {
            role: role,
            allowedActions: permissions[role] || [],
            description: this.getRoleDescription(role)
        };
    }

    getRoleDescription(role) {
        const descriptions = {
            'Farmer': 'Nông dân - Trồng trọt và thu hoạch',
            'Shipper': 'Nhà vận chuyển - Vận chuyển sản phẩm',
            'Factory': 'Nhà máy - Chế biến sản phẩm',
            'CuaHang': 'Cửa hàng - Bán lẻ sản phẩm',
            'KhachHang': 'Khách hàng - Xem thông tin sản phẩm',
            'Admin': 'Quản trị viên - Quản lý hệ thống'
        };
        return descriptions[role] || 'Vai trò không xác định';
    }

    canRolePerformAction(role, action) {
        const permissions = this.getRolePermissions(role);
        return permissions.allowedActions.includes(action) || role === 'Admin';
    }

    getValidationHistory(limit = 50) {
        return this.validationHistory
            .slice(-limit)
            .reverse();
    }
}

// Blockchain class chính
class Blockchain {
    constructor(difficulty = 2) {
        this.difficulty = difficulty;
        this.chain = [];
        this.pendingTransactions = [];
        this.dataFile = path.join(__dirname, '../data/blockchain_data.json');
        
        this.smartContract = new SimpleSmartContract();
        console.log('📦 Blockchain đã được khởi tạo');
        
        this.loadBlockchain();
    }

    loadBlockchain() {
        try {
            if (fs.existsSync(this.dataFile)) {
                console.log('📂 Đang load blockchain từ file...');
                const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
                
                this.chain = data.chain.map(blockData => {
                    const block = new Block(
                        blockData.timestamp,
                        blockData.data,
                        blockData.previousHash
                    );
                    block.index = blockData.index;
                    block.nonce = blockData.nonce;
                    block.hash = blockData.hash;
                    return block;
                });
                
                console.log(`✅ Đã load blockchain với ${this.chain.length} blocks`);
            } else {
                console.log('📝 Không tìm thấy blockchain, tạo mới...');
                this.chain = [this.createGenesisBlock()];
                this.saveBlockchain();
            }
        } catch (error) {
            console.error('❌ Lỗi khi load blockchain:', error.message);
            console.log('📝 Tạo blockchain mới...');
            this.chain = [this.createGenesisBlock()];
            this.saveBlockchain();
        }
    }

    saveBlockchain() {
        try {
            // Đảm bảo thư mục tồn tại
            const dataDir = path.dirname(this.dataFile);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            const data = {
                chain: this.chain,
                pendingTransactions: this.pendingTransactions,
                difficulty: this.difficulty,
                lastUpdated: new Date().toISOString(),
                totalBlocks: this.chain.length
            };
            
            fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
            console.log('💾 Đã lưu blockchain vào file');
        } catch (error) {
            console.error('❌ Lỗi khi lưu blockchain:', error.message);
        }
    }

    createGenesisBlock() {
        console.log('\n🌟 Tạo Genesis Block...');
        const genesisBlock = new Block(Date.now(), { 
            productId: "GENESIS", 
            productName: "Genesis Product",
            status: "Khởi tạo blockchain", 
            location: "System",
            actor: "System",
            role: "Admin",
            action: "initialize"
        }, "0");
        
        genesisBlock.index = 0;
        genesisBlock.mineBlock(this.difficulty);
        
        return genesisBlock;
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    // Thêm block mới với validation
    addBlock(data) {
        try {
            console.log('📝 Đang thêm block mới với data:', {
                productId: data.productId,
                productName: data.productName,
                role: data.role,
                action: data.action
            });

            // Validate với Smart Contract
            const validation = this.smartContract.validateTransaction(
                data.role,
                data.action,
                data,
                data.actor
            );

            if (!validation.success) {
                throw new Error(`Smart Contract validation failed: ${validation.error}`);
            }

            // Thêm timestamp nếu chưa có
            if (!data.timestamp) {
                data.timestamp = Date.now();
            }

            // Tạo block mới
            const previousBlock = this.getLatestBlock();
            const newBlock = new Block(
                Date.now(),
                data,
                previousBlock.hash
            );
            
            newBlock.index = this.chain.length;
            newBlock.mineBlock(this.difficulty);
            
            this.chain.push(newBlock);
            this.saveBlockchain();
            
            console.log(`✅ Đã thêm block #${newBlock.index}`);
            
            return newBlock;

        } catch (error) {
            console.error('❌ Lỗi khi thêm block:', error.message);
            throw error;
        }
    }

    // Alias cho addTransactionEvent (backward compatibility)
    addTransactionEvent(transactionData) {
        return this.addBlock(transactionData);
    }

    // Lấy lịch sử theo user
    getUserEvents(username, limit = 50) {
        const userEvents = [];
        const searchTerm = username.trim().toLowerCase();
        
        for (let i = this.chain.length - 1; i >= 0 && userEvents.length < limit; i--) {
            const block = this.chain[i];
            if (block.data && block.data.actor) {
                const blockActor = block.data.actor.trim().toLowerCase();
                if (blockActor === searchTerm) {
                    userEvents.push({
                        blockIndex: block.index,
                        timestamp: block.timestamp,
                        productId: block.data.productId,
                        productName: block.data.productName,
                        action: block.data.action,
                        eventType: block.data.eventType || block.data.action, // 🔥 THÊM DÒNG NÀY
                        location: block.data.location,
                        role: block.data.role,
                        status: this.getActionStatusText(block.data.action)
                    });
                }
            }
        }
        
        return userEvents;
    }

    getActionStatusText(action) {
        const actionTexts = {
            'harvest': 'Thu hoạch',
            'transport': 'Vận chuyển',
            'process': 'Chế biến',
            'sell': 'Bán hàng',
            'view': 'Xem thông tin',
            'planting': 'Trồng cây',
            'fertilizing': 'Bón phân',
            'watering': 'Tưới nước',
            'quality_check': 'Kiểm tra chất lượng',
            'pickup': 'Lấy hàng',
            'intransit': 'Đang vận chuyển',
            'warehouse': 'Nhập kho',
            'delivered': 'Đã giao hàng',
            'cleaning': 'Làm sạch',
            'sorting': 'Phân loại',
            'roasting': 'Rang xay',
            'grinding': 'Xay nghiền',
            'packaging': 'Đóng gói',
            'received': 'Nhập hàng',
            'sale': 'Bán hàng',
            'display': 'Trưng bày',
            'promotion': 'Khuyến mãi',
            'admin': 'Quản trị'
        };

        return actionTexts[action] || action;
    }

    // Kiểm tra tính hợp lệ của blockchain
    isChainValid() {
        console.log('\n🔍 Đang kiểm tra tính hợp lệ của blockchain...');
        
        // Kiểm tra genesis block
        const realGenesisHash = this.chain[0].calculateHash();
        if (this.chain[0].hash !== realGenesisHash) {
            console.error('❌ Genesis block không hợp lệ!');
            return false;
        }

        // Kiểm tra từng block
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            // Kiểm tra hash
            const calculatedHash = currentBlock.calculateHash();
            if (currentBlock.hash !== calculatedHash) {
                console.error(`❌ Block #${i} có hash không hợp lệ!`);
                return false;
            }

            // Kiểm tra liên kết
            if (currentBlock.previousHash !== previousBlock.hash) {
                console.error(`❌ Block #${i} không liên kết đúng với block trước!`);
                return false;
            }
        }

        console.log('✅ Blockchain hợp lệ!');
        return true;
    }

    // Lấy thống kê blockchain
    getBlockchainStats() {
        const totalTransactions = this.chain.reduce((count, block) => {
            return count + (block.data && block.data.productId ? 1 : 0);
        }, 0);

        return {
            totalBlocks: this.chain.length,
            totalTransactions: totalTransactions,
            difficulty: this.difficulty,
            pendingTransactions: this.pendingTransactions.length,
            isValid: this.isChainValid(),
            smartContractStats: this.smartContract.getValidationStats(),
            latestBlock: {
                index: this.getLatestBlock().index,
                hash: this.getLatestBlock().hash,
                timestamp: this.getLatestBlock().timestamp
            }
        };
    }

    // Lấy sự kiện theo productId
    getProduct(productId) {
        console.log(`🔍 Tìm kiếm sản phẩm: ${productId}`);
        const productEvents = [];
        const searchId = productId.trim().toLowerCase();
        
        for (let block of this.chain) {
            if (block.data && block.data.productId) {
                const blockProductId = block.data.productId.trim().toLowerCase();
                if (blockProductId === searchId) {
                    productEvents.push({
                        blockIndex: block.index,
                        timestamp: block.timestamp,
                        productId: block.data.productId,
                        productName: block.data.productName,
                        action: block.data.action,
                        location: block.data.location,
                        actor: block.data.actor,
                        role: block.data.role,
                        status: this.getActionStatusText(block.data.action),
                        // Additional fields
                        quantity: block.data.quantity,
                        quality: block.data.quality,
                        price: block.data.price,
                        batchNumber: block.data.batchNumber,
                        fromLocation: block.data.fromLocation,
                        toLocation: block.data.toLocation,
                        processType: block.data.processType,
                        imageUrl: block.data.imageUrl,
                        notes: block.data.notes
                    });
                }
            }
        }
        
        console.log(`✅ Tìm thấy ${productEvents.length} sự kiện cho sản phẩm: ${productId}`);
        return productEvents;
    }

    // Lấy toàn bộ chain
    getFullChain() {
        return this.chain;
    }

    // Lấy thông tin smart contract
    getSmartContract() {
        return this.smartContract;
    }

    // Lấy lịch sử validation
    getValidationHistory(limit = 50) {
        return this.smartContract.getValidationHistory(limit);
    }

    // Kiểm tra quyền hạn
    hasPermission(role, action) {
        return this.smartContract.canRolePerformAction(role, action);
    }

    // Validate transaction (cho API)
    validateTransaction(role, action, data, actor) {
        return this.smartContract.validateTransaction(role, action, data, actor);
    }

    // Lấy product info
    getProductInfo(productId) {
        const events = this.getProduct(productId);
        if (events.length === 0) return null;

        const latestEvent = events[events.length - 1];
        return {
            productId: productId,
            productName: latestEvent.productName,
            currentStatus: latestEvent.status,
            currentLocation: latestEvent.location,
            totalEvents: events.length,
            firstEvent: events[0],
            lastEvent: latestEvent
        };
    }
}

// Export ES6 modules
export { Blockchain, Block, SimpleSmartContract };
export default Blockchain;