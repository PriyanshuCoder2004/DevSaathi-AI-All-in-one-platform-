# 🚀 DevSaathi AI 

<div align="center">
  <h3>An Enterprise-Grade, Multilingual AI Developer Companion & Learning Platform</h3>
  <p>Empowering developers with AI-driven technical explanations, automated quizzes, deep document summarization, and real-time code debugging.</p>

  ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
  ![AWS Lambda](https://img.shields.io/badge/AWS_Lambda-FF9900?style=for-the-badge&logo=aws-lambda&logoColor=white)
  ![Amazon DynamoDB](https://img.shields.io/badge/Amazon_DynamoDB-4053D6?style=for-the-badge&logo=amazon-dynamodb&logoColor=white)
  ![Amazon S3](https://img.shields.io/badge/Amazon_S3-569A31?style=for-the-badge&logo=amazon-s3&logoColor=white)
</div>

---

## 🌟 Executive Summary

**DevSaathi AI** is a state-of-the-art, serverless web application designed specifically to accelerate the learning and development workflow for software engineers. Combining a sleek, glassmorphism-inspired React frontend with an ultra-scalable AWS Serverless backend, DevSaathi acts as a 24/7 intelligent pair programmer and tutor.

Built with native **Bilingual Support (English & Hindi)**, DevSaathi bridges the language barrier by providing complex technical concepts alongside relatable real-life analogies.

---

## 🔥 Key Features

### 🧠 1. Intelligent AI Tutor & Quiz Master
* **Dynamic Explanations:** Search any technical topic (e.g., *React Hooks, Docker, Microservices*) and receive highly structured explanations broken down into plain-English definitions, architectural workings, and practical use cases.
* **Real-Life Analogies:** Connects abstract coding concepts with relatable daily-life analogies.
* **Automated Quizzes & Notes:** Instantly generates multi-tier quizzes (Easy, Medium, Hard) and structured markdown study notes to reinforce learning.

### 📄 2. Smart PDF & Document Summarizer
* **Secure S3 Uploads:** Upload heavy technical documentation, research papers, or code files directly into secure, user-isolated Amazon S3 buckets.
* **Deep Technical Analysis:** Leverages AI to dissect documents into architectural insights, key takeaways, and critical warnings.

### 💻 3. Code Debugger & Refactorer
* **Line-by-Line Debugging:** Paste broken or legacy code to receive instant bug identification and root-cause analysis.
* **AI Code Improvement:** Generates clean, optimized, and fully commented replacement code adhering to industry best practices.

### 📊 4. Dynamic Dashboard & Learning Analytics
* **Full Data Persistence:** All user interactions, mastery ratios, and historical quiz scores are securely stored in **Amazon DynamoDB**.
* **Robust Pagination:** Seamlessly browse through hundreds of past activity logs without performance degradation.
* **Gamified Metrics:** Track real-time progress, monthly improvement percentages, and mastered topics.

### 🌐 5. Global Multilingual Experience
* **English & Hindi Support:** Instantly toggle the entire platform interface, navigation, and AI generation language via a global React Context.

---

## 🏛️ Enterprise Cloud Architecture (AWS)

DevSaathi AI is engineered using 100% **Infrastructure as Code (IaC)** via the **AWS Cloud Development Kit (CDK)**, ensuring the entire architecture is fully automated, scalable, and reproducible.

```
       +-------------------------------------------------------------+
       |                     React Frontend (Vite)                   |
       +------------------------------+------------------------------+
                                      | (HTTPS / REST API)
                                      v
       +------------------------------+------------------------------+
       |                     AWS API Gateway (REST)                  |
       |               [Cognito JWT User Pools Authorizer]           |
       +-------+--------------+---------------+--------------+-------+
               |              |               |              |
               v              v               v              v
         +-----------+  +-----------+   +-----------+  +-----------+
         | TutorFn   |  | DocsFn    |   | CodeFn    |  | Dashboard |
         | (Lambda)  |  | (Lambda)  |   | (Lambda)  |  | (Lambda)  |
         +-----+-----+  +-----+-----+   +-----+-----+  +-----+-----+
               |              |               |              |
               +--------------+-------+-------+--------------+
                                      |
            +-------------------------+-------------------------+
            |                         |                         |
            v                         v                         v
     +--------------+          +--------------+          +--------------+
     | Amazon S3    |          | Amazon       |          | Amazon       |
     | (Prompts &   |          | DynamoDB     |          | Bedrock      |
     | Uploads)     |          | (Main Table) |          | (Nova Lite)  |
     +--------------+          +--------------+          +--------------+
```

### ⚡ Architectural Highlights
* **Serverless Microservices:** Backend business logic is decoupled into 5 specialized AWS Lambda functions (`TutorFn`, `DocsFn`, `DashboardFn`, `CodeFn`, `UserFn`) to ensure fault isolation and lightning-fast execution.
* **Amazon Bedrock (Nova Lite):** Cutting-edge generative AI integration delivering highly accurate technical responses with an average latency of just **~1.8 seconds**.
* **Dynamic S3 Prompt Management:** AI prompts are decoupled from the codebase and stored in an S3 bucket (`devsaathi-prompts`), allowing real-time AI behavior adjustments without requiring code redeployments.
* **Enterprise Security (Least Privilege):** Secured via Amazon Cognito User Pools and strict IAM inline policies that restrict Lambda access to specific DynamoDB tables and S3 paths.
* **Professional Observability:** Fully integrated with AWS CloudWatch for granular execution tracking, cold-start monitoring (`INIT_START`), and automated error alarms.

---

## 📁 Repository Structure

```bash
devsaathi-ai/
├── frontend/                  # React, Vite, Tailwind CSS, TypeScript
│   ├── src/
│   │   ├── components/        # Reusable UI components (Sidebar, Layout, Cards)
│   │   ├── contexts/          # Global State (LanguageContext)
│   │   ├── pages/             # App views (Dashboard, Learn, Code, Docs, Settings)
│   │   └── services/          # API integration helpers (stats, notes, tutor)
│   └── package.json
│
├── infrastructure/            # AWS CDK & Backend Services
│   ├── bin/                   # CDK App entry point
│   ├── lib/                   # CloudFormation Stack definitions (devsaathi-stack.ts)
│   ├── prompts/               # Local backup of S3 AI prompt templates
│   └── backend/src/
│       ├── handlers/          # Lambda microservice entry points
│       └── lib/               # Core AWS helpers (bedrock.ts, dynamo.ts)
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v20+)
* AWS CLI (configured with appropriate credentials)
* AWS CDK CLI (`npm install -g aws-cdk`)

### 1. Running the Frontend Locally
```bash
cd frontend
npm install
npm run dev
```
The application will be live at `http://localhost:5173`.

### 2. Deploying the AWS Backend
```bash
cd infrastructure
npm install
npm run build
npx cdk deploy
```
This command automatically synthesizes the CloudFormation template, builds the Node.js Lambda bundles, and deploys the entire cloud infrastructure to your AWS account.

---

## 🛡️ Security & Compliance
* **Authentication:** Handled via Amazon Cognito with Secure Remote Password (SRP) protocol.
* **CORS & API Protection:** Configured with strict origins and preflight headers at the API Gateway layer.
* **Environment Isolation:** Sensitive IDs and API URLs are securely managed via environment variables (`.env`).

---

<div align="center">
  <p>Built with ❤️ for the Developer Community.</p>
</div>
