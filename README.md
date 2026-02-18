

## ✨ Features

### Multi-Role System
- **Super Admin**: Create and manage business owner accounts, system-wide control
- **Business Owner**: Manage businesses, services, service providers, and bookings
- **Service Provider**: View and manage assigned appointments
- **Customer**: Browse businesses, book services, manage bookings

### Core Functionality
- ✅ **JWT Authentication** - Secure token-based auth with automatic refresh
- ✅ **Role-Based Access Control** - Protected routes and permissions
- ✅ **Business Management** - Create businesses with auto-generated slugs
- ✅ **Service Management** - Full CRUD with filtering, search, and pagination
- ✅ **Booking System** - Complete booking flow with guest and authenticated users
- ✅ **Public Business Pages** - SEO-friendly pages (no authentication required)
- ✅ **Responsive Design** - Mobile-first, works on all devices
- ✅ **Dark Mode** - Full dark mode support throughout the app



## 🚀 Quick Start


- Backend API running (default: `http://localhost:3000`)

### Installation

1. **Clone and Install**
```bash
cd booking_frontend
npm install
```

2. **Environment Setup**
```bash
# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:3000" > .env.local
```

3. **Start Development Server**
```bash
npm run dev
```

4. **Open Browser**
Navigate to [http://localhost:3001](http://localhost:3001)

### First Steps

#### 1. Login as Super Admin
```
URL: /auth/login
Credentials: (Created in backend)
```

#### 2. Create Business Owner
```
Navigate to: /super-admin
Click: "Create Business Owner"
Fill in the form and submit
```

#### 3. Login as Business Owner
```
Use the credentials you just created
System will prompt to create a business profile
```

#### 4. Create Business
```
Fill in business details
Slug auto-generated from business name
Example: "Acme Salon" → "acme-salon"
```

#### 5. View Public Page
```
URL: /business/slug/acme-salon
No authentication required!
```

---

## 📁 Project Structure

```
booking_frontend/
├── app/                          # Next.js App Router pages
│   ├── auth/                     # Authentication pages
│   │   ├── login/               # Login page
│   │   └── register/            # Register page
│   ├── super-admin/              # Super Admin dashboard
│   ├── business-owner/           # Business Owner dashboard
│   │   ├── [businessId]/
│   │   │   ├── services/        # Service management
│   │   │   └── requests/        # Booking requests management
│   │   └── providers/           # Service provider management
│   ├── customer/                 # Customer dashboard
│   │   └── dashboard/
│   ├── business/                 # Public business pages
│   │   └── slug/[slug]/
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   └── globals.css              # Design system tokens
│
├── components/                   # Reusable UI components
│   ├── buttons/                  # Button components
│   │   └── Button.tsx
│   ├── ui/                       # shadcn/ui components
│   │   ├── Card.tsx
│   │   ├── Dialog.tsx
│   │   ├── Input.tsx
│   │   ├── Table.tsx
│   │   ├── Badge.tsx
│   │   ├── Select.tsx
│   │   └── index.ts
│   └── layout/                   # Layout components
│       ├── PageLayout.tsx
│       ├── PageHeader.tsx
│       ├── PageContent.tsx
│       ├── Section.tsx
│       └── EmptyState.tsx
│
├── contexts/                     # React Context providers
│   └── AuthContext.tsx           # Authentication state
│
├── features/                     # Feature-based modules
│   ├── authentication/
│   │   └── hooks/
│   │       ├── useLogin.ts
│   │       ├── useRegister.ts
│   │       └── useGetProfile.ts
│   ├── super-admin/
│   │   ├── components/
│   │   └── hooks/
│   ├── business-owner/
│   │   ├── components/
│   │   └── hooks/
│   └── customer/
│       ├── components/
│       └── hooks/
│
├── hooks/                        # Global custom hooks
│   └── api-response/
│       ├── useApiError.ts
│       └── useApiSuccess.ts
│
├── lib/                          # Core libraries
│   ├── httpClient.ts             # Axios configuration
│   ├── tanstackQuery.ts          # React Query setup
│   └── toast.ts                  # Toast notifications
│
├── services/                     # API service functions
│   ├── authService.ts
│   ├── adminService.ts
│   ├── businessService.ts
│   ├── serviceService.ts
│   ├── serviceProviderService.ts
│   ├── bookingService.ts
│   ├── contactService.ts
│   └── schedulerService.ts
│
├── types/                        # TypeScript definitions
│   └── index.ts
│
├── utils/                        # Utility functions
│   └── index.ts                  # cn(), formatDate(), etc.
│
├── .env.local                    # Environment variables
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind configuration
└── tsconfig.json                 # TypeScript configuration
```

---

## 🔐 User Roles & Access

### Super Admin
**Route**: `/super-admin`

**Capabilities**:
- Create business owner accounts
- View all business owners
- Toggle business owner status (active/inactive)
- System-wide management

### Business Owner
**Routes**:
- `/business-owner` - Main dashboard
- `/business-owner/[businessId]/services` - Service management
- `/business-owner/[businessId]/requests` - Booking requests management
- `/business-owner/providers` - Service provider management

**Capabilities**:
- Create and manage multiple businesses
- Full CRUD for services (create, edit, delete, filter, search)
- Manage service providers
- View bookings and appointments
- Access analytics and reports

**Service Management Features**:
- Filter by status (Active/Inactive/Archived)
- Search by name/description
- Toggle service active status
- Pagination support
- Bulk operations

### Service Provider
**Route**: `/service-provider/dashboard`

**Capabilities**:
- View assigned services
- Manage appointments
- Update booking status
- View schedule and availability

### Customer
**Route**: `/customer/dashboard`

**Capabilities**:
- Browse public business pages
- Book services (authenticated or guest)
- View booking history
- Manage profile
- Cancel bookings

### Public Access
**Route**: `/business/slug/[slug]`

**Access**: No authentication required

**Features**:
- View business information
- Browse services and pricing
- See contact details
- Book services (redirects to login for payment)

---


### API Documentation
- Swagger UI: `http://localhost:3000/api`

### Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm start               # Start production server

# Code Quality
npm run lint            # Run ESLint
npm run type-check      # TypeScript checking

# Testing
npm run test            # Run tests (if configured)
```



