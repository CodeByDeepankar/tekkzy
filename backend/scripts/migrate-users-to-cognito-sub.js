#!/usr/bin/env node

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, GetCommand, TransactWriteCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { CognitoIdentityProviderClient, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');

const parseArgs = (argv) => {
    const args = {
        apply: false,
        deleteUnmatched: false,
        tableName: process.env.DYNAMODB_USERS_TABLE,
        userPoolId: process.env.COGNITO_USER_POOL_ID,
        region:
            process.env.AWS_REGION ||
            process.env.AWS_DEFAULT_REGION ||
            process.env.COGNITO_REGION ||
            'us-east-1',
    };

    for (let i = 0; i < argv.length; i += 1) {
        const token = argv[i];

        if (token === '--apply') {
            args.apply = true;
            continue;
        }

        if (token === '--delete-unmatched') {
            args.deleteUnmatched = true;
            continue;
        }

        if (token === '--table' && argv[i + 1]) {
            args.tableName = argv[i + 1];
            i += 1;
            continue;
        }

        if (token === '--user-pool-id' && argv[i + 1]) {
            args.userPoolId = argv[i + 1];
            i += 1;
            continue;
        }

        if (token === '--region' && argv[i + 1]) {
            args.region = argv[i + 1];
            i += 1;
            continue;
        }
    }

    return args;
};

const escapeCognitoFilterValue = (value) => String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const toAttributeMap = (attributes = []) => {
    const map = {};
    for (const attr of attributes) {
        map[attr.Name] = attr.Value;
    }
    return map;
};

const isLikelySub = (value) => typeof value === 'string' && value.length > 0;

const run = async () => {
    const args = parseArgs(process.argv.slice(2));

    if (!args.tableName || !args.userPoolId) {
        throw new Error('Missing required config. Set DYNAMODB_USERS_TABLE and COGNITO_USER_POOL_ID or pass --table and --user-pool-id.');
    }

    const ddbClient = new DynamoDBClient({ region: args.region });
    const ddb = DynamoDBDocumentClient.from(ddbClient, {
        marshallOptions: { removeUndefinedValues: true },
    });

    const cognito = new CognitoIdentityProviderClient({ region: args.region });

    const emailToSubCache = new Map();

    const resolveSubFromEmail = async (email) => {
        const normalizedEmail = String(email || '').toLowerCase().trim();
        if (!normalizedEmail) {
            return null;
        }

        if (emailToSubCache.has(normalizedEmail)) {
            return emailToSubCache.get(normalizedEmail);
        }

        const filterValue = escapeCognitoFilterValue(normalizedEmail);
        const result = await cognito.send(
            new ListUsersCommand({
                UserPoolId: args.userPoolId,
                Filter: `email = "${filterValue}"`,
                Limit: 1,
            })
        );

        const user = result.Users && result.Users[0] ? result.Users[0] : null;
        if (!user) {
            emailToSubCache.set(normalizedEmail, null);
            return null;
        }

        const attrMap = toAttributeMap(user.Attributes);
        const sub = attrMap.sub || null;
        emailToSubCache.set(normalizedEmail, sub);
        return sub;
    };

    const stats = {
        scanned: 0,
        alreadyConsistent: 0,
        migrated: 0,
        deletedUnmatched: 0,
        skippedUnmatched: 0,
        fixedPasswordHashOnly: 0,
        errors: 0,
    };

    let lastEvaluatedKey;

    do {
        const page = await ddb.send(
            new ScanCommand({
                TableName: args.tableName,
                ExclusiveStartKey: lastEvaluatedKey,
            })
        );

        for (const item of page.Items || []) {
            stats.scanned += 1;

            try {
                const currentUserId = item.userId;
                const email = String(item.email || '').toLowerCase().trim();

                if (!isLikelySub(currentUserId)) {
                    console.warn(`[skip] Invalid userId for item with email=${email || 'n/a'}`);
                    continue;
                }

                const cognitoSub = await resolveSubFromEmail(email);

                if (!cognitoSub) {
                    if (args.deleteUnmatched) {
                        if (args.apply) {
                            await ddb.send(
                                new DeleteCommand({
                                    TableName: args.tableName,
                                    Key: { userId: currentUserId },
                                })
                            );
                        }
                        stats.deletedUnmatched += 1;
                        console.log(`[delete-unmatched] userId=${currentUserId} email=${email || 'n/a'}`);
                    } else {
                        stats.skippedUnmatched += 1;
                        console.log(`[unmatched] No Cognito user found for userId=${currentUserId} email=${email || 'n/a'}`);
                    }
                    continue;
                }

                const itemHasPasswordHash = Object.prototype.hasOwnProperty.call(item, 'passwordHash');

                if (currentUserId === cognitoSub) {
                    if (itemHasPasswordHash) {
                        if (args.apply) {
                            await ddb.send(
                                new UpdateCommand({
                                    TableName: args.tableName,
                                    Key: { userId: currentUserId },
                                    UpdateExpression: 'REMOVE #passwordHash SET #updatedAt = :updatedAt',
                                    ExpressionAttributeNames: {
                                        '#passwordHash': 'passwordHash',
                                        '#updatedAt': 'updatedAt',
                                    },
                                    ExpressionAttributeValues: {
                                        ':updatedAt': new Date().toISOString(),
                                    },
                                })
                            );
                        }
                        stats.fixedPasswordHashOnly += 1;
                        console.log(`[cleanup] Removed passwordHash for userId=${currentUserId}`);
                    } else {
                        stats.alreadyConsistent += 1;
                    }
                    continue;
                }

                const targetExisting = await ddb.send(
                    new GetCommand({
                        TableName: args.tableName,
                        Key: { userId: cognitoSub },
                    })
                );

                if (targetExisting.Item) {
                    if (args.apply) {
                        await ddb.send(
                            new DeleteCommand({
                                TableName: args.tableName,
                                Key: { userId: currentUserId },
                            })
                        );
                    }
                    stats.migrated += 1;
                    console.log(
                        `[merge-delete] source=${currentUserId} -> target=${cognitoSub} (target already exists)`
                    );
                    continue;
                }

                const now = new Date().toISOString();
                const migratedItem = {
                    ...item,
                    userId: cognitoSub,
                    email: email || item.email,
                    migratedFromUserId: currentUserId,
                    migratedAt: now,
                    updatedAt: now,
                };
                delete migratedItem.passwordHash;

                if (args.apply) {
                    await ddb.send(
                        new TransactWriteCommand({
                            TransactItems: [
                                {
                                    Put: {
                                        TableName: args.tableName,
                                        Item: migratedItem,
                                    },
                                },
                                {
                                    Delete: {
                                        TableName: args.tableName,
                                        Key: { userId: currentUserId },
                                    },
                                },
                            ],
                        })
                    );
                }

                stats.migrated += 1;
                console.log(`[migrate] source=${currentUserId} -> target=${cognitoSub} email=${email}`);
            } catch (error) {
                stats.errors += 1;
                console.error(`[error] ${error.message}`);
            }
        }

        lastEvaluatedKey = page.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    console.log('');
    console.log('Migration summary:');
    console.log(`  mode: ${args.apply ? 'APPLY' : 'DRY RUN'}`);
    console.log(`  scanned: ${stats.scanned}`);
    console.log(`  alreadyConsistent: ${stats.alreadyConsistent}`);
    console.log(`  migrated: ${stats.migrated}`);
    console.log(`  fixedPasswordHashOnly: ${stats.fixedPasswordHashOnly}`);
    console.log(`  deletedUnmatched: ${stats.deletedUnmatched}`);
    console.log(`  skippedUnmatched: ${stats.skippedUnmatched}`);
    console.log(`  errors: ${stats.errors}`);

    if (!args.apply) {
        console.log('');
        console.log('Dry-run completed. Re-run with --apply to execute changes.');
    }
};

run().catch((error) => {
    console.error(`Migration failed: ${error.message}`);
    process.exit(1);
});
