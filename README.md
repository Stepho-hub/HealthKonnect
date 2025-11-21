# HealthKonnect - Telemedicine MVP

[![Frontend Deployment](https://img.shields.io/badge/Frontend-Vercel-000000?style=flat&logo=vercel)](https://health-konnect-jdae.vercel.app/)
[![Backend Deployment](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat&logo=render)](https://healthkonnect.onrender.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive telemedicine platform built with MERN stack + TypeScript, featuring Clerk authentication, real-time messaging, and mobile-first design optimized for Kenya/East Africa.

## 🌐 Live Demo

- **Frontend**: [https://health-konnect-jdae.vercel.app/](https://health-konnect-jdae.vercel.app/)
- **Backend API**: [https://healthkonnect.onrender.com](https://healthkonnect.onrender.com)
- **API Health Check**: [https://healthkonnect.onrender.com/api/health](https://healthkonnect.onrender.com/api/health)

## 🏗️ Project Structure

```
healthkonnect/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   ├── middlewares/    # Custom middleware
│   │   ├── services/       # Business logic
│   │   ├── tests/          # Unit & integration tests
│   │   ├── types/          # Local type definitions
│   │   └── server.ts       # Main server file
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example        # Required API keys
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── lib/           # Utilities & API clients
│   │   ├── types/         # Local type definitions
│   │   └── public/        # Static assets
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   └── .env.example        # Required API keys
├── package.json           # Root project configuration
└── README.md
```

## 🚀 Features

### Core Functionality
- **User Authentication**: Clerk-based auth with role management (Patient, Doctor, Admin)
- **Appointment Booking**: Multi-step booking with real-time availability
- **Real-time Messaging**: Socket.IO powered chat between patients and doctors
- **Profile Management**: Comprehensive user profiles with medical history
- **Doctor Directory**: Browse and filter doctors by specialty/location
- **Admin Dashboard**: User and system management

### Advanced Features
- **Offline-First**: Service workers for offline functionality
- **Mobile-First**: Responsive design optimized for mobile devices
- **Real-time Notifications**: In-app and SMS notifications
- **AI Symptom Checker**: Rule-based triage system
- **Payment Integration**: M-Pesa STK Push (mock mode available)

## 🛠️ Tech Stack

### Backend
- **Node.js** with **Express.js**
- **TypeScript** for type safety
- **MongoDB** with **Mongoose** ODM
- **Socket.IO** for real-time features
- **Clerk** for authentication
- **Zod** for runtime validation
- **Helmet** for security

### Frontend
- **React 18** with **TypeScript**
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Router** for navigation
- **Clerk React** for auth integration

### DevOps
- **Docker** & **Docker Compose** for containerization
- **Jest** & **Supertest** for testing
- **ESLint** & **Prettier** for code quality
- **GitHub Actions** for CI/CD

## 📋 Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Clerk account for authentication
- Git

## 🔑 Required API Keys & Services

### Essential Services (Required for Production)

#### 1. **Clerk Authentication** 🔐
```bash
# Get from: https://clerk.com
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
```

#### 2. **MongoDB Database** 🗄️
```bash
# Get from: https://cloud.mongodb.com
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/healthkonnect
```

### Payment Integration (Kenya/East Africa)

#### 3. **M-Pesa Daraja API** 💰
```bash
# Get from: https://developer.safaricom.co.ke
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
MPESA_SHORTCODE=your_mpesa_shortcode
MPESA_PASSKEY=your_mpesa_passkey
MPESA_ENVIRONMENT=sandbox  # or production
```

### Communication Services

#### 4. **Twilio SMS** 📱
```bash
# Get from: https://twilio.com
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### File Storage (Optional - Falls back to local)

#### 5. **AWS S3** ☁️
```bash
# Get from: https://aws.amazon.com/s3
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-healthkonnect-bucket
```

### Optional Services

#### 6. **OpenAI (AI Features)** 🤖
```bash
# Get from: https://platform.openai.com
OPENAI_API_KEY=your_openai_api_key
```

#### 7. **Google Maps** 🗺️
```bash
# Get from: https://console.cloud.google.com
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

#### 8. **Email Service (SMTP)** 📧
```bash
# Gmail or other SMTP provider
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Services That DON'T Require API Keys

- **Socket.IO** - Real-time messaging (no external keys needed)
- **PDF Generation** - Uses pdfkit library locally
- **Local File Storage** - Falls back to server filesystem

## 🚀 Quick Start

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd healthkonnect

# Install all dependencies
npm run install:all
```

### 2. Environment Setup

#### Backend Environment (.env)
```bash
# Copy example file
cp backend/.env.example backend/.env

# Required - Edit with your values
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/healthkonnect
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here
CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here

# Optional - Payment Integration (Kenya)
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
MPESA_SHORTCODE=your_mpesa_shortcode
MPESA_PASSKEY=your_mpesa_passkey
MPESA_ENVIRONMENT=sandbox

# Optional - SMS Notifications
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Optional - File Storage (AWS S3)
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-healthkonnect-bucket

# Server Configuration
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

#### Frontend Environment (.env)
```bash
# Copy example file
cp frontend/.env.example frontend/.env

# Required - Clerk Authentication (Get from https://dashboard.clerk.com)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here

# Demo Mode - set to false for full Clerk authentication
VITE_DEMO_MODE=false

# API Configuration
# For development: http://localhost:5001
# For production: https://healthkonnect.onrender.com
VITE_API_URL=http://localhost:5001

# Optional - External Services
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 3. Start Development Servers

```bash
# Start both frontend and backend (separate servers)
npm run dev

# Or start individually:
cd backend && npm run dev    # Backend API at http://localhost:5001
cd frontend && npm run dev   # Frontend at http://localhost:5173
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5001
- **API Health Check**: http://localhost:5001/api/health

### Clerk Authentication Setup

**HealthKonnect uses Clerk for production-ready authentication with no limitations.**

#### Setting up Clerk (Required for Production):

1. **Create Clerk Account**: Sign up at [clerk.com](https://clerk.com)
2. **Create Application**:
   - Go to Dashboard → Create Application
   - Choose "React" as your framework
   - Set up authentication methods (Email, Phone, etc.)
3. **Get API Keys**:
   - Go to API Keys section
   - Copy `Publishable key` → `VITE_CLERK_PUBLISHABLE_KEY`
   - Copy `Secret key` → `CLERK_SECRET_KEY`

#### Environment Configuration:

**Frontend (.env)**:
```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxx
VITE_DEMO_MODE=false
```

**Backend (.env)**:
```bash
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxx
```

#### Clerk Features Available:
- ✅ **Unlimited Users**: No user limits
- ✅ **Multiple Auth Methods**: Email, Phone, Social logins
- ✅ **User Management**: Profiles, roles, permissions
- ✅ **Security**: JWT tokens, session management
- ✅ **Admin Dashboard**: User management interface
- ✅ **Production Ready**: Enterprise-grade security

**Note**: Demo mode (`VITE_DEMO_MODE=true`) bypasses Clerk for development only.

## 🧪 Testing

### Run All Tests
```bash
npm run test
```

### Run Backend Tests Only
```bash
cd backend && npm run test
```

### Run Mock Tests (for CI/CD)
```bash
npm run mock-test
```

## 🚀 Deployment Guide

### Current Deployments

- **Frontend**: Deployed on Vercel at [https://health-konnect-jdae.vercel.app/](https://health-konnect-jdae.vercel.app/)
- **Backend**: Deployed on Render at [https://healthkonnect.onrender.com](https://healthkonnect.onrender.com)

### Production Environment Setup

#### Required API Keys for Production:

1. **Clerk Authentication** (Essential)
   - Sign up at [clerk.com](https://clerk.com)
   - Create a new application
   - Copy `CLERK_SECRET_KEY` and `CLERK_PUBLISHABLE_KEY`

2. **MongoDB Database** (Essential)
   - Sign up at [MongoDB Atlas](https://cloud.mongodb.com)
   - Create a cluster and database
   - Get connection string for `MONGODB_URI`

3. **M-Pesa Integration** (Kenya Payments)
   - Register at [Safaricom Developer Portal](https://developer.safaricom.co.ke)
   - Create app and get consumer key/secret
   - Configure shortcode and passkey

4. **Twilio SMS** (Notifications)
   - Sign up at [twilio.com](https://twilio.com)
   - Purchase phone number
   - Get Account SID and Auth Token

#### Optional Services:
- **AWS S3** for file storage
- **OpenAI** for AI features
- **Google Maps** for location services

### Vercel Frontend Deployment

1. **Connect Repository**: Link your GitHub repo to Vercel
2. **Build Settings**:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
3. **Environment Variables**:
   - `NODE_VERSION`: `18`
   - `VITE_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key
   - `VITE_API_URL`: `https://healthkonnect.onrender.com`
   - `VITE_DEMO_MODE`: `false`
4. **Deploy**: Vercel will auto-deploy on git push

### Render Backend Deployment

1. **Connect Repository**: Link your GitHub repo to Render
2. **Service Type**: Web Service
3. **Build Settings**:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. **Environment Variables**:
   - `MONGODB_URI`: Your MongoDB connection string
   - `CLERK_SECRET_KEY`: Your Clerk secret key
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (Render default)
   - `FRONTEND_URL`: `https://health-konnect-jdae.vercel.app`
5. **Deploy**: Render will build and deploy automatically

### Troubleshooting Common Issues

#### Vercel Build Failures
- **Rollup Module Error**: If you encounter `@rollup/rollup-linux-x64-gnu` errors, the `vercel.json` is configured to use Node 18 and force rollup installation.
- **Dependency Issues**: Frontend uses `--legacy-peer-deps` for compatibility.
- **Build Directory**: Ensure Vercel is set to build from `frontend/` directory.

#### Backend Deployment Issues
- **Port Configuration**: Render uses port 10000 by default; ensure `PORT=10000` in environment.
- **MongoDB Connection**: Verify MongoDB Atlas allows connections from Render's IP ranges.
- **CORS**: Backend is configured to allow requests from the Vercel frontend URL.

#### Local Development
- **Port Conflicts**: Ensure ports 5001 (backend) and 5173 (frontend dev) are available.
- **Environment Variables**: Copy `.env.example` files and fill in required keys.
- **Dependencies**: Run `npm run install:all` to install all dependencies.

### Docker Deployment

#### Development with Docker Compose
```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d
```

#### Production Deployment
```bash
# Build for production
npm run build

# Use Docker for deployment
docker build -t healthkonnect-backend ./backend
docker build -t healthkonnect-frontend ./frontend

# Run containers
docker run -d -p 5001:5001 --env-file backend/.env healthkonnect-backend
docker run -d -p 80:80 healthkonnect-frontend
```

### VPS/Cloud Deployment

#### Environment Variables Checklist:
```bash
# ✅ Required for all deployments
MONGODB_URI=mongodb+srv://...
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...

# ✅ Required for Kenya deployment
MPESA_CONSUMER_KEY=...
MPESA_CONSUMER_SECRET=...
MPESA_SHORTCODE=...
MPESA_PASSKEY=...
MPESA_ENVIRONMENT=production

# ✅ Required for SMS notifications
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+254...

# 🔄 Optional but recommended
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=...
```

#### Deployment Steps:
1. **Set up VPS** (DigitalOcean, AWS EC2, etc.)
2. **Install Node.js 18+**
3. **Clone repository**
4. **Configure environment variables**
5. **Install dependencies**: `npm run install:all`
6. **Build application**: `npm run build`
7. **Start services**: `npm run dev` or use PM2
8. **Set up reverse proxy** (nginx)
9. **Configure SSL certificate** (Let's Encrypt)

## 📱 Mobile-First Design

The application is optimized for:
- **Low-bandwidth connections** (Kenya/East Africa)
- **Mobile devices** (primary target)
- **Offline functionality** (appointment queuing)
- **Progressive Web App** features

## 🔒 Security Features

- **RBAC**: Role-based access control
- **Input validation**: Zod schemas for all inputs
- **Rate limiting**: API rate limiting
- **CORS**: Configured for security
- **Helmet**: Security headers
- **Data encryption**: Sensitive data encryption

## 📊 API Documentation

### Core Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

#### Appointments
- `GET /api/appointments` - Get user appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment

#### Doctors
- `GET /api/doctors` - List doctors
- `GET /api/doctors/:id` - Get doctor details

#### Messages
- `GET /api/messages` - Get user messages
- `POST /api/messages` - Send message

#### Admin
- `GET /api/admin/doctors` - Admin doctor management
- `POST /api/admin/doctors` - Add new doctor

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for telemedicine needs in Kenya and East Africa
- Optimized for unreliable network conditions
- Mobile-first approach for accessibility
- Open source community contributions

---

**HealthKonnect** - Connecting patients and healthcare providers through technology.
