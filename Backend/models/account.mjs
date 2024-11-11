import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    identity: {
        type: String,
        required: true,
        unique: true,
        match: /^[0-9]{13}$/,
    },
    accountID: {
        type: String,
        required: true,
        unique: true,
        match: /^[0-9]{10}$/,
    },
    secret: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['client', 'staff'],
        default: 'client',
    },
}, { timestamps: true });

const Account = mongoose.model('Account', accountSchema);

export default Account;
