# Health Check
`serverless invoke local --function api --path mocks/health-check-event.json`

# Auth - Login
`serverless invoke local --function api --path mocks/auth-login-event.json`

# Auth - Get Me (protected)
`serverless invoke local --function api --path mocks/auth-get-me-event.json`

# Contacts - Get All (protected)
`serverless invoke local --function api --path mocks/get-contacts-event.json`

# Contacts - Get Mine (protected)
`serverless invoke local --function api --path mocks/get-user-contacts-event.json`

# Contacts - Create (protected)
`serverless invoke local --function api --path mocks/create-contact-event.json`

# Contacts - Update (protected) — replace CONTACT_ID_HERE first
`serverless invoke local --function api --path mocks/update-contact-event.json`

# Contacts - Delete (protected) — replace CONTACT_ID_HERE first
`serverless invoke local --function api --path mocks/delete-contact-event.json`