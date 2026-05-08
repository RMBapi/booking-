# Reviews — API Documentation

Customers can leave a review (rating 1–5 plus an optional comment) on any of their bookings that is in `Completed` status. Each booking can have **at most one** review.

This doc covers:

- The review data model
- Customer-facing endpoints (create, read, edit, delete a booking's review)
- CRM-facing endpoints (list reviews for a business, get rating summary)
- How reviews are surfaced in `GET /user/my-bookings`

---

## 1) Data model

Table: `reviews`

| Column        | Type                    | Notes                                         |
| ------------- | ----------------------- | --------------------------------------------- |
| `id`          | `uuid` (PK)             |                                               |
| `booking_id`  | `uuid` (unique, FK)     | One review per booking                        |
| `user_id`     | `uuid` (FK)             | Reviewer (must be the booking's customer)     |
| `business_id` | `uuid` (FK)             | Denormalized for fast per-business queries    |
| `rating`      | `int` (1–5)             | Enforced by validation, not DB check          |
| `comment`     | `text` (nullable)       | Max 2000 chars at the API layer               |
| `created_at`  | `timestamp`             |                                               |
| `updated_at`  | `timestamp`             |                                               |
| `deleted_at`  | `timestamp` (nullable)  | Soft-delete flag                              |

Relations:

- `Booking.review` → `Review?` (one-to-one, optional)
- `User.reviews` → `Review[]`
- `Business.reviews` → `Review[]`

All cascades are `ON DELETE CASCADE`, so deleting a booking/user/business removes its reviews.

### Invariants enforced by the service layer

- The requester must own the booking (`booking.userId === user.id`) to create/edit/delete its review.
- The booking's `status` must be `Completed` to accept a new review.
- A booking cannot have more than one active review (the `booking_id` column is `UNIQUE`).
- Soft-deleted reviews (`deletedAt != null`) are hidden from all read endpoints; a new review can be submitted after deletion.

---

## 2) Customer endpoints

All customer endpoints require a JWT (`Authorization: Bearer <ACCESS_TOKEN>`). No `x-business-id` header needed — the booking already carries its business.

### 2.1 Create a review

- **Method:** `POST`
- **Path:** `/booking/:id/review`
- **Auth:** JWT required (must own the booking)

**Request body**

```json
{
  "rating": 5,
  "comment": "Great service, very professional!"
}
```

| Field    | Type    | Required | Rules                          |
| -------- | ------- | -------- | ------------------------------ |
| `rating` | integer | yes      | 1–5 inclusive                  |
| `comment`| string  | no       | ≤ 2000 chars, trimmed on save  |

**Example**

```bash
curl -X POST "http://localhost:3000/booking/<BOOKING_ID>/review" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{ "rating": 5, "comment": "Great service!" }'
```

**Success response (201)**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Review submitted successfully",
  "timestamp": "2026-04-17T10:00:00.000Z",
  "data": {
    "id": "<REVIEW_ID>",
    "bookingId": "<BOOKING_ID>",
    "userId": "<USER_ID>",
    "businessId": "<BUSINESS_ID>",
    "rating": 5,
    "comment": "Great service!",
    "createdAt": "2026-04-17T10:00:00.000Z",
    "updatedAt": "2026-04-17T10:00:00.000Z"
  }
}
```

**Errors**

- `400 Bad Request` — rating out of range, booking not `Completed`, or review already exists.
- `403 Forbidden` — the booking does not belong to the current user.
- `404 Not Found` — booking does not exist.

### 2.2 Get the review on a booking

- **Method:** `GET`
- **Path:** `/booking/:id/review`
- **Auth:** JWT required (must own the booking)

```bash
curl "http://localhost:3000/booking/<BOOKING_ID>/review" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

Returns the same shape as create. `404 Not Found` when the booking has no review (or it was soft-deleted).

> Most frontends won't need this — the review is already embedded in `GET /user/my-bookings` (see §4).

### 2.3 Edit a review

- **Method:** `PATCH`
- **Path:** `/booking/:id/review`
- **Auth:** JWT required (must be the original reviewer)

**Request body** (all fields optional)

```json
{
  "rating": 4,
  "comment": "Updated thoughts."
}
```

```bash
curl -X PATCH "http://localhost:3000/booking/<BOOKING_ID>/review" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{ "rating": 4 }'
```

**Errors**

- `403 Forbidden` — not the original reviewer.
- `404 Not Found` — no review for this booking.

### 2.4 Delete a review

- **Method:** `DELETE`
- **Path:** `/booking/:id/review`
- **Auth:** JWT required (must be the original reviewer)

Soft-deletes the review (`deletedAt` is set). After this, the frontend should re-enable the "Leave a review" CTA — a new review may be submitted.

```bash
curl -X DELETE "http://localhost:3000/booking/<BOOKING_ID>/review" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

## 3) CRM endpoints

For the business owner's dashboard. These require `x-business-id` (or whatever business context the CRM already uses) and a JWT.

### 3.1 List reviews for a business

- **Method:** `GET`
- **Path:** `/review`
- **Auth:** JWT required
- **Business context:** `x-business-id` header required

**Query parameters**

```ts
type ReviewListQuery = {
  page?: number;         // default 1
  limit?: number;        // default 10, max 100
  sortBy?: string;       // e.g. "createdAt", "rating"
  sortOrder?: 'asc' | 'desc';

  rating?: 1 | 2 | 3 | 4 | 5;
  userId?: string;
};
```

**Example**

```bash
curl "http://localhost:3000/review?page=1&limit=20&rating=5" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "x-business-id: <BUSINESS_ID>"
```

**Response**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Reviews fetched successfully",
  "timestamp": "2026-04-17T10:00:00.000Z",
  "data": [
    {
      "id": "<REVIEW_ID>",
      "bookingId": "<BOOKING_ID>",
      "userId": "<USER_ID>",
      "businessId": "<BUSINESS_ID>",
      "rating": 5,
      "comment": "Great service!",
      "createdAt": "2026-04-17T10:00:00.000Z",
      "updatedAt": "2026-04-17T10:00:00.000Z",
      "user": {
        "id": "<USER_ID>",
        "firstName": "Rafid",
        "lastName": "Bapi"
      },
      "booking": {
        "id": "<BOOKING_ID>",
        "serviceId": "<SERVICE_ID>",
        "serviceProviderId": "<PROVIDER_ID>",
        "service": { "id": "<SERVICE_ID>", "name": "Haircut" }
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### 3.2 Rating summary

- **Method:** `GET`
- **Path:** `/review/summary`
- **Auth:** JWT required
- **Business context:** `x-business-id` header required

**Response**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Review summary fetched successfully",
  "timestamp": "2026-04-17T10:00:00.000Z",
  "data": {
    "businessId": "<BUSINESS_ID>",
    "total": 42,
    "average": 4.38,
    "distribution": {
      "1": 1,
      "2": 2,
      "3": 3,
      "4": 12,
      "5": 24
    }
  }
}
```

`average` is a plain number (not weighted) rounded to 2 decimals. `total` and `distribution` exclude soft-deleted reviews.

---

## 4) Reviews in `GET /user/my-bookings`

The existing customer "My Bookings" endpoint now includes the review inline on each booking, so the UI can render the stars/comment without a second request.

### Relevant changes

- `business` now also returns `logo` and `image`.
- `service` now also returns `description`.
- `serviceProvider` now also returns `impUrl` (provider avatar/image).
- **NEW:** `review` — either an object or `null`.

### Example response (abridged)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User bookings fetched successfully",
  "timestamp": "2026-04-17T10:00:00.000Z",
  "data": [
    {
      "id": "<BOOKING_ID>",
      "status": "Completed",
      "bookingTime": {
        "start": "2026-04-10T10:00:00Z",
        "end": "2026-04-10T10:30:00Z"
      },
      "business": {
        "id": "<BUSINESS_ID>",
        "name": "Cuebites Salon",
        "slug": "cuebites-salon",
        "logo": "/uploads/businesses/logo-123.png",
        "image": "/uploads/businesses/cover-123.jpg"
      },
      "service": {
        "id": "<SERVICE_ID>",
        "name": "Haircut",
        "price": "45.00",
        "description": "Includes wash and styling."
      },
      "serviceProvider": {
        "id": "<PROVIDER_ID>",
        "impUrl": "/uploads/providers/avatar-42.png",
        "user": { "firstName": "Sara", "lastName": "Khan" }
      },
      "review": {
        "id": "<REVIEW_ID>",
        "rating": 5,
        "comment": "Great service!",
        "createdAt": "2026-04-17T10:00:00.000Z",
        "updatedAt": "2026-04-17T10:00:00.000Z"
      }
    },
    {
      "id": "<ANOTHER_BOOKING_ID>",
      "status": "Pending",
      "review": null,
      "...": "..."
    }
  ]
}
```

### Frontend logic

- Show the "Leave a review" button only when `booking.status === 'Completed' && booking.review === null`.
- Show the submitted rating + comment when `booking.review` is non-null.
- On edit/delete, call the endpoints in §2.3 / §2.4 and then refetch `/user/my-bookings` (or patch the list client-side).

---

## 5) Error reference

| Status | Meaning                                                                 |
| ------ | ----------------------------------------------------------------------- |
| 400    | Validation error, booking not `Completed`, or review already exists     |
| 401    | Missing/invalid JWT                                                     |
| 403    | Booking or review does not belong to the current user                   |
| 404    | Booking or review not found                                             |

---

## 6) Migration

A new Prisma migration `20260417000000_add_reviews` creates the `reviews` table and its indexes (`booking_id` unique, `business_id`, `user_id`). Run:

```bash
npx prisma migrate deploy
```

No backfill is required — all existing bookings start with `review: null`.
