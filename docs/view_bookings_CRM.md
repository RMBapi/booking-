# View Bookings in CRM — Frontend Integration Guide

This guide explains how a customer booking appears in CRM, including:

- bookings made by logged-in users
- booking requests submitted by non-logged-in users
- list/detail endpoints, filters, and other CRM actions

---

## 1) How it works (with example)

### Two sources of customer bookings

1. **Logged-in customers** create a real booking via `POST /booking`.
   - These bookings appear in the CRM via `GET /booking`.

2. **Non-logged-in customers** submit a booking request via `POST /contact` (public).
   - These requests appear in the CRM via `GET /contact`.

### Example flow

1. Customer (logged-in) books a service via `POST /booking`.
2. CRM user (Business Owner/Admin) opens the CRM list:
   - `GET /booking` to see real bookings
   - `GET /contact` to see public booking requests

---

## 2) URL paths for seeing bookings

### 2.1 Logged-in user bookings (CRM view)

**List bookings**

- **Method:** `GET`
- **Path:** `/booking`
- **Auth:** JWT required
- **Business context:** `x-business-id` header required

**Example**

```bash
curl "http://localhost:3000/booking?page=1&limit=20&status=Pending" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "x-business-id: <BUSINESS_ID>"
```

**Get single booking**

- **Method:** `GET`
- **Path:** `/booking/:id`
- **Auth:** JWT required
- **Business context:** `x-business-id` header required

```bash
curl "http://localhost:3000/booking/<BOOKING_ID>" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "x-business-id: <BUSINESS_ID>"
```

### 2.2 Non-logged-in booking requests (CRM view)

These are **contact records**, created publicly by customers without login.

**List contact requests**

- **Method:** `GET`
- **Path:** `/contact`
- **Auth:** JWT required
- **Business context:** `x-business-id` header required

```bash
curl "http://localhost:3000/contact?page=1&limit=20" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "x-business-id: <BUSINESS_ID>"
```

**Get single contact request**

- **Method:** `GET`
- **Path:** `/contact/:id`
- **Auth:** JWT required
- **Business context:** `x-business-id` header required

```bash
curl "http://localhost:3000/contact/<CONTACT_ID>" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "x-business-id: <BUSINESS_ID>"
```

> Note: There is **no public “view my booking” endpoint** for non-logged-in customers. They only create a request via `POST /contact`. Viewing is handled in the CRM by authenticated users.

---

## 3) Data the frontend must send and will receive

### 3.1 Booking list query parameters (CRM)

The list endpoint supports pagination and filtering.

```ts
type BookingListQuery = {
  page?: number; // default 1
  limit?: number; // default 10
  search?: string; // generic search
  sortBy?: string; // e.g. "createdAt"
  sortOrder?: 'asc' | 'desc';

  // filters
  status?: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';
  userId?: string;
  serviceId?: string;
  serviceProviderId?: string;
};
```

### 3.2 Booking list response

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation completed successfully",
  "timestamp": "2026-04-02T12:00:00.000Z",
  "data": [
    {
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
      "createdAt": "2026-04-02T12:00:00.000Z",
      "updatedAt": "2026-04-02T12:00:00.000Z",
      "cancelledAt": null,
      "cancellationReason": null
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### 3.3 Contact list query parameters (CRM)

```ts
type ContactListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';

  // filters
  email?: string;
  phone?: string;
  serviceId?: string;
};
```

### 3.4 Contact list response

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation completed successfully",
  "timestamp": "2026-04-02T12:00:00.000Z",
  "data": [
    {
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
      "createdAt": "2026-04-02T12:00:00.000Z",
      "updatedAt": "2026-04-02T12:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

## 4) Other action URLs and data format

### 4.1 Update a booking

- **Method:** `PATCH`
- **Path:** `/booking/:id`
- **Auth:** JWT required
- **Business context:** `x-business-id` header required

```bash
curl -X PATCH "http://localhost:3000/booking/<BOOKING_ID>" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "x-business-id: <BUSINESS_ID>" \
  -d '{
    "status": "Confirmed",
    "confirmationMethod": "SMS"
  }'
```

### 4.2 Cancel a booking

- **Method:** `POST`
- **Path:** `/booking/:id/cancel`
- **Auth:** JWT required
- **Business context:** `x-business-id` header required

```bash
curl -X POST "http://localhost:3000/booking/<BOOKING_ID>/cancel" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "x-business-id: <BUSINESS_ID>" \
  -d '{
    "cancellationReason": "Customer requested cancellation"
  }'
```

### 4.3 Update a contact request

- **Method:** `PATCH`
- **Path:** `/contact/:id`
- **Auth:** JWT required
- **Business context:** `x-business-id` header required

```bash
curl -X PATCH "http://localhost:3000/contact/<CONTACT_ID>" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "x-business-id: <BUSINESS_ID>" \
  -d '{
    "notes": "Called customer and confirmed appointment"
  }'
```

### 4.4 Delete a contact request

- **Method:** `DELETE`
- **Path:** `/contact/:id`
- **Auth:** JWT required
- **Business context:** `x-business-id` header required

---

## Common errors

- `400 Bad Request`: missing required params, invalid filters, or missing business context
- `401 Unauthorized`: missing/invalid JWT
- `404 Not Found`: booking/contact not found
