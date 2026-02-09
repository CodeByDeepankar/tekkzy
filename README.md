# 🚀 Tekkzy - Intelligent Cloud Applications

<div align="center">

![Tekkzy](https://img.shields.io/badge/Tekkzy-Intelligent_Cloud_Apps-e94560?style=for-the-badge&logo=cloud&logoColor=white)
![Next.js 16](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js&logoColor=white)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![DynamoDB](https://img.shields.io/badge/Amazon_DynamoDB-4053D6?style=for-the-badge&logo=amazon-dynamodb&logoColor=white)
![AWS Lambda](https://img.shields.io/badge/AWS_Lambda-FF9900?style=for-the-badge&logo=aws-lambda&logoColor=white)

**Empowering Business Through Digital Innovation**

*[Visit Website](https://tekkzy.netlify.app/)* · *[Report Bug](https://github.com/CodeByDeepankar/tekkzy/issues)* · *[Request Feature](https://github.com/CodeByDeepankar/tekkzy/issues)*

</div>

---

## 📋 Table of Contents

- [✨ About Tekkzy](#-about-tekkzy)
- [🌟 Key Features](#-key-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
- [🌐 Our Services](#-our-services)
- [📝 License](#-license)
- [🤝 Contributing](#-contributing)
- [📧 Contact](#-contact)

---

## ✨ About Tekkzy

Tekkzy is a forward-thinking technology company focused on simplifying complex business challenges through smart digital solutions. We empower businesses to **digitize, automate, and scale** with confidence.

Our platform showcases capabilities in:
- ☁️ Cloud Software Development
- 🤖 Business Automation
- 📣 Digital Marketing
- 📊 Data Analytics & Dashboards

---

## 🌟 Key Features

| Feature | Description |
|---------|-------------|
| **🎨 Modern UI/UX** | Built with Next.js 16 and Tailwind CSS v4 for lightning-fast, responsive experiences |
| **🌀 Interactive Carousel** | 3D-style testimonials carousel showcasing real-time client success stories |
| **📦 Service Offerings** | Comprehensive breakdown of Cloud Software, Automation, and Digital Marketing services |
| **📨 Secure Contact System** | Real-time inquiry forms integrated with serverless backend API |
| **🔐 JWT Authentication** | Admin panel login for managing internal resources securely |
| **📱 Fully Responsive** | Looks great on desktop, tablet, and mobile devices |
| **⚡ Performance Optimized** | Static generation and edge caching for blazing fast load times |
| **💾 Serverless DynamoDB** | Fully managed NoSQL database with seamless AWS integration |

---

## 🛠️ Tech Stack

### 🎯 Frontend

| Technology | Purpose |
|------------|---------|
| [Next.js 16](https://nextjs.org/) | React Framework with App Router |
| TypeScript | Type-safe JavaScript |
| Tailwind CSS v4 | Utility-first styling |
| Shadcn UI | Beautiful component library |
| Lucide React | Icon system |
| Framer Motion | Smooth animations |
| React Bits | Carousel components |

### ⚙️ Backend

| Technology | Purpose |
|------------|---------|
| [Node.js](https://nodejs.org/) | JavaScript runtime |
| [Express.js](https://expressjs.com/) | Web framework (Serverless) |
| [AWS Lambda](https://aws.amazon.com/lambda/) | Serverless compute |
| [Amazon DynamoDB](https://aws.amazon.com/dynamodb/) | Fully managed NoSQL database |
| [AWS SDK](https://aws.amazon.com/sdk-for-javascript/) | AWS services integration |
| [JWT](https://jwt.io/) | Authentication tokens |
| [Bcrypt](https://bcryptjs.com/) | Password hashing |

### 🏗️ DevOps & Tools

| Technology | Purpose |
|------------|---------|
| GitHub | Version control |
| Vercel | Frontend deployment |
| AWS | Cloud infrastructure |
| npm | Package management |
| Serverless Framework | Lambda deployment |

---

## 📁 Project Structure

```
tekkzy/
├── frontend/                 # Next.js frontend application
│   ├── app/                # App Router pages
│   ├── components/         # Reusable UI components
│   ├── public/             # Static assets
│   └── ...config files
│
├── backend/                 # Express.js backend API
│   ├── controllers/        # Route logic
│   ├── models/            # DynamoDB schemas
│   ├── routes/            # API endpoints
│   ├── middleware/        # Auth & error handling
│   ├── services/         # DynamoDB service layer
│   └── ...config files
│
├── .env.example           # Environment variables template
├── .gitignore
├── README.md
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Node.js** v18 or higher
- **AWS Account** with DynamoDB access
- **AWS Credentials** (IAM user with DynamoDB permissions)
- **Git** installed

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/CodeByDeepankar/tekkzy.git
cd tekkzy
```

### 2️⃣ Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 3️⃣ Backend Setup

```bash
# Open a new terminal
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your AWS credentials:
# - AWS_REGION=your_aws_region
# - AWS_ACCESS_KEY_ID=your_aws_access_key
# - AWS_SECRET_ACCESS_KEY=your_aws_secret_key
# - DYNAMODB_TABLE_NAME=your_table_name
# - JWT_SECRET=your_secure_secret_key

# Start the server (local development)
npm start
```

Backend runs on `http://localhost:5000`

**Note:** For local development, you can use [DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html) or create a table in AWS DynamoDB.

---

## 🌐 Our Services

### ☁️ Custom Cloud Software

Tailored software solutions designed to streamline business operations, improve reporting accuracy, and ensure secure data management. Our cloud applications scale with your business needs.

**Key Benefits:**
- Scalable architecture
- Secure data handling
- Real-time sync across devices
- Reduced infrastructure costs

### 🤖 Business Automation

Intelligent automation solutions that eliminate repetitive tasks and optimize workflows. Centralized dashboards provide real-time insights for data-driven decision making.

**Key Benefits:**
- Time savings on repetitive tasks
- Error reduction
- Improved productivity
- Real-time analytics

### 📣 Digital Growth

Strategic digital marketing services to expand your online presence, reach new customers, and boost brand visibility across multiple channels.

**Key Benefits:**
- Increased brand awareness
- Better customer engagement
- Higher conversion rates
- Measurable ROI

---

## 💡 Why DynamoDB?

| Feature | Benefit |
|---------|---------|
| **Fully Managed** | No server maintenance required |
| **Scalable** | Handles millions of requests per second |
| **Low Latency** | Single-digit millisecond response times |
| **Secure** | Built-in encryption and access controls |
| **Cost-Effective** | Pay only for what you use |

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork** the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a **Pull Request**

Please read our [Contributing Guide](CONTRIBUTING.md) for details.

---

## 📧 Contact

**Tekkzy Intelligent Cloud Applications Pvt. Ltd.**

- 🌐 Website: [tekkzy.netlify.app](https://tekkzy.netlify.app/)
- 📧 Email: contact@tekkzy.netlify.app
- 💼 LinkedIn: [Tekkzy](https://linkedin.com/company/tekkzy)
- 🐦 Twitter: [@tekkzy](https://twitter.com/tekkzy)

---

## 📝 License

© 2025 Tekkzy Intelligent Cloud Applications Pvt. Ltd. All rights reserved.

See [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ by the Tekkzy Team**

*Empowering businesses through digital innovation*

</div>
