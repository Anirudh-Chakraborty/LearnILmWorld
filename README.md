LearniLM World — Online Learning Platform 🎓🌍

A modern, production-ready learning marketplace connecting students and trainers with secure payments, live sessions, intelligent chatbot support, and rich profiles — built with React (TypeScript) frontend, Express.js backend, and MongoDB.

🔗 Live Project

🌐 URL: https://www.learnilmworld.com/

📂 Problem Statement

Students and trainers face friction when trying to connect for meaningful learning:

Hard to discover qualified and trusted trainers

Booking & payment workflows are tedious

Live sessions require stable, integrated tools

Admins and trainers lack proper analytics

Students often miss guided help for queries

These challenges lead to poor user experience and reduced conversions.

✅ Our Solution: LearniLM World

LearniLM World solves these problems with:

Secure Student & Trainer authentication (JWT-based)

Detailed trainer profiles with demo videos, skills, price, availability

Advanced filtering & search with rich UX

Stripe-powered payments + demo payment mode

Jitsi-based live video sessions with real-time scheduling

Integrated AI chatbot for quick help, navigation, and FAQs

Dashboards for trainers and students with analytics and receipts

Result: A clean, intelligent, and scalable platform for online learning.

🎨 UI Theme & Branding

The platform uses a refined color system visible in the navbar and UI:

Primary Dark: #2D274B

Primary Accent: #DC8D33

Highlight: #CBE56A

Used across buttons, navigation, and key UI components for a premium look.

🏆 Core Features
🔐 Authentication & Authorization

JWT with refresh tokens

Role-based access: Student & Trainer

Secure password handling

🗂️ Backend (Express.js + MongoDB)

Mongoose schemas: Users, Trainers, Sessions, Reviews, Payments

REST API with validated payloads

Security middleware (Helmet, CORS, rate limiting)

🤖 Chatbot (AI Assistant)

Helps users navigate the platform

Assisted registration & trainer discovery

Fast FAQ responses

Integrated with external LLM API for precision

💳 Payments

Stripe integration for real charges

Demo payment mode for testing

Auto-generated receipts

📺 Live Sessions

Jitsi-based secure meetings

Automatic session creation & tracking

Time-based access

⭐ Reviews & Ratings

Star ratings + detailed reviews

Trainer rating aggregation

📊 Dashboards & Analytics

Upcoming sessions, history, and receipts for students

Earnings, bookings, and stats for trainers

🧩 Frontend (React + TypeScript + Tailwind + Framer Motion)

Clean animations and transitions

Responsive UI

Custom filters and sorting for trainers

Visually polished landing and about sections

🚀 Quick Start (Local)

# Clone repository

git clone https://github.com/<yourusername>/LearniLM-World.git
cd LearniLM-World

# Backend

cd server
npm install
npm run dev

# Frontend

cd ../client
npm install
npm run dev

Example .env (Backend)
PORT=4000
MONGO*URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/learniLM
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
STRIPE_SECRET_KEY=sk_test*...
STRIPE*WEBHOOK_SECRET=whsec*...
JITSI_BASE_URL=https://meet.jit.si
NODE_ENV=development

🗺️ How It Works
👨‍🎓 For Students

Register & verify email

Explore trainers with search/filter

Book a session and pay

Join class through Jitsi

Submit ratings & feedback

👨‍🏫 For Trainers

Create a profile

Manage availability

Accept bookings

View earnings & analytics

Interact with students

📦 API Endpoints (Examples)

POST /api/auth/register

POST /api/auth/login

GET /api/trainers

POST /api/sessions

POST /api/payments/create

POST /api/payments/webhook

GET /api/dashboard/student

GET /api/dashboard/trainer

🛠️ Tech Stack

Frontend

React

TypeScript

Tailwind CSS

Framer Motion

Backend

Node.js

Express.js

MongoDB

Integrations

Stripe

Jitsi

AI Chatbot (RAG-based / LLM-powered)

📚 Contributors

Built with ❤️ by:

Mudadla Yogitha
Mohd Alfahad
Preethi
Kartik Saxena
Anirudh Chakraborty
Tapas Patra
Anushree Bera
Mayukh Banerjee
Ravi Kumar



📧 Contact

For questions or support:
📩 support@learnilmworld.com

❤️ Final Note

Built with passion & precision — LearniLM World ✨
Empowering learners across the globe.
