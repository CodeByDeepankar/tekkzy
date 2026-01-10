const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Please add a title']
    },
    amount: {
        type: Number,
        required: [true, 'Please add a positive amount']
    },
    category: {
        type: String,
        required: [true, 'Please add a category'],
        enum: ['food', 'transport', 'utilities', 'entertainment', 'other']
    },
    paymentMode: {
        type: String,
        required: [true, 'Please add a payment mode'],
        enum: ['cash', 'UPI', 'card']
    },
    date: {
        type: Date,
        default: Date.now
    },
    note: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Expense', expenseSchema);
