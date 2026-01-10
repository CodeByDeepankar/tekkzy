require('dotenv').config();
const express = require('express');
const cors = require('cors'); 
const path = require('path');
const connectDB = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware to ensure DB connection for Lambda (Must be before routes)
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error("Database connection error:", err);
        res.status(500).json({ error: "Database connection failed", details: err.message });
    }
});

// Core API response at root
app.get('/', (req, res) => {
    res.json({ 
        message: 'Daily Spend Management API',
        status: 'running',
        endpoints: {
            auth: '/api/auth',
            expenses: '/api/expenses'
        }
    });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));

// Error Handler
app.use((err, req, res, next) => {
    const statusCode = res.statusCode ? res.statusCode : 500;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});

// Only start the server if file is run directly (Local Development)
if (require.main === module) {
    // Connect to DB before listening
    connectDB().then(() => {
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    });
}


module.exports = app;

