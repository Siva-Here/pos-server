require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const Inventory = require('./models/Inventory');
const verifyApiKey = require('./middleware/auth');

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('✅ POS Server successfully connected to MongoDB');
})
.catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

const PORTAL_SERVER_URL = process.env.PORTAL_SERVER_URL;

// 1. Stock Refill API
app.post('/api/inventory/refill', async (req, res) => {
    try {
        const { productId, vendorId, quantity } = req.body;
        
        // Update local inventory
        const inventory = await Inventory.findOneAndUpdate(
            { productId, vendorId },
            { 
                $inc: { quantityAvailable: quantity },
                $set: { lastSync: new Date() }
            },
            { upsert: true, new: true }
        );

        // Sync with portal server
        await axios.post(`${PORTAL_SERVER_URL}/api/sync/refill`, {
            productId,
            vendorId,
            quantity,
            timestamp: new Date()
        }, {
            headers: {
                'X-API-Key': 'your_portal_api_key_here'
            }
        });

        res.json({ success: true, inventory });
    } catch (error) {
        console.error('Refill error:', error);
        res.status(500).json({ error: 'Failed to process refill' });
    }
});

// 2. Audit Update API
app.post('/api/inventory/audit', async (req, res) => {
    try {
        const { productId, vendorId, newQuantity, reason } = req.body;
        
        // Update local inventory
        const inventory = await Inventory.findOneAndUpdate(
            { productId, vendorId },
            { 
                $set: { 
                    quantityAvailable: newQuantity,
                    lastSync: new Date()
                }
            },
            { upsert: true, new: true }
        );

        // Sync with portal server
        await axios.post(`${PORTAL_SERVER_URL}/api/sync/audit`, {
            productId,
            vendorId,
            newQuantity,
            reason,
            timestamp: new Date()
        }, {
            headers: {
                'X-API-Key': 'your_portal_api_key_here'
            }
        });

        res.json({ success: true, inventory });
    } catch (error) {
        console.error('Audit error:', error);
        res.status(500).json({ error: 'Failed to process audit' });
    }
});

// 3. Sales Update API
app.post('/api/inventory/sale', async (req, res) => {
    try {
        const { productId, vendorId, quantity } = req.body;
        
        // Update local inventory
        const inventory = await Inventory.findOneAndUpdate(
            { 
                productId, 
                vendorId,
                quantityAvailable: { $gte: quantity } // Check if enough stock
            },
            { 
                $inc: { quantityAvailable: -quantity },
                $set: { lastSync: new Date() }
            },
            { new: true }
        );

        if (!inventory) {
            return res.status(400).json({ error: 'Insufficient stock' });
        }

        // Sync with portal server
        await axios.post(`${PORTAL_SERVER_URL}/api/sync/sale`, {
            productId,
            vendorId,
            quantity,
            timestamp: new Date()
        }, {
            headers: {
                'X-API-Key': 'your_portal_api_key_here'
            }
        });

        res.json({ success: true, inventory });
    } catch (error) {
        console.error('Sale error:', error);
        res.status(500).json({ error: 'Failed to process sale' });
    }
});

// 4. Portal Purchase Sync API
app.post('/api/pos/sync', verifyApiKey, async (req, res) => {
    try {
        const { productId, vendorId, quantity, orderId } = req.body;
        
        // Check if we have enough stock
        const inventory = await Inventory.findOne({ productId, vendorId });
        if (!inventory || inventory.quantityAvailable < quantity) {
            return res.status(400).json({ 
                error: 'Insufficient stock',
                currentStock: inventory ? inventory.quantityAvailable : 0
            });
        }

        // Update local inventory
        const updatedInventory = await Inventory.findOneAndUpdate(
            { 
                productId, 
                vendorId,
                quantityAvailable: { $gte: quantity }
            },
            { 
                $inc: { quantityAvailable: -quantity },
                $set: { 
                    lastSync: new Date(),
                    lastOrderId: orderId
                }
            },
            { new: true }
        );

        res.json({ 
            success: true, 
            inventory: updatedInventory,
            message: `Successfully synced order ${orderId}`
        });
    } catch (error) {
        console.error('POS sync error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to sync with POS system',
            details: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`POS Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
}); 