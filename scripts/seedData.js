require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');

const sampleProducts = [
    {
        productId: 'PROD001',
        name: 'Laptop Dell XPS 13',
        description: 'High-performance laptop with 16GB RAM',
        category: 'Electronics',
        price: 1299.99,
        unit: 'piece',
        minStockLevel: 5
    },
    {
        productId: 'PROD002',
        name: 'iPhone 14 Pro',
        description: 'Latest iPhone model with 256GB storage',
        category: 'Electronics',
        price: 999.99,
        unit: 'piece',
        minStockLevel: 10
    },
    {
        productId: 'PROD003',
        name: 'Nike Air Max',
        description: 'Premium running shoes',
        category: 'Footwear',
        price: 129.99,
        unit: 'pair',
        minStockLevel: 15
    },
    {
        productId: 'PROD004',
        name: 'Samsung 4K TV',
        description: '65-inch Smart TV',
        category: 'Electronics',
        price: 799.99,
        unit: 'piece',
        minStockLevel: 3
    },
    {
        productId: 'PROD005',
        name: 'Coffee Maker',
        description: 'Professional grade coffee machine',
        category: 'Appliances',
        price: 199.99,
        unit: 'piece',
        minStockLevel: 8
    }
];

const sampleInventories = [
    {
        productId: 'PROD001',
        vendorId: 'VENDOR001',
        quantityAvailable: 20,
        lastSync: new Date()
    },
    {
        productId: 'PROD001',
        vendorId: 'VENDOR002',
        quantityAvailable: 15,
        lastSync: new Date()
    },
    {
        productId: 'PROD002',
        vendorId: 'VENDOR001',
        quantityAvailable: 30,
        lastSync: new Date()
    },
    {
        productId: 'PROD003',
        vendorId: 'VENDOR003',
        quantityAvailable: 50,
        lastSync: new Date()
    },
    {
        productId: 'PROD004',
        vendorId: 'VENDOR002',
        quantityAvailable: 10,
        lastSync: new Date()
    },
    {
        productId: 'PROD005',
        vendorId: 'VENDOR001',
        quantityAvailable: 25,
        lastSync: new Date()
    }
];

async function seedData() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Clear existing data
        await Product.deleteMany({});
        await Inventory.deleteMany({});
        console.log('Cleared existing data');

        // Insert new data
        await Product.insertMany(sampleProducts);
        console.log('Products seeded');

        await Inventory.insertMany(sampleInventories);
        console.log('Inventories seeded');

        console.log('Data seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
}

seedData(); 