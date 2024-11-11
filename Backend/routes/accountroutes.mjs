import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Account from '../models/account.mjs';  // Your Account model

const router = express.Router();

// Register Account
router.post('/register', async (req, res) => {
    try {
        const { name, identity, accountID, secret } = req.body;

        // Validation
        const identityPattern = /^[0-9]{13}$/;
        const accountNumberPattern = /^[0-9]{10}$/;
        const passwordPattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

        if (!identityPattern.test(identity)) {
            return res.status(400).json({ message: 'Invalid ID format.' });
        }

        if (!accountNumberPattern.test(accountID)) {
            return res.status(400).json({ message: 'Invalid account number format.' });
        }

        if (!passwordPattern.test(secret)) {
            return res.status(400).json({ message: 'Password must be strong and contain uppercase, lowercase, and digits.' });
        }

        const existingAccount = await Account.findOne({ $or: [{ identity }, { accountID }] });
        if (existingAccount) {
            return res.status(400).json({ message: 'Account with provided ID or account number exists.' });
        }

        // Encrypt Password
        const salt = await bcrypt.genSalt(10);
        const encryptedPassword = await bcrypt.hash(secret, salt);

        const newAccount = new Account({
            name,
            identity,
            accountID,
            secret: encryptedPassword,
        });

        await newAccount.save();
        res.status(201).json({ message: 'Account registered successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// Login Account
router.post('/login', async (req, res) => {
    try {
        const { identity, accountID, secret } = req.body;

        if (!identity || !accountID || !secret) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const account = await Account.findOne({ identity, accountID });
        if (!account) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        const passwordMatch = await bcrypt.compare(secret, account.secret);
        if (!passwordMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        const token = jwt.sign(
            { userId: account._id, role: account.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

export default router;
