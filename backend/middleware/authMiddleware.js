const jwt = require('jsonwebtoken');
const { GetCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../config/dynamo');

const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE;

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const userResult = await docClient.send(
                new GetCommand({
                    TableName: USERS_TABLE,
                    Key: { userId: decoded.id }
                })
            );

            const user = userResult.Item;

            if (!user) {
                return res.status(401).json({ message: 'User not found' });
            }

            req.user = {
                id: user.userId,
                name: user.name,
                email: user.email
            };

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };
