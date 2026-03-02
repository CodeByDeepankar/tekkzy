const {
    CognitoIdentityProviderClient,
    SignUpCommand,
    ConfirmSignUpCommand,
    InitiateAuthCommand,
    GetUserCommand,
    ResendConfirmationCodeCommand,
    ForgotPasswordCommand,
    ConfirmForgotPasswordCommand,
} = require('@aws-sdk/client-cognito-identity-provider');
const { PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../config/dynamo');

const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE;
const USERS_EMAIL_INDEX = process.env.DYNAMODB_USERS_EMAIL_INDEX || 'email-index';

const cognitoClient = new CognitoIdentityProviderClient({
    region: process.env.COGNITO_REGION || process.env.AWS_REGION || 'us-east-1',
});

const CLIENT_ID = process.env.COGNITO_CLIENT_ID;

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please add all fields' });
        }

        const normalizedEmail = email.toLowerCase();

        const command = new SignUpCommand({
            ClientId: CLIENT_ID,
            Username: normalizedEmail,
            Password: password,
            UserAttributes: [
                { Name: 'email', Value: normalizedEmail },
                { Name: 'name', Value: name },
            ],
        });

        const result = await cognitoClient.send(command);

        res.status(201).json({
            message: 'Registration successful. Please check your email for a verification code.',
            userSub: result.UserSub,
            email: normalizedEmail,
            confirmed: result.UserConfirmed,
        });
    } catch (error) {
        console.error('Registration error:', error);
        if (error.name === 'UsernameExistsException') {
            return res.status(400).json({ message: 'User already exists' });
        }
        if (error.name === 'InvalidPasswordException') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
};

const confirmUser = async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ message: 'Email and confirmation code are required' });
        }

        const normalizedEmail = email.toLowerCase();

        const command = new ConfirmSignUpCommand({
            ClientId: CLIENT_ID,
            Username: normalizedEmail,
            ConfirmationCode: code,
        });

        await cognitoClient.send(command);

        res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
    } catch (error) {
        console.error('Confirmation error:', error);
        if (error.name === 'CodeMismatchException') {
            return res.status(400).json({ message: 'Invalid verification code' });
        }
        if (error.name === 'ExpiredCodeException') {
            return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
        }
        res.status(500).json({ message: error.message });
    }
};

const resendCode = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const normalizedEmail = email.toLowerCase();

        const command = new ResendConfirmationCodeCommand({
            ClientId: CLIENT_ID,
            Username: normalizedEmail,
        });

        await cognitoClient.send(command);

        res.status(200).json({ message: 'Verification code resent. Please check your email.' });
    } catch (error) {
        console.error('Resend code error:', error);
        res.status(500).json({ message: error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        const normalizedEmail = email.toLowerCase();

        const command = new InitiateAuthCommand({
            AuthFlow: 'USER_PASSWORD_AUTH',
            ClientId: CLIENT_ID,
            AuthParameters: {
                USERNAME: normalizedEmail,
                PASSWORD: password,
            },
        });

        const result = await cognitoClient.send(command);
        const { IdToken, AccessToken, RefreshToken } = result.AuthenticationResult;

        // Get user attributes from Cognito
        const getUserCommand = new GetUserCommand({
            AccessToken: AccessToken,
        });
        const cognitoUser = await cognitoClient.send(getUserCommand);
        const attributes = {};
        cognitoUser.UserAttributes.forEach((attr) => {
            attributes[attr.Name] = attr.Value;
        });

        // Sync user to DynamoDB for app-specific data
        const userSub = attributes.sub;
        try {
            await docClient.send(
                new PutCommand({
                    TableName: USERS_TABLE,
                    Item: {
                        userId: userSub,
                        name: attributes.name || '',
                        email: normalizedEmail,
                        lastLogin: new Date().toISOString(),
                    },
                    ConditionExpression: 'attribute_not_exists(userId)',
                })
            );
        } catch (putError) {
            // User already exists in DynamoDB, that's fine
            if (putError.name !== 'ConditionalCheckFailedException') {
                console.warn('DynamoDB sync warning:', putError.message);
            }
        }

        res.json({
            _id: userSub,
            name: attributes.name || '',
            email: normalizedEmail,
            token: IdToken,
            accessToken: AccessToken,
            refreshToken: RefreshToken,
        });
    } catch (error) {
        console.error('Login error:', error);
        if (error.name === 'NotAuthorizedException') {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        if (error.name === 'UserNotConfirmedException') {
            return res.status(403).json({
                message: 'Account not verified. Please check your email for the verification code.',
                needsConfirmation: true,
            });
        }
        res.status(500).json({ message: error.message });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const normalizedEmail = email.toLowerCase();

        const command = new ForgotPasswordCommand({
            ClientId: CLIENT_ID,
            Username: normalizedEmail,
        });

        await cognitoClient.send(command);

        res.status(200).json({
            message: 'Password reset code sent. Please check your email.',
            email: normalizedEmail,
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        if (error.name === 'UserNotFoundException') {
            // Don't reveal whether user exists
            return res.status(200).json({ message: 'If an account exists, a reset code has been sent.' });
        }
        if (error.name === 'LimitExceededException') {
            return res.status(429).json({ message: 'Too many attempts. Please try again later.' });
        }
        res.status(500).json({ message: error.message });
    }
};

const confirmForgotPassword = async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;

        if (!email || !code || !newPassword) {
            return res.status(400).json({ message: 'Email, code, and new password are required' });
        }

        const normalizedEmail = email.toLowerCase();

        const command = new ConfirmForgotPasswordCommand({
            ClientId: CLIENT_ID,
            Username: normalizedEmail,
            ConfirmationCode: code,
            Password: newPassword,
        });

        await cognitoClient.send(command);

        res.status(200).json({ message: 'Password reset successful. You can now sign in with your new password.' });
    } catch (error) {
        console.error('Confirm forgot password error:', error);
        if (error.name === 'CodeMismatchException') {
            return res.status(400).json({ message: 'Invalid reset code' });
        }
        if (error.name === 'ExpiredCodeException') {
            return res.status(400).json({ message: 'Reset code has expired. Please request a new one.' });
        }
        if (error.name === 'InvalidPasswordException') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
};

const getMe = async (req, res) => {
    res.status(200).json(req.user);
};

module.exports = {
    registerUser,
    confirmUser,
    resendCode,
    loginUser,
    forgotPassword,
    confirmForgotPassword,
    getMe,
};
