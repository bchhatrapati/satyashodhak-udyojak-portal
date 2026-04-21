# Satyashodhak Udyojak Portal

A secure, full-stack financial and member management platform built for cooperative societies and entrepreneurial networks. This system handles role-based member dashboards, secure authentication, real-time transaction tracking, and automated financial reporting.

## 🚀 Key Features

* **Role-Based Access Control (RBAC):** Distinct dashboard experiences and permission levels for Administrators and standard Members.
* **Secure Authentication:** Encrypted login portal managing secure sessions and access tokens.
* **Financial Ledger & Transactions:** Real-time tracking of total society funds, individual share capital, and complete credit/debit histories.
* **Member Management:** Comprehensive directory, KYC tracking, and active/inactive status monitoring.
* **Automated Reporting:** E-passbook generation and official monthly report downloads for members.
* **Multilingual UI:** Built-in context-driven language toggle for broader accessibility.

## 🛠️ Tech Stack & Architecture

**Frontend (Client)**
* **Framework:** Next.js 15, React 19
* **Styling:** Tailwind CSS
* **State Management:** React Context API (`AuthContext`, `LanguageContext`)
* **Deployment:** Vercel

**Backend (API)**
* **Framework:** FastAPI (Python)
* **Database & Auth:** Supabase
* **Architecture:** Repository Pattern (separation of models, schemas, services, and routes)
* **Deployment:** AWS EC2 via Docker & Docker Compose
* **Automated Tasks:** Built-in system backup routines (`backup_system.py`)

## 📂 Project Structure

```text
├── frontend/                # Next.js Application
│   ├── src/                 # Main Source Code
│   │   ├── app/             # App Router (Login, Dashboards, Dynamic Routes)
│   │   ├── components/      # Reusable UI components (Admin/Member views, Layouts)
│   │   ├── context/         # Global state management (AuthContext, LanguageContext)
│   │   └── proxy.js         # API Routing / Proxy configuration
│   └── package.json
│
├── backend/                 # FastAPI Application
│   ├── app/
│   │   ├── api/v1/          # API Endpoints (Admin, Auth, Members, Transactions)
│   │   ├── models/          # ORM Database Models
│   │   ├── repositories/    # Database query abstractions
│   │   ├── schemas/         # Pydantic validation models
│   │   └── services/        # Core business logic
│   ├── docker-compose.yml   # Container orchestration
│   └── Dockerfile           # Backend container build instructions