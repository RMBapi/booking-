## Features

- **JWT Authentication** - Secure user registration and login with 7-day token expiration
- **Multi-Role System** - Support for Customer, Service Provider, Business Owner, and Super Admin roles
- **Business Management** - Create and manage multiple businesses with slug-based public URLs
- **Service Management** - Define and manage services with pricing and status
- **Service Provider Management** - Assign providers to services
- **Contact Management** - Track customer contacts and inquiries (for non-logged-in users)
- **Booking System** - Complete booking lifecycle management with status tracking
- **Scheduler System** - Time slot generation and availability management
- **Swagger Documentation** - Interactive API documentation at `/api`
- **Role-Based Access Control** - Fine-grained permissions per role
- **Pagination Support** - Efficient data handling for large datasets
- **Public Endpoints** - Business profiles and services accessible without authentication

---

## Installation & Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory (you can copy `.env.example`):

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/booking_db?schema=public"

# JWT
JWT_SECRET="replace-with-strong-secret"

# Server
PORT=3000
NODE_ENV=development
```

**⚠️ Important:** `JWT_SECRET` is required in production and must be a strong random string.

### 4. Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Open Prisma Studio to view/edit data
npx prisma studio
```

### 5. Start the Application

```bash
# Development mode (with hot reload)
npm run start:dev

# Production mode
npm run start:prod

# Debug mode
npm run start:debug
```

### 6. Access the Application

- **API Base URL:** http://localhost:3000
- **Swagger UI:** http://localhost:3000/api
- **Prisma Studio:** Run `npx prisma studio` (opens at http://localhost:5555)

---

## 📁 Project Structure

```
src/
├── common/                    # Shared utilities and decorators
│   ├── decorators/           # Custom decorators (e.g., BusinessId)
│   ├── filters/              # Exception filters
│   └── middleware/           # Global middleware
├── database/                 # Database configuration
│   └── prisma.service.ts     # Prisma service
├── module/
│   ├── admin/                # Super Admin module
│   ├── auth/                 # Authentication module
│   │   ├── decorators/       # @Public(), @Roles(), @CurrentUser()
│   │   ├── guards/          # JWT and Roles guards
│   │   └── strategies/       # JWT strategy
│   ├── booking/              # Booking management
│   ├── business/             # Business management
│   ├── contact/              # Contact management
│   ├── scheduler/            # Scheduler and time slot management
│   ├── service/              # Service management
│   ├── service_provider/     # Service provider management
│   └── user/                 # User profile endpoints
└── types/                     # TypeScript type definitions

prisma/
└── schema.prisma             # Database schema
```
