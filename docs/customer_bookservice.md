# Customer Book Service — Frontend Integration Guide

This guide explains how a customer books a service, with and without login, and how provider selection works.

---

## 1) How it works (with example)

### High-level flow

1. **Display services** for a business (public endpoints using business slug).
2. **Fetch available slots** using the scheduler (public endpoint).
3. **Create the booking**:
   - If customer is logged in → use `POST /booking` (JWT required).
   - If customer is not logged in → use `POST /contact` (public) to submit a booking request.
4. **Provider selection rules**:
   - If a service has `showProvider: true`, you must send `serviceProviderId` when booking.
   - If `showProvider: false`, provider is ignored during booking.

### Example: logged-in booking with provider

1. Get slots:

```
GET /scheduler/available-slots?serviceId=<SERVICE_ID>&date=2026-04-10&businessSlug=<BUSINESS_SLUG>
```

2. Create booking:

```bash
curl -X POST "http://localhost:3000/booking?businessSlug=<BUSINESS_SLUG>" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "serviceId": "<SERVICE_ID>",
    "serviceProviderId": "<PROVIDER_ID>",
    "bookingTime": { "start": "2026-04-10T10:00:00Z", "end": "2026-04-10T10:30:00Z" },
    "status": "Pending",
    "confirmationMethod": "Email",
    "bookingSource": "Website",
    "customerNotes": "Please call before arrival"
  }'
```

### Example: logged-in booking without provider

```bash
curl -X POST "http://localhost:3000/booking?businessSlug=<BUSINESS_SLUG>" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "serviceId": "<SERVICE_ID>",
    "bookingTime": { "start": "2026-04-10T10:00:00Z", "end": "2026-04-10T10:30:00Z" },
    "status": "Pending",
    "confirmationMethod": "Email",
    "bookingSource": "Website"
  }'
```

### Example: not logged in (public booking request)

```bash
curl -X POST "http://localhost:3000/contact?businessSlug=<BUSINESS_SLUG>" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "<SERVICE_ID>",
    "firstName": "Rafid",
    "lastName": "Bapi",
    "email": "rafid@example.com",
    "phone": "01834284316",
    "bookingTime": { "start": "2026-04-10T10:00:00Z", "end": "2026-04-10T10:30:00Z" },
    "notes": "Please confirm by SMS"
  }'
```

---

## 2) URL paths for booking (provider vs no provider, logged in vs not)

### Logged-in customer booking (JWT required)

- **Method:** `POST`
- **Path:** `/booking`
- **Auth:** `Authorization: Bearer <token>`
- **Business context:**
  - `x-business-id: <BUSINESS_ID>` header **or**
  - `businessSlug=<slug>` query param

**With provider:**

- Include `serviceProviderId` in the request body.

**Without provider:**

- Omit `serviceProviderId`.

Example (with provider):

```bash
curl -X POST "http://localhost:3000/booking?businessSlug=<BUSINESS_SLUG>" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "serviceId": "<SERVICE_ID>",
    "serviceProviderId": "<PROVIDER_ID>",
    "bookingTime": { "start": "2026-04-10T10:00:00Z", "end": "2026-04-10T10:30:00Z" },
    "status": "Pending",
    "confirmationMethod": "Email",
    "bookingSource": "Website"
  }'
```

### Not logged in (public booking request)

- **Method:** `POST`
- **Path:** `/contact`
- **Auth:** none (public)
- **Business context:**
  - `x-business-id: <BUSINESS_ID>` header **or**
  - `businessSlug=<slug>` query param

Example:

```bash
curl -X POST "http://localhost:3000/contact?businessSlug=<BUSINESS_SLUG>" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "<SERVICE_ID>",
    "firstName": "Rafid",
    "lastName": "Bapi",
    "email": "rafid@example.com",
    "phone": "01834284316",
    "bookingTime": { "start": "2026-04-10T10:00:00Z", "end": "2026-04-10T10:30:00Z" },
    "notes": "Please confirm by SMS"
  }'
```

---

## 3) Data the frontend must send and will receive

### 3.1 Logged-in booking request body

```ts
type CreateBookingRequest = {
  serviceId: string;
  serviceProviderId?: string; // required when service.showProvider === true
  bookingTime: { start: string; end: string }; // ISO 8601
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';
  confirmationMethod: 'Email' | 'SMS' | 'Phone' | 'None';
  bookingSource: 'Website' | 'Phone' | 'WalkIn' | 'Mobile';
  customerNotes?: string;
};
```

**Notes**

- `bookingTime` should match a slot returned by `/scheduler/available-slots`.
- When `showProvider: true`, the backend requires `serviceProviderId`.
- Business context is required via `x-business-id` header or `businessSlug` query param.

### 3.2 Logged-in booking response

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Booking created successfully",
  "timestamp": "2026-04-01T12:00:00.000Z",
  "data": {
    "id": "<BOOKING_ID>",
    "businessId": "<BUSINESS_ID>",
    "userId": "<USER_ID>",
    "serviceId": "<SERVICE_ID>",
    "serviceProviderId": "<PROVIDER_ID>",
    "bookingTime": {
      "start": "2026-04-10T10:00:00Z",
      "end": "2026-04-10T10:30:00Z"
    },
    "status": "Pending",
    "confirmationMethod": "Email",
    "bookingSource": "Website",
    "customerNotes": "Please call before arrival",
    "createdAt": "2026-04-01T12:00:00.000Z",
    "updatedAt": "2026-04-01T12:00:00.000Z",
    "cancelledAt": null,
    "cancellationReason": null
  }
}
```

### 3.3 Public booking request (not logged in)

```ts
type CreateContactRequest = {
  serviceId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bookingTime?: { start: string; end: string };
  notes?: string;
};
```

### 3.4 Public booking response

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Contact created successfully",
  "timestamp": "2026-04-01T12:00:00.000Z",
  "data": {
    "id": "<CONTACT_ID>",
    "businessId": "<BUSINESS_ID>",
    "serviceId": "<SERVICE_ID>",
    "firstName": "Rafid",
    "lastName": "Bapi",
    "email": "rafid@example.com",
    "phone": "01834284316",
    "bookingTime": {
      "start": "2026-04-10T10:00:00Z",
      "end": "2026-04-10T10:30:00Z"
    },
    "notes": "Please confirm by SMS",
    "createdAt": "2026-04-01T12:00:00.000Z",
    "updatedAt": "2026-04-01T12:00:00.000Z"
  }
}
```

---

## Common errors to handle

- `400 Bad Request`:
  - missing required fields
  - missing business context (no `x-business-id` and no `businessSlug`)
  - provider required but not provided
- `401 Unauthorized`:
  - missing/invalid JWT for `/booking`
- `404 Not Found`:
  - service or business not found

---

## Frontend checklist

- Use `/scheduler/available-slots` before submitting booking time.
- Include `serviceProviderId` only if the service has `showProvider: true`.
- Include either `x-business-id` header **or** `businessSlug` query parameter.
- Logged-in: `POST /booking` with JWT.
- Not logged-in: `POST /contact` without JWT.
