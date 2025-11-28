# HealthKonnect - Telemedicine MVP

[![Frontend Deployment](https://img.shields.io/badge/Frontend-Vercel-000000?style=flat&logo=vercel)](https://health-konnect-jdae.vercel.app/)
[![Backend Deployment](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat&logo=render)](https://healthkonnect.onrender.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive telemedicine platform built with MERN stack + TypeScript, featuring JWT authentication, real-time messaging, and mobile-first design optimized for Kenya/East Africa.

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

## 🚀 MVP Features Highlight

### ⭐ Core MVP Features

| Feature | Description | Status |
|---------|-------------|--------|
| **🔐 User Authentication** | JWT-based secure login with role management (Patient, Doctor, Admin) | ✅ Live |
| **📅 Appointment Booking** | Real-time doctor availability with multi-step booking process | ✅ Live |
| **💬 Real-time Messaging** | Socket.IO powered secure chat between patients and doctors | ✅ Live |
| **👨‍⚕️ Doctor Directory** | Browse and filter doctors by specialty, location, and credentials | ✅ Live |
| **📋 Prescription Management** | Digital prescriptions with PDF generation and pharmacy integration | ✅ Live |
| **🛡️ Admin Dashboard** | Complete CRUD operations for users, doctors, and system management | ✅ Live |
| **📹 Video Consultation** | WebRTC-powered video calls with screen sharing and chat | ✅ Live |
| **👤 User Profiles** | Comprehensive profile management with medical history | ✅ Live |
| **📱 Mobile-First Design** | Responsive design optimized for smartphones and low bandwidth | ✅ Live |
| **🔒 Error Boundaries** | Crash protection and graceful error handling | ✅ Live |

### 🚀 Advanced Features (Recently Added)

| Feature | Description | Status |
|---------|-------------|--------|
| **📹 Video Consultation** | WebRTC-powered video calls with screen sharing and chat | ✅ Live |
| **👤 User Profiles** | Comprehensive profile management with medical history | ✅ Live |
| **🔒 Error Boundaries** | Crash protection and graceful error handling | ✅ Live |
| **📱 Mobile-First Design** | Responsive design optimized for smartphones and low bandwidth | ✅ Live |

## 👥 User Roles & Permissions

- **👤 Patient**: Book appointments, view medical records, communicate with doctors, access prescriptions
- **👨‍⚕️ Doctor**: Manage appointments, create prescriptions, access patient profiles, communicate with patients
- **🔬 Medical Specialist**: Specialized healthcare professional with doctor privileges and advanced features
- **👑 Admin**: Super admin with full system access, user management, system configuration
  - Can create additional admin accounts through the admin panel
  - Manage all users, doctors, and system settings
  - Access to system analytics and administrative controls

### 🔐 Account Creation

- **Public Registration**: Users can sign up as Patient, Doctor, or Medical Specialist
- **Admin Creation**: Only existing admins can create new admin accounts through the admin panel
- **Role Selection**: Required during signup to ensure proper access and feature availability

### 🚀 Future Roadmap

| Feature | Description | Status |
|---------|-------------|--------|
| **📱 Mobile App** | React Native iOS/Android apps for native experience | 🔄 Q1 2026 |
| **💰 M-Pesa Integration** | Direct payment processing for Kenyan users | 🔄 Q1 2026 |
| **📲 SMS Notifications** | Twilio-powered appointment reminders | 🔄 Q1 2025 |
| **🤖 AI Symptom Checker** | Rule-based triage system for initial assessments | 🔄 Q1 2026 |
| **📍 Location Services** | Google Maps integration for location-based features | 📋 Planned |
| **💾 Offline Functionality** | Service workers for offline appointment queuing | 📋 Planned |

## 🛠️ Tech Stack

### Backend
- **Node.js** with **Express.js**
- **TypeScript** for type safety
- **MongoDB** with **Mongoose** ODM
- **Socket.IO** for real-time features
- **JWT** for authentication
- **Zod** for runtime validation
- **Helmet** for security

### Frontend
- **React 18** with **TypeScript**
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Router** for navigation
- **JWT** for auth integration

### DevOps
- **Docker** & **Docker Compose** for containerization
- **Jest** & **Supertest** for testing
- **ESLint** & **Prettier** for code quality
- **GitHub Actions** for CI/CD

## 📋 Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Git

## 🔑 Required API Keys & Services

### Essential Services (Required for Production)

#### 1. **JWT Authentication** 🔐
```bash
# Generate a secure random string for JWT signing
JWT_SECRET=your_super_secure_jwt_secret_key_here
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
JWT_SECRET=your_super_secure_jwt_secret_key_here

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

### JWT Authentication Setup

**HealthKonnect uses JWT (JSON Web Tokens) for secure authentication with custom user management.**

#### Setting up JWT Authentication:

1. **Generate JWT Secret**: Create a secure random string for signing tokens
   ```bash
   # Generate a secure secret (Linux/Mac)
   openssl rand -base64 32

   # Or use Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

2. **Configure Environment**:
   - Add `JWT_SECRET=your_generated_secret_here` to backend `.env`
   - JWT tokens expire after 24 hours by default

#### Authentication Features Available:
- ✅ **Secure JWT Tokens**: Industry-standard authentication
- ✅ **Role-Based Access**: Admin, Doctor, Patient roles
- ✅ **Session Management**: Automatic token refresh
- ✅ **Password Hashing**: bcrypt encryption
- ✅ **Admin Dashboard**: Complete user management
- ✅ **Custom Implementation**: Full control over auth logic

#### Default Admin Account:
```
Email: admin@healthkonnect.com
Password: admin123
Role: Administrator
```

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

1. **JWT Authentication** (Essential)
    - Generate a secure JWT secret key
    - Add `JWT_SECRET=your_secure_secret_here` to environment

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
    - `VITE_API_URL`: `https://healthkonnect.onrender.com`
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
    - `JWT_SECRET`: Your JWT secret key
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
JWT_SECRET=your_secure_jwt_secret_here

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

- **JWT Authentication**: Secure token-based authentication with custom implementation
- **RBAC**: Role-based access control (Admin, Doctor, Patient)
- **Password Hashing**: bcrypt encryption for passwords
- **Input validation**: Zod schemas for all inputs
- **Rate limiting**: API rate limiting
- **CORS**: Configured for security
- **Helmet**: Security headers
- **Data encryption**: Sensitive data encryption
- **Admin Protections**: Self-deletion prevention and audit trails
- **Error Boundaries**: React error boundaries prevent app crashes
- **Resource Cleanup**: Automatic cleanup of WebRTC and socket connections
- **Graceful Degradation**: Safe fallbacks when features fail

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

#### Video Consultation (WebRTC + Socket.IO)
- `GET /api/video-consultation` - Access video consultation interface
- Socket Events: `join-consultation-room`, `offer`, `answer`, `ice-candidate`, `end-call`, `chat-message`

#### Admin
- `GET /api/admin/stats` - System statistics and metrics
- `GET /api/admin/doctors` - Admin doctor management
- `POST /api/admin/doctors` - Add new doctor
- `PUT /api/admin/doctors/:id` - Update doctor details
- `DELETE /api/admin/doctors/:id` - Delete doctor
- `GET /api/admin/users` - Admin user management
- `PUT /api/admin/users/:id` - Update user details
- `DELETE /api/admin/users/:id` - Delete user

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
