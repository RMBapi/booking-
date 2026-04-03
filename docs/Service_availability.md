# Service Availability (Scheduler) — Frontend Integration Guide

This backend models “service availability” via a **Scheduler** record per service (`Scheduler.canScheduleTime`).

It controls:

- **Time format** (`"12"` or `"24"`)
- **Weekly availability** (Sunday → Saturday: `startTime`, `endTime`, `isOff`)
- **Interval** between slots (`intervalMinutes`)
- **Capacity** per slot (`bookingsPerSlot`)
- **Day off** (set `isOff: true` for that weekday)
- **Breaks / blocked times** inside a working day (`blockedTimes`)

---

## 1) How it works (with example)

### Concept

For each service, a scheduler config defines when and how slots are generated.

When the frontend requests available booking times using:

- `GET /scheduler/available-slots?serviceId=...&date=YYYY-MM-DD&businessSlug=...`

the backend:

1. Loads the service + scheduler config.
2. Determines the weekday of `date` (e.g. `monday`).
3. Reads the day schedule from config, e.g. `config.monday`.
   - If the day schedule is missing **or** `isOff === true` → returns no slots.
4. If `timeSlotConfig.allowUserSelection === false` → returns no slots.
5. Generates slots from `startTime` to `endTime` stepping by `intervalMinutes`.
6. Removes slots that overlap any `blockedTimes[weekday]`.
7. Computes slot availability based on existing bookings:
   - **Capacity per slot** = `max(1, bookingsPerSlot)`
   - If a service is configured to let customers choose providers, capacity may be evaluated per provider.

### Example configuration

- Time format: `"12"`
- Weekly availability:
  - Mon–Fri: 10:00–18:00
  - Sat: 10:00–14:00
  - Sun: off
- Interval: 30 minutes
- Capacity: 2 bookings per slot
- Blocked times:
  - Monday: 13:00–14:00 (lunch)

---

## 2) URL paths to configure service availability (with examples)

These endpoints are **protected** (JWT required) and also require a business context header.

### Required headers for configuration endpoints

- `Authorization: Bearer <accessToken>`
- `x-business-id: <businessId>`

Where `businessId` typically comes from a business-owner flow (e.g. `GET /business/my-businesses`).

### 2.1 Create scheduler for a service

- **Method:** `POST`
- **Path:** `/scheduler`
- **Full URL (local):** `http://localhost:3000/scheduler`

**Example**

```bash
curl -X POST "http://localhost:3000/scheduler" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "x-business-id: <BUSINESS_ID>" \
  -d '{
    "serviceId": "<SERVICE_ID>",
    "canScheduleTime": {
      "timeFormat": "12",
      "sunday": { "isOff": true },
      "monday": { "startTime": "10:00", "endTime": "18:00", "isOff": false },
      "tuesday": { "startTime": "10:00", "endTime": "18:00", "isOff": false },
      "wednesday": { "startTime": "10:00", "endTime": "18:00", "isOff": false },
      "thursday": { "startTime": "10:00", "endTime": "18:00", "isOff": false },
      "friday": { "startTime": "10:00", "endTime": "18:00", "isOff": false },
      "saturday": { "startTime": "10:00", "endTime": "14:00", "isOff": false },
      "blockedTimes": {
        "monday": [
          { "startTime": "13:00", "endTime": "14:00" }
        ]
      },
      "timeSlotConfig": {
        "intervalMinutes": 30,
        "allowUserSelection": true,
        "bookingsPerSlot": 2
      }
    }
  }'
```

**Common responses**

- `201 Created`: scheduler created
- `400 Bad Request`: scheduler already exists for this service (use the update endpoint instead)
- `403 Forbidden`: authenticated user is not linked to the business that owns the service
- `404 Not Found`: service not found for the provided business

### 2.2 Get scheduler for a service

- **Method:** `GET`
- **Path:** `/scheduler/service/:serviceId`

**Example**

```bash
curl "http://localhost:3000/scheduler/service/<SERVICE_ID>" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "x-business-id: <BUSINESS_ID>"
```

**Common responses**

- `200 OK`: scheduler returned
- `403 Forbidden`: authenticated user is not linked to the business
- `404 Not Found`: scheduler not found for this service

### 2.3 Update scheduler for a service

- **Method:** `PATCH`
- **Path:** `/scheduler/service/:serviceId`

**Important:** In practice, treat updates as “send the full `canScheduleTime` object”, because the backend stores the config as JSON.

**Example**

```bash
curl -X PATCH "http://localhost:3000/scheduler/service/<SERVICE_ID>" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "x-business-id: <BUSINESS_ID>" \
  -d '{
    "canScheduleTime": {
      "timeFormat": "24",
      "monday": { "startTime": "09:00", "endTime": "17:00", "isOff": false },
      "tuesday": { "startTime": "09:00", "endTime": "17:00", "isOff": false },
      "wednesday": { "startTime": "09:00", "endTime": "17:00", "isOff": false },
      "thursday": { "startTime": "09:00", "endTime": "17:00", "isOff": false },
      "friday": { "startTime": "09:00", "endTime": "17:00", "isOff": false },
      "saturday": { "isOff": true },
      "sunday": { "isOff": true },
      "blockedTimes": {
        "wednesday": [
          { "startTime": "12:00", "endTime": "13:00" }
        ]
      },
      "timeSlotConfig": {
        "intervalMinutes": 15,
        "allowUserSelection": true,
        "bookingsPerSlot": 1
      }
    }
  }'
```

**Common responses**

- `200 OK`: scheduler updated
- `403 Forbidden`: authenticated user is not linked to the business
- `404 Not Found`: scheduler not found for this service

### 2.4 Delete scheduler for a service

- **Method:** `DELETE`
- **Path:** `/scheduler/service/:serviceId`

---

## 3) Data the frontend must send and will receive

### 3.1 Create request body

```ts
type CreateSchedulerRequest = {
  serviceId: string;
  canScheduleTime: {
    timeFormat: '12' | '24';

    // weekly availability (any of these keys may be provided)
    sunday?: { startTime?: string; endTime?: string; isOff?: boolean };
    monday?: { startTime?: string; endTime?: string; isOff?: boolean };
    tuesday?: { startTime?: string; endTime?: string; isOff?: boolean };
    wednesday?: { startTime?: string; endTime?: string; isOff?: boolean };
    thursday?: { startTime?: string; endTime?: string; isOff?: boolean };
    friday?: { startTime?: string; endTime?: string; isOff?: boolean };
    saturday?: { startTime?: string; endTime?: string; isOff?: boolean };

    // breaks during the day (keys must be lowercase day names)
    blockedTimes?: Record<
      | 'sunday'
      | 'monday'
      | 'tuesday'
      | 'wednesday'
      | 'thursday'
      | 'friday'
      | 'saturday',
      Array<{ startTime: string; endTime: string }>
    >;

    timeSlotConfig: {
      intervalMinutes: number; // e.g. 15, 30, 60
      allowUserSelection: boolean; // if false, booking UI should not show slots
      bookingsPerSlot: number; // capacity per slot (min 1)
    };
  };
};
```

**Field notes**

- `startTime` / `endTime` are strings in `HH:mm` format (e.g. `"10:00"`).
- `isOff: true` means “day off” (no slots generated for that weekday).
- `intervalMinutes` controls slot length/step.
- `bookingsPerSlot` is the **slot capacity**.

### 3.2 Create/Update success response

The controller wraps results in the standard API envelope:

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Scheduler created successfully",
  "timestamp": "2026-04-01T12:00:00.000Z",
  "data": {
    "id": "<SCHEDULER_ID>",
    "serviceId": "<SERVICE_ID>",
    "canScheduleTime": {
      "timeFormat": "12",
      "monday": { "startTime": "10:00", "endTime": "18:00", "isOff": false },
      "timeSlotConfig": {
        "intervalMinutes": 30,
        "allowUserSelection": true,
        "bookingsPerSlot": 2
      }
    }
  }
}
```

### 3.3 “Available slots” response (what the config produces)

This endpoint is **public** (no JWT) and is what the booking UI uses.

- **Method:** `GET`
- **Path:** `/scheduler/available-slots`
- **Query:** `serviceId` (required), `date` (optional), `businessSlug` (optional, but required if `x-business-id` header isn’t provided)

Example:

```bash
curl "http://localhost:3000/scheduler/available-slots?serviceId=<SERVICE_ID>&date=2026-04-10&businessSlug=<BUSINESS_SLUG>"
```

**Timezone note**

- Slot `start`/`end` are returned as ISO 8601 strings like `2026-04-10T10:00:00.000Z`.
- Frontend should render these in the correct timezone for the business/UI.

You’ll receive (shape varies depending on provider flow):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Available slots fetched successfully",
  "timestamp": "2026-04-01T12:00:00.000Z",
  "data": {
    "date": "2026-04-10",
    "timeFormat": "12",
    "showProvider": false,
    "capacityScope": "service",
    "providers": [],
    "slots": [
      {
        "start": "2026-04-10T10:00:00.000Z",
        "end": "2026-04-10T10:30:00.000Z",
        "status": "free",
        "available": true,
        "bookedCount": 0,
        "capacity": 2
      }
    ],
    "availableSlots": [
      {
        "start": "2026-04-10T10:00:00.000Z",
        "end": "2026-04-10T10:30:00.000Z",
        "status": "free",
        "available": true,
        "bookedCount": 0,
        "capacity": 2
      }
    ]
  }
}
```

---

## Common pitfalls (frontend)

- **Missing `x-business-id`** on create/update/get scheduler → the backend can’t validate service ownership.
- **Blocked times keys must be lowercase** (`"monday"`, not `"Monday"`).
- If `allowUserSelection` is `false`, the booking UI should not expect time slots.
- If a day is missing from the config or has `isOff: true`, the booking UI will receive empty slots for that date.
