const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { QueryCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../config/dynamo');

const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE;
const USERS_EMAIL_INDEX = process.env.DYNAMODB_USERS_EMAIL_INDEX || 'email-index';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please add all fields' });
        }

        const normalizedEmail = email.toLowerCase();

        const userExists = await docClient.send(
            new QueryCommand({
                TableName: USERS_TABLE,
                IndexName: USERS_EMAIL_INDEX,
                KeyConditionExpression: 'email = :email',
                ExpressionAttributeValues: {
                    ':email': normalizedEmail
                },
                Limit: 1
            })
        );

        if (userExists.Items && userExists.Items.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const userId = uuidv4();
        const createdAt = new Date().toISOString();

        await docClient.send(
            new PutCommand({
                TableName: USERS_TABLE,
                Item: {
                    userId,
                    name,
                    email: normalizedEmail,
                    passwordHash,
                    createdAt
                },
                ConditionExpression: 'attribute_not_exists(userId)'
            })
        );

        res.status(201).json({
            _id: userId,
            name,
            email: normalizedEmail,
            token: generateToken(userId)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const normalizedEmail = email.toLowerCase();
        const userResult = await docClient.send(
            new QueryCommand({
                TableName: USERS_TABLE,
                IndexName: USERS_EMAIL_INDEX,
                KeyConditionExpression: 'email = :email',
                ExpressionAttributeValues: {
                    ':email': normalizedEmail
                },
                Limit: 1
            })
        );

        const user = userResult.Items && userResult.Items[0];

        if (user && (await bcrypt.compare(password, user.passwordHash))) {
            res.json({
                _id: user.userId,
                name: user.name,
                email: user.email,
                token: generateToken(user.userId)
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getMe = async (req, res) => {
    res.status(200).json(req.user);
};

module.exports = {
    registerUser,
    loginUser,
    getMe
};
