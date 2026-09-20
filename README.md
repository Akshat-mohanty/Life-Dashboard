# Meridian

Meridian is a personal life management dashboard that unifies your tasks, calendar events, bills, health habits, and documents into a single page. It features an AI-powered morning briefing that synthesizes your data into a plain-English, prioritized summary.

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: AWS Serverless Application Model (SAM), Node.js 20.x, Amazon API Gateway, AWS Lambda
- **Database**: Amazon DynamoDB (Single-Table Design)
- **Authentication**: Amazon Cognito (with Google OAuth)
- **AI & Automation**: Amazon Bedrock (Claude 3.5 Sonnet), EventBridge, SES, SNS

## Core Features

- **AI Morning Briefing**: Generates a daily executive summary using Amazon Bedrock based on your current tasks and bills.
- **Bills & Payments**: Tracks recurring bills, due dates, and overdue balances.
- **Tasks & Urgency Engine**: Manages deadlines with manual drag-and-drop prioritization and AI-ranked urgency.
- **Calendar**: Highlights today's schedule and upcoming appointments on a 7-day horizon.
- **Health Reminders**: Tracks wellness habits and dispatches optional SMS alerts via SNS.
- **Documents Vault**: Securely uploads and stores documents via presigned URLs to Amazon S3.
- **Spending & Analytics**: Visualizes monthly spending categorized by tags using Recharts.

## Local Development

### 1. Prerequisites
- Node.js 20+

### 2. Start Local Environment
```bash
# Terminal 1: Start local backend API Gateway simulator (Port 3001)
cd backend
npm run local-server

# Terminal 2: Start Vite frontend (Port 5173)
cd frontend
npm run dev
```
Visit `http://localhost:5173` and log in to interact with the dashboard.

## Cloud Deployment

Deploy the serverless backend infrastructure using AWS SAM:
```bash
cd backend
sam build
sam deploy
```

Deploy the frontend via AWS Amplify connected to your GitHub repository.
