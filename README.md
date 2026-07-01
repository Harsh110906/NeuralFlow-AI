# NeuralFlow 🧠⚡️

**NeuralFlow** is an enterprise-grade AI operating system built to orchestrate, execute, and govern AI workflows, autonomous agents, and deterministic business logic.

## 🚀 Features

- **Workflow & Agent Orchestration**: Uses Temporal for durable execution of complex directed acyclic graphs (DAGs) and LLM-powered autonomous agents.
- **Enterprise Governance**: Built-in B2B multi-tenant organization support, strict Role-Based Access Control (RBAC), and comprehensive audit logging.
- **LLM Routing & Reliability**: Dynamically routes tasks to models (`gpt-4o`, `gpt-4o-mini`) based on complexity, backed by robust circuit breakers for high availability.
- **Security & Secret Management**: KMS-ready secret management for safely injecting API keys and credentials into agent tools.
- **Developer Experience**: Developer-friendly API keys and an outbound webhook system with at-least-once delivery, HMAC signing, and exponential backoff.
- **AI Observability**: LLM-as-a-judge evaluation engine, agent testing playground, and telemetry hooks for full trace visibility.

## 🛠 Tech Stack

- **Frontend**: Next.js 14 App Router, React, TailwindCSS, Framer Motion
- **Backend**: NestJS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk (B2B Multi-tenant)
- **Workflow Engine**: Temporal
- **Monorepo Architecture**: Turborepo

## 🏁 Getting Started

### Prerequisites

Ensure you have the following installed:
- Node.js (v18+)
- PostgreSQL
- Temporal CLI (`temporal server start-dev`)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd neuralflow-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Configure your `.env.local` in `apps/web` and `.env` in `services/api` with necessary credentials for Clerk, PostgreSQL, and OpenAI.
   
4. **Database Migrations**
   ```bash
   npx turbo run db:push
   ```

5. **Start Local Development**
   ```bash
   npx turbo run dev
   ```

## 📜 License
MIT License
