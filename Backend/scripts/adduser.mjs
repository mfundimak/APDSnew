import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import Account from '../models/account.mjs'; // Adjust path if necessary

dotenv.config();

const addAccount = async (name, identity, accountID, password, role = 'client') => {
    try {
        // Check if the account already exists
        const existingAccount = await Account.findOne({ accountID });
        if (existingAccount) {
            console.log(`Account with ID ${accountID} already exists.`);
            return;
        }

        // Encrypt password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new account
        const account = new Account({
            name,
            identity,
            accountID,
            secret: hashedPassword,
            role,
        });

        // Save the account to the database
        await account.save();
        console.log(`Account for ${name} added successfully.`);
    } catch (error) {
        console.error('Error adding account:', error);
    }
};

const addAccounts = async () => {
    try {
        // Connect to MongoDB once
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        // Add multiple accounts
        
        await addAccount('Mfundi Makhanya', '4444678901234', '9987654333', 'MySecPass456', 'staff');

        console.log('All accounts have been processed.');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    } finally {
        // Close the connection after all accounts are processed
        mongoose.connection.close();
    }
};

addAccounts();
