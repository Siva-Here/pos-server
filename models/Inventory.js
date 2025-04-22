const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    productId: {
        type: String,
        required: true,
        index: true
    },
    vendorId: {
        type: String,
        required: true,
        index: true
    },
    quantityAvailable: {
        type: Number,
        default: 0
    },
    lastSync: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema); 