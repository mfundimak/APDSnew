// Import necessary modules
import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import transaction from '../models/transaction.mjs';
import account from '../models/account.mjs';

dotenv.config(); // Load environment variables

const router = express.Router();

// Enhanced Middleware for JWT authentication
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) {
        console.warn(`[${new Date().toISOString()}] Unauthorized access attempt: No token provided.`);
        return res.status(401).json({ 
            status: 'error', 
            errorCode: 'AUTH_MISSING_TOKEN', 
            message: 'Authorization required.', 
            timestamp: new Date().toISOString() 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        const isExpired = error.name === 'TokenExpiredError';
        console.error(`[${new Date().toISOString()}] ${isExpired ? 'Expired token' : 'Invalid token'}: ${error.message}`);
        res.status(401).json({
            status: 'error',
            errorCode: isExpired ? 'AUTH_TOKEN_EXPIRED' : 'AUTH_INVALID_TOKEN',
            message: isExpired ? 'Session has expired. Please log in again.' : 'Invalid token.',
            timestamp: new Date().toISOString()
        });
    }
};

// Initiate Transaction
router.post('/', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'client') {
            console.warn(`[${new Date().toISOString()}] Unauthorized access attempt by user ${req.user.userId} with role ${req.user.role}.`);
            return res.status(403).json({ message: 'Unauthorized access.' });
        }

        const { amount, currency, provider, payeeAccount, swiftCode } = req.body;
        const currencyOptions = /^(USD|EUR|AUD|CAD|GBP)$/;
        const routingPattern = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;

        if (!amount || amount <= 0) {
            console.warn(`[${new Date().toISOString()}] Invalid transaction amount ${amount} by user ${req.user.userId}.`);
            return res.status(400).json({ message: 'Invalid total amount.' });
        }

        if (!currencyOptions.test(currency)) {
            console.warn(`[${new Date().toISOString()}] Unsupported currency type ${currency} attempted by user ${req.user.userId}.`);
            return res.status(400).json({ message: 'Unsupported currency type.' });
        }

        if (provider !== 'SWIFT') {
            console.warn(`[${new Date().toISOString()}] Unsupported service provider ${provider} used by user ${req.user.userId}.`);
            return res.status(400).json({ message: 'Unsupported service provider.' });
        }

        if (!routingPattern.test(swiftCode)) {
            console.warn(`[${new Date().toISOString()}] Invalid SWIFT code ${swiftCode} entered by user ${req.user.userId}.`);
            return res.status(400).json({ message: 'Invalid routing code.' });
        }

        const newTransaction = new transaction({
            client: req.user.userId,
            amount,
            currency,
            provider,
            payeeAccount,
            swiftCode,
        });

        await newTransaction.save();
        console.log(`[${new Date().toISOString()}] Transaction ${newTransaction._id} created successfully by user ${req.user.userId}.`);
        res.status(201).json({ message: 'Transaction created successfully.', transaction: newTransaction });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Server error during transaction creation: ${error.message}`);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// Retrieve Transactions (for Staff)
router.get('/', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'staff') {
            console.warn(`[${new Date().toISOString()}] Unauthorized transaction retrieval attempt by user ${req.user.userId}.`);
            return res.status(403).json({ message: 'Unauthorized access.' });
        }

        const transactions = await transaction.find().populate('client', 'name accountID');
        console.log(`[${new Date().toISOString()}] User ${req.user.userId} retrieved all transactions.`);
        res.json(transactions);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Server error during transaction retrieval: ${error.message}`);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// Approve Transaction (for Staff)
router.put('/:id/verify', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'staff') {
            console.warn(`[${new Date().toISOString()}] Unauthorized transaction approval attempt by user ${req.user.userId}.`);
            return res.status(403).json({ message: 'Unauthorized access.' });
        }

        const transaction = await transaction.findById(req.params.id);
        if (!transaction) {
            console.warn(`[${new Date().toISOString()}] Transaction ID ${req.params.id} not found during approval attempt by user ${req.user.userId}.`);
            return res.status(404).json({ message: 'Transaction not found.' });
        }

        transaction.status = 'approved';
        await transaction.save();
        console.log(`[${new Date().toISOString()}] Transaction ${transaction._id} approved by user ${req.user.userId}.`);
        res.json({ message: 'Transaction approved successfully.', transaction });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Server error during transaction approval: ${error.message}`);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

export default router;
