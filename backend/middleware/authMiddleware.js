const { CognitoJwtVerifier } = require('aws-jwt-verify');
const { GetCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../config/dynamo');

const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE;

// Lazily create the verifier so env vars are available at runtime
let verifier = null;
function getVerifier() {
    if (!verifier) {
        verifier = CognitoJwtVerifier.create({
            userPoolId: process.env.COGNITO_USER_POOL_ID,
            tokenUse: 'id',
            clientId: process.env.COGNITO_CLIENT_ID,
        });
    }
    return verifier;
}

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // Verify the Cognito JWT
            const payload = await getVerifier().verify(token);

            // payload contains: sub, email, name, etc.
            req.user = {
                id: payload.sub,
                name: payload.name || '',
                email: payload.email,
            };

            next();
        } catch (error) {
            console.error('Auth error:', error);
            res.status(401).json({ message: 'Not authorized, token invalid' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const adminProtect = async (req, res, next) => {
    // Must run after protect middleware - req.user should already be set
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized' });
    }

    try {
        // Check cognito:groups claim from the JWT payload
        // Re-verify the token to get the full payload with groups
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token' });
        }

        const payload = await getVerifier().verify(token);
        const groups = payload['cognito:groups'] || [];

        if (!groups.includes('admin')) {
            return res.status(403).json({ message: 'Admin access required' });
        }

        req.user.isAdmin = true;
        next();
    } catch (error) {
        console.error('Admin auth error:', error);
        res.status(403).json({ message: 'Admin access required' });
    }
};

module.exports = { protect, adminProtect };
