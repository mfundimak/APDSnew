import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import userRoutes from './routes/accountroutes.mjs'; // Import user routes
import paymentRoutes from './routes/transactionroutes.mjs';
import helmet from 'helmet';
import https from 'https'; 
import fs from 'fs'; 
import rateLimit from 'express-rate-limit';
import ExpressBrute from 'express-brute';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

// Initialize express-brute
const bruteforce = new ExpressBrute(new ExpressBrute.MemoryStore(), {
    freeRetries: 5, 
    minWait: 5000, 
    maxWait: 60000, 
    lifetime: 3600 
});

// Rate limiting middleware
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, 
    message: 'Too many requests from this IP, please try again later.',
});

// Routes
app.use('/api/users', userRoutes);  // Use /api/users as the route prefix for user routes
app.use('/api/payments', paymentRoutes);

// Login route with rate limiting and express-brute
app.post('/api/login', loginLimiter, bruteforce.prevent, (req, res) => {
    res.status(200).json({ message: 'User logged in successfully' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('Connected to MongoDB');

    // SSL options using mkcert generated certificates for localhost
    const sslOptions = {
        key: fs.readFileSync('./ssl/localhost-key.pem'), // private key
        cert: fs.readFileSync('./ssl/localhost-cert.pem'), // public cert
    };

    // Create HTTPS server
    https.createServer(sslOptions, app).listen(PORT, () => {
        console.log(`Server running on https://localhost:${PORT}`);
    });
})
.catch((error) => {
    console.error('MongoDB connection error:', error);
});
