const Expense = require('../models/Expense');

// @desc    Get expenses
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res) => {
    try {
        const expenses = await Expense.find({ userId: req.user.id });
        res.status(200).json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get expense by ID
// @route   GET /api/expenses/:id
// @access  Private
const getExpenseById = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        // Check for user
        if (!req.user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Make sure the logged in user matches the expense user
        if (expense.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        res.status(200).json(expense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Set expense
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res) => {
    try {
        if (!req.body.title || !req.body.amount || !req.body.category || !req.body.paymentMode) {
            return res.status(400).json({ message: 'Please add all required fields' });
        }

        const expense = await Expense.create({
            title: req.body.title,
            amount: req.body.amount,
            category: req.body.category,
            paymentMode: req.body.paymentMode,
            date: req.body.date,
            note: req.body.note,
            userId: req.user.id
        });

        res.status(201).json(expense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        // Check for user
        if (!req.user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Make sure the logged in user matches the expense user
        if (expense.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        const updatedExpense = await Expense.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.status(200).json(updatedExpense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        // Check for user
        if (!req.user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Make sure the logged in user matches the expense user
        if (expense.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        await expense.deleteOne();

        res.status(200).json({ id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getExpenses,
    getExpenseById,
    createExpense,
    updateExpense,
    deleteExpense
};
