// frontend/src/types/blockchain.ts
export interface BlockchainBlock {
    index: number;
    timestamp: number;
    data: TransactionData;
    hash: string;
    previousHash: string;
    nonce?: number;
}

export interface TransactionData {
    productId?: string;
    batchNumber?: string;
    productName?: string;
    location: string;
    status?: string;
    actor: string;
    role: string;
    action: string;
    timestamp: number;
    quantity?: number;
    quality?: string;
    price?: number;
    qrCode?: string;
    signature?: string;
    publicKey?: string;
    [key: string]: any;
}

export interface SmartContractRule {
    role: string;
    allowedActions: string[];
    requiredFields: string[];
    validationLogic?: (data: any) => boolean;
}