import mongoose from 'mongoose';
const transactionSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
        required: true,
        enum: ['USD', 'EUR', 'AUD', 'CAD', 'GBP', 'ZAR'],
    },
    provider: {
        type: String,
        required: true,
        enum: ['SWIFT'],
    },
    payeeAccount: {
        type: String,
        required: true,
        match: /^[0-9]{10,}$/,
    },
    swiftCode: {
        type: String,
        required: true,
        match: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,
    },
    status: {
        type: String,
        enum: ['in_progress', 'approved'],
        default: 'in_progress',
    },
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
