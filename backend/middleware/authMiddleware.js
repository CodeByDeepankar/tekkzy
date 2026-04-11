const { CognitoJwtVerifier } = require('aws-jwt-verify');

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

const getBearerToken = (authorizationHeader = '') => {
    const [scheme, token] = authorizationHeader.split(' ');

    if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
        return null;
    }

    return token;
};

const normalizeGroups = (groupsClaim) => {
    if (Array.isArray(groupsClaim)) {
        return groupsClaim;
    }

    if (typeof groupsClaim !== 'string') {
        return [];
    }

    const trimmed = groupsClaim.trim();
    if (!trimmed) {
        return [];
    }

    if (trimmed.startsWith('[')) {
        try {
            const parsed = JSON.parse(trimmed);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    return trimmed.split(',').map((group) => group.trim()).filter(Boolean);
};

const getMockUserFromEventClaims = (req) => {
    const authorizer = req?.apiGateway?.event?.requestContext?.authorizer;
    const claims = authorizer?.claims || authorizer?.jwt?.claims;

    if (!claims || typeof claims !== 'object') {
        return null;
    }

    const sub = claims.sub || claims.userId;
    if (!sub) {
        return null;
    }

    const groups = normalizeGroups(claims['cognito:groups']);

    return {
        id: sub,
        userId: sub,
        sub,
        name: claims.name || '',
        email: claims.email || '',
        isAdmin: groups.includes('admin'),
    };
};

const protect = async (req, res, next) => {
    const token = getBearerToken(req.headers.authorization);

    if (!token) {
        const mockUser = getMockUserFromEventClaims(req);
        if (mockUser) {
            req.user = mockUser;
            return next();
        }

        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        // Verify the Cognito JWT and extract canonical user id from sub.
        const payload = await getVerifier().verify(token);

        if (!payload?.sub) {
            return res.status(401).json({ message: 'Not authorized, token missing sub' });
        }

        req.user = {
            id: payload.sub,
            userId: payload.sub,
            sub: payload.sub,
            name: payload.name || '',
            email: payload.email || '',
        };

        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ message: 'Not authorized, token invalid' });
    }
};

const adminProtect = async (req, res, next) => {
    // Must run after protect middleware - req.user should already be set
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized' });
    }

    if (req.user.isAdmin) {
        return next();
    }

    try {
        // Check cognito:groups claim from the JWT payload
        // Re-verify the token to get the full payload with groups
        const token = getBearerToken(req.headers.authorization);
        if (!token) {
            return res.status(403).json({ message: 'Admin access required' });
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
