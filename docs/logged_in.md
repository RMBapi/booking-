# Frontend Login Integration (logged_in)

This project uses **JWT (Bearer token)** authentication.

- **API base URL (local):** `http://localhost:3000`
- **Swagger UI:** `http://localhost:3000/api`
- There is **no global `/api` prefix** for routes (only Swagger is served at `/api`).
- JWT `accessToken` currently expires in **7 days**.

---

## 1) How login works (with example)

### What the backend does

When you call `POST /auth/login`, the backend:

1. Finds the user by `email` (must not be soft-deleted).
2. Resolves the user’s assigned roles (dynamic RBAC via `user_roles`).
3. Selects an **active role**:
   - If you send `role`, it must be one of the user’s roles.
   - If you **omit `role`**, the backend auto-selects the **first non-customer role** (alphabetically).
   - If the user only has the `Customer` role, login **must** be explicit (see Customer flow below).
4. If the selected role is `Customer`, it also validates the user is associated with the given `businessSiteSlug`.
5. Verifies:
   - `isActive === true`
   - password matches (bcrypt)
6. Returns a JWT `accessToken` and basic user info including `roles` and the chosen `activeRole`.

### Example (non-customer login)

**Request**

```bash
curl -X POST "http://localhost:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@example.com",
    "password": "Password123!"
  }'
```

**Response (200)**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx...",
    "firstName": "Jane",
    "lastName": "Owner",
    "email": "owner@example.com",
    "roles": ["Business_owner"],
    "activeRole": "Business_owner"
  }
}
```

---

## 2) URL path for login (with example)

### Login

- **Method:** `POST`
- **Path:** `/auth/login`
- **Full URL (local):** `http://localhost:3000/auth/login`

### Register (often used before login)

- **Method:** `POST`
- **Path:** `/auth/register`
- **Full URL (local):** `http://localhost:3000/auth/register`

---

## 3) What data the frontend sends and receives

### Request body (login)

Send JSON with:

- `email` (string, required)
- `password` (string, required)
- `role` (string, optional for non-customer; **required for Customer**)
- `businessSiteSlug` (string, optional normally; **required when role is `Customer`**)

**Customer login request example**

```json
{
  "email": "customer@example.com",
  "password": "Password123!",
  "role": "Customer",
  "businessSiteSlug": "acme-salon-spa"
}
```

### Response body (login success)

The backend returns:

- `accessToken` (string) — JWT to send as Bearer token
- `user` — basic identity + roles:
  - `id` (string)
  - `firstName` (string)
  - `lastName` (string)
  - `email` (string)
  - `roles` (string[]) — all roles assigned to the user
  - `activeRole` (string) — the role context used for authorization

### How to use the token on later requests

For protected endpoints, include:

- `Authorization: Bearer <accessToken>`

Example:

```bash
curl "http://localhost:3000/business/my-businesses" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Frontend example (fetch)

```ts
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

type LoginRequest = {
  email: string;
  password: string;
  role?: string;
  businessSiteSlug?: string;
};

type LoginResponse = {
  accessToken: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    roles: string[];
    activeRole: string;
  };
};

export async function login(body: LoginRequest): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    // common statuses:
    // 400: validation error (missing fields / extra unexpected fields)
    // 401: invalid credentials / inactive user / customer site mismatch
    const text = await res.text();
    throw new Error(`Login failed (${res.status}): ${text}`);
  }

  return res.json();
}
```

### Common error behaviors to handle

- `401 Unauthorized`:
  - invalid email/password
  - role mismatch
  - customer missing/invalid `businessSiteSlug`
  - account inactive
- `400 Bad Request`:
  - missing required fields
  - **extra unexpected fields** (validation uses `forbidNonWhitelisted: true`)

### Error response shape (important for frontend)

All errors are wrapped by a global exception filter, so you will typically receive JSON like:

```json
{
  "statusCode": 401,
  "timestamp": "2026-04-01T12:00:00.000Z",
  "path": "/auth/login",
  "method": "POST",
  "message": "Invalid credentials",
  "error": {
    "statusCode": 401,
    "message": "Invalid credentials",
    "error": "Unauthorized"
  }
}
```

For validation failures (`400`), `message` can be an array of strings (from class-validator), and you may also get additional details under `error`.

---

## 4) Customer login flow

Customers are **site-scoped**. A customer must log in **in the context of a business site** using `businessSiteSlug`.

### Where to get `businessSiteSlug`

In this backend, the slug is used widely as the “public identifier” for a business.
Examples of public endpoints that include the slug:

- `GET /business/slug/:slug`
- `GET /business/slug/:slug/services`

So in a typical customer web app, the slug comes from the page route (e.g. `/[slug]/login`) or from business data you already loaded.

### Step-by-step flow

1. Customer navigates to a specific business site (you already have `slug`).
2. Show login form (email + password).
3. On submit, call:
   - `POST /auth/login`
   - Body must include:
     - `email`, `password`
     - `role: "Customer"`
     - `businessSiteSlug: "<slug>"`
4. On success:
   - store `accessToken` (where/how you store it is a frontend choice)
   - use it in `Authorization: Bearer <token>` for protected customer endpoints

### Customer login request example (copy/paste)

```bash
curl -X POST "http://localhost:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "Password123!",
    "role": "Customer",
    "businessSiteSlug": "acme-salon-spa"
  }'
```

### Notes / gotchas

- If the customer account is not associated with that `businessSiteSlug`, the backend returns `401`.
- If you omit `role` for a user that only has `Customer`, the backend returns `401`.
- The backend only issues an `accessToken` (no refresh token flow is implemented here).
