require('dotenv').config();
const express = require('express');
const cors = require('cors'); 

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Core API response at root
app.get('/', (req, res) => {
    res.json({ 
        message: 'Daily Spend Management API',
        status: 'running',
        endpoints: {
            auth: '/api/auth',
            contacts: '/api/contacts'
        }
    });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/contacts', require('./routes/contactRoutes'));
app.use('/api/uploads', require('./routes/uploadRoutes'));

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
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port http://localhost:${PORT}`);
    });
}


module.exports = app;

