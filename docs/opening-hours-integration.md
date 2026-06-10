# Opening Hours — Frontend Integration Guide

Per-business weekly opening hours. Each business stores its own schedule as **JSONB** on the `businesses` row. There is no shared/global schedule.

**Related:** [frontend-integration.md](frontend-integration.md) (auth, headers, errors).

---

## 1. Overview

| App | Read | Write |
| --- | --- | --- |
| **CRM** (settings) | `GET /business/:id` | `PATCH /business/:id` |
| **Public website** | `GET /business/slug/:slug` | — (read-only) |

- `openingHours` is **`null`** until the owner configures it in CRM.
- Times are stored in **24-hour `HH:mm`** (e.g. `"07:00"`, `"19:00"`). Format for display in the UI (AM/PM) on the client.
- When saving, send **all seven days** in one object.

---

## 2. Data shape

### TypeScript (recommended)

```typescript
type DayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

interface DayOpeningHours {
  isOpen: boolean;
  /** Required when isOpen is true. 24-hour HH:mm */
  open?: string;
  /** Required when isOpen is true. 24-hour HH:mm */
  close?: string;
}

type OpeningHours = Record<DayKey, DayOpeningHours>;
```

### Example (matches typical salon hours)

```json
{
  "monday": { "isOpen": true, "open": "07:00", "close": "18:00" },
  "tuesday": { "isOpen": true, "open": "07:00", "close": "18:00" },
  "wednesday": { "isOpen": true, "open": "07:00", "close": "18:00" },
  "thursday": { "isOpen": true, "open": "07:00", "close": "19:00" },
  "friday": { "isOpen": true, "open": "07:00", "close": "18:00" },
  "saturday": { "isOpen": false },
  "sunday": { "isOpen": false }
}
```

### UI → API mapping

| UI label | API |
| --- | --- |
| `7:00 AM – 6:00 PM` | `"open": "07:00", "close": "18:00"` |
| `7:00 AM – 7:00 PM` (Thursday) | `"open": "07:00", "close": "19:00"` |
| `Closed` | `{ "isOpen": false }` (omit `open` / `close`) |

### Validation (backend)

| Rule | Error if violated |
| --- | --- |
| All 7 days present when `openingHours` is sent | 400 validation error |
| `isOpen: true` → `open` and `close` required | 400 |
| Times must match `HH:mm` (24h), e.g. `07:00`, `19:30` | 400 |
| `isOpen: false` → do not send `open`/`close` | — |

---

## 3. CRM — Read opening hours

Load current settings when opening the business settings page.

```http
GET /business/{businessId}
Authorization: Bearer <accessToken>
X-Business-Id: {businessId}
```

**Response (wrapped):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Business fetched successfully",
  "timestamp": "2026-06-07T12:00:00.000Z",
  "data": {
    "id": "uuid",
    "name": "Eleganza Hair Salon",
    "slug": "eleganzahairsalon",
    "description": "...",
    "logo": "https://...",
    "image": null,
    "backupImage": null,
    "email": "hello@salon.com",
    "phone": "+880...",
    "address": "123 Main St",
    "openingHours": {
      "monday": { "isOpen": true, "open": "07:00", "close": "18:00" },
      "tuesday": { "isOpen": true, "open": "07:00", "close": "18:00" },
      "wednesday": { "isOpen": true, "open": "07:00", "close": "18:00" },
      "thursday": { "isOpen": true, "open": "07:00", "close": "19:00" },
      "friday": { "isOpen": true, "open": "07:00", "close": "18:00" },
      "saturday": { "isOpen": false },
      "sunday": { "isOpen": false }
    },
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Not configured yet:**

```json
"openingHours": null
```

**CRM form defaults when `null`:** e.g. Mon–Fri 09:00–17:00 open, Sat–Sun closed, or empty toggles — product choice.

---

## 4. CRM — Save opening hours

Use the existing business update endpoint. Send only `openingHours` or include other fields in the same patch.

```http
PATCH /business/{businessId}
Authorization: Bearer <accessToken>
X-Business-Id: {businessId}
Content-Type: application/json
```

**Request body:**

```json
{
  "openingHours": {
    "monday": { "isOpen": true, "open": "07:00", "close": "18:00" },
    "tuesday": { "isOpen": true, "open": "07:00", "close": "18:00" },
    "wednesday": { "isOpen": true, "open": "07:00", "close": "18:00" },
    "thursday": { "isOpen": true, "open": "07:00", "close": "19:00" },
    "friday": { "isOpen": true, "open": "07:00", "close": "18:00" },
    "saturday": { "isOpen": false },
    "sunday": { "isOpen": false }
  }
}
```

**Success response:** same shape as `GET /business/:id` with updated `openingHours` and `updatedAt`.

### Permissions

- Requires feature: **`manage_business`**
- **`Business_owner`**: always allowed (full permissions)
- **`Service_Provider`**: only if granted `manage_business` on that business
- Missing permission → **403**

### Axios example (CRM)

```typescript
import { http } from '@/lib/httpClient';

const businessId = getActiveBusinessId();

export async function getBusinessSettings(businessId: string) {
  const { data } = await http.get(`/business/${businessId}`, {
    headers: { 'X-Business-Id': businessId },
  });
  return data.data; // { openingHours, name, ... }
}

export async function saveOpeningHours(
  businessId: string,
  openingHours: OpeningHours,
) {
  const { data } = await http.patch(
    `/business/${businessId}`,
    { openingHours },
    { headers: { 'X-Business-Id': businessId } },
  );
  return data.data;
}
```

---

## 5. Public website — Display opening hours

No auth. Use the business slug from the site config (`NEXT_PUBLIC_BUSINESS_SLUG` or domain mapping).

```http
GET /business/slug/eleganzahairsalon
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Business fetched successfully",
  "data": {
    "id": "uuid",
    "name": "Eleganza Hair Salon",
    "slug": "eleganzahairsalon",
    "openingHours": { "...": "same structure as above" },
    "logo": "...",
    "phone": "...",
    "address": "..."
  }
}
```

### Display helper (12-hour format)

```typescript
const DAY_ORDER: DayKey[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const DAY_LABELS: Record<DayKey, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

function formatTime24to12(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  let h = parseInt(hStr, 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${mStr} ${suffix}`;
}

export function formatOpeningHoursRow(
  day: DayOpeningHours,
): string {
  if (!day.isOpen) return 'Closed';
  return `${formatTime24to12(day.open!)} – ${formatTime24to12(day.close!)}`;
}

// Usage in component:
// openingHours && DAY_ORDER.map(day => (
//   <Row key={day} label={DAY_LABELS[day]} value={formatOpeningHoursRow(openingHours[day])} />
// ))
```

**When `openingHours` is `null`:** hide the section or show “Hours not available”.

---

## 6. CRM settings UI checklist

Build a settings panel similar to:

```
OPENING HOURS
─────────────────────────────
MONDAY      7:00 AM – 6:00 PM   [toggle + time pickers]
TUESDAY     7:00 AM – 6:00 PM
...
SATURDAY    Closed
SUNDAY      Closed
                [ Save ]
```

| Control | Behavior |
| --- | --- |
| Day toggle | `isOpen` true/false |
| Open / Close pickers | Shown only when `isOpen`; convert to/from `HH:mm` for API |
| Save | `PATCH /business/:id` with full 7-day `openingHours` |
| Load | `GET /business/:id` on settings mount |

**On save:** validate client-side before PATCH (all days, times when open, close after open).

---

## 7. Error handling

| Status | Cause | CRM UX |
| --- | --- | --- |
| **400** | Invalid `openingHours` (missing day, bad time format) | Show field-level validation message |
| **403** | No `manage_business` permission | “You don’t have permission to edit business settings” |
| **404** | Wrong `businessId` | Redirect or error state |

**Example 400 body:**

```json
{
  "statusCode": 400,
  "message": [
    "openingHours.monday.open must be HH:mm (24-hour)",
    "openingHours.saturday.open should not be empty"
  ],
  "error": "Bad Request"
}
```

---

## 8. Optional — set hours at business creation

`openingHours` can be sent on create/onboarding (optional):

```http
POST /business/onboarding
POST /business
```

Same JSON shape as PATCH. Most apps configure hours later in settings.

---

## 9. Multi-business note

- Each business has **its own** `openingHours`.
- CRM must use the **active `businessId`** (`X-Business-Id`) when reading/writing.
- Public site reads **only its slug’s** business — no cross-tenant data.

---

## 10. Quick test plan

| # | Step | Expected |
| --- | --- | --- |
| 1 | `GET /business/:id` before config | `openingHours: null` |
| 2 | `PATCH` with full 7-day object | 200, hours persisted |
| 3 | `GET /business/:id` again | Same hours returned |
| 4 | `GET /business/slug/:slug` (public) | Same hours, no auth |
| 5 | `PATCH` with invalid time `"7:00"` | 400 |
| 6 | `PATCH` with `isOpen: true` but missing `close` | 400 |
| 7 | Switch CRM to another business | Different `openingHours` per business |

---

## 11. API summary

| Method | Path | Auth | Headers | Body field |
| --- | --- | --- | --- | --- |
| `GET` | `/business/:id` | Bearer | `X-Business-Id` | — |
| `PATCH` | `/business/:id` | Bearer + `manage_business` | `X-Business-Id` | `openingHours` |
| `GET` | `/business/slug/:slug` | Public | — | — |

---

## 12. Deploy prerequisite

Backend migration must be applied before integration:

```bash
npx prisma migrate deploy
```

Adds `businesses.opening_hours` JSONB column.
