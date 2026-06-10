# Contact Us / Support Tickets — Frontend Integration Guide

A ticket-based Contact Us system. Every submission becomes a **ticket** with a
chat-style **conversation**. Tickets live in one of two scopes:

- **Business (tenant) tickets** — submitted from a business's public site
  (`business-slug/contact-us`), managed in that business's **Contact Center**
  inside the CRM.
- **Platform tickets** — submitted from the marketing landing page. Not tied to
  any business; only **Super Admins** can see and manage them.

**Related:** [frontend-integration.md](frontend-integration.md) (auth, headers, errors),
[opening-hours-integration.md](opening-hours-integration.md).

---

## 1. Overview

| Surface | Submit | Manage |
| --- | --- | --- |
| **Public business site** | `POST /support/tickets` | — |
| **Customer (logged in)** | `POST /support/tickets` | `GET/POST /support/my-tickets…` |
| **CRM Contact Center** | — | `…/support/admin/tickets…` |
| **Marketing landing page** | `POST /support/platform/tickets` | — |
| **Super Admin** | — | `…/support/platform/tickets…` |

- A submission creates a ticket (`status: Open`) plus the first message.
- The customer gets a confirmation email; every staff reply emails them too.
- Tenant tickets are isolated per business — a business only ever sees its own.
- Platform tickets (`businessId: null`) are visible only to Super Admins.

---

## 2. Data shape

### TypeScript

```typescript
type TicketType = 'Business' | 'Platform';

type TicketStatus =
  | 'Open'
  | 'InProgress'
  | 'WaitingForCustomer'
  | 'Resolved'
  | 'Closed';

type MessageAuthor = 'Customer' | 'Staff' | 'System';

interface TicketMessage {
  id: string;
  authorType: MessageAuthor;
  authorName: string;
  body: string;
  viaEmail: boolean;
  createdAt: string;
}

interface PersonBrief {
  id: string;
  name: string;
  email: string | null;
}

interface Ticket {
  id: string;
  ticketNumber: number;        // human-friendly, e.g. 1042
  type: TicketType;
  businessId: string | null;   // null for platform tickets
  status: TicketStatus;
  subject: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string | null;
  requesterUserId: string | null;
  assignedTo: PersonBrief | null;
  lastReplyAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Detail responses additionally include the full thread:
interface TicketDetail extends Ticket {
  messages: TicketMessage[];
}
```

All responses use the standard envelope: `{ success, statusCode, message, timestamp, data, meta? }`.

### Statuses

| Status | Meaning |
| --- | --- |
| `Open` | New / re-opened, awaiting staff |
| `InProgress` | Staff is actively working it |
| `WaitingForCustomer` | Staff replied; awaiting the customer |
| `Resolved` | Considered done |
| `Closed` | Closed; the customer cannot reply further |

**Automatic transitions:** a staff reply sets `WaitingForCustomer`; a customer
reply sets `Open`. Override manually via `PATCH`.

---

## 3. Submit a ticket (public business site)

`POST /support/tickets` — **optional auth**. The endpoint serves both states:

- **Logged out** → send `name`, `email`, `phone`, `subject`, `message` (name,
  email and phone are **all required** — so the ticket carries the same
  contactable identity a logged-in user's profile would provide).
- **Logged in** → send the `Authorization` header + only `subject`, `message`.
  The requester's name / email / phone come from their profile; any
  `name`/`email`/`phone` in the body is ignored.

Identify the business by **either**:
- `businessSlug` in the body, **or**
- the `X-Business-Id` header, **or**
- (logged-in customers) nothing — the token is already scoped to one business.

```http
POST /support/tickets
Content-Type: application/json
Authorization: Bearer <accessToken>   # only when logged in
```

**Logged-out body:**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+61400000000",
  "subject": "Booking issue",
  "message": "I was charged twice for my appointment.",
  "businessSlug": "eleganzahairsalon"
}
```

**Logged-in body:**

```json
{
  "subject": "Booking issue",
  "message": "I was charged twice for my appointment.",
  "businessSlug": "eleganzahairsalon"
}
```

**Response `201`** — the new ticket with its first message:

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Ticket created successfully",
  "timestamp": "2026-06-09T12:00:00.000Z",
  "data": {
    "id": "uuid",
    "ticketNumber": 1042,
    "type": "Business",
    "businessId": "uuid",
    "status": "Open",
    "subject": "Booking issue",
    "requesterName": "Jane Doe",
    "requesterEmail": "jane@example.com",
    "requesterPhone": "+61400000000",
    "requesterUserId": null,
    "assignedTo": null,
    "lastReplyAt": "2026-06-09T12:00:00.000Z",
    "createdAt": "2026-06-09T12:00:00.000Z",
    "updatedAt": "2026-06-09T12:00:00.000Z",
    "messages": [
      {
        "id": "uuid",
        "authorType": "Customer",
        "authorName": "Jane Doe",
        "body": "I was charged twice for my appointment.",
        "viaEmail": false,
        "createdAt": "2026-06-09T12:00:00.000Z"
      }
    ]
  }
}
```

### Axios example (public form)

```typescript
import { http } from '@/lib/httpClient';

export async function submitContactForm(input: {
  subject: string;
  message: string;
  name?: string;        // omit when logged in
  email?: string;       // omit when logged in
  phone?: string;
  businessSlug: string;
}) {
  const { data } = await http.post('/support/tickets', input);
  return data.data; // Ticket
}
```

---

## 4. Customer — track & continue your tickets (logged in)

Requires `Authorization`. No business header needed.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/support/my-tickets` | List the user's own tickets (paginated) |
| `GET` | `/support/my-tickets/:id` | One ticket + full conversation |
| `POST` | `/support/my-tickets/:id/reply` | Add a reply (re-opens the ticket) |

```http
GET /support/my-tickets?page=1&limit=10&status=WaitingForCustomer
Authorization: Bearer <accessToken>
```

**Reply body:**

```json
{ "message": "Thanks — here is the receipt you asked for." }
```

A reply to a `Closed` ticket returns **400**; prompt the user to open a new one.

> Logged-out guests continue the conversation **by email** — every staff reply
> is emailed to them, and they reply to that email.

---

## 5. CRM — Contact Center (business staff)

All endpoints require `Authorization` + the active **`X-Business-Id`** header,
and the relevant feature permission. They only ever return the active
business's tickets.

| Method | Path | Feature | Purpose |
| --- | --- | --- | --- |
| `GET` | `/support/admin/tickets` | `view_tickets` | List / filter / search |
| `GET` | `/support/admin/tickets/:id` | `view_tickets` | Detail + conversation |
| `POST` | `/support/admin/tickets/:id/reply` | `manage_tickets` | Reply (emails customer) |
| `PATCH` | `/support/admin/tickets/:id` | `manage_tickets` | Status / assignment |

### Permissions

- **`Business_owner`**: full access (always).
- **`Service_Provider`**: `view_tickets` by default; needs `manage_tickets`
  granted to reply / assign / change status.

### List, filter, search

```http
GET /support/admin/tickets?page=1&limit=20&status=Open&search=refund
X-Business-Id: {businessId}
Authorization: Bearer <accessToken>
```

| Query param | Effect |
| --- | --- |
| `page`, `limit` | Pagination |
| `status` | Filter by `TicketStatus` |
| `assignedToUserId` | Filter by assignee |
| `unassigned=true` | Only unassigned tickets |
| `search` | Matches subject, requester name/email, or message body |
| `sortBy`, `sortOrder` | e.g. `sortBy=lastReplyAt&sortOrder=desc` (default `createdAt desc`) |

Response is a paginated list (`data: Ticket[]`, plus `meta`).

### Reply

```http
POST /support/admin/tickets/{id}/reply
X-Business-Id: {businessId}
Authorization: Bearer <accessToken>
Content-Type: application/json

{ "message": "We've issued a full refund — apologies for the trouble." }
```

Appends a `Staff` message, sets status to `WaitingForCustomer`, and emails the
customer. Returns the updated `TicketDetail`.

### Update status / assign

```http
PATCH /support/admin/tickets/{id}
X-Business-Id: {businessId}
Authorization: Bearer <accessToken>
Content-Type: application/json
```

```json
{ "status": "Resolved", "assignedToUserId": "staff-user-uuid" }
```

- Both fields are optional; send either or both.
- `assignedToUserId` must be an **active member** of this business (else `400`).
- Pass `"assignedToUserId": null` to unassign.

### Axios examples (CRM)

```typescript
import { http } from '@/lib/httpClient';

const headers = (businessId: string) => ({ 'X-Business-Id': businessId });

export async function listTickets(businessId: string, params: Record<string, unknown>) {
  const { data } = await http.get('/support/admin/tickets', {
    headers: headers(businessId),
    params,
  });
  return data; // { data: Ticket[], meta }
}

export async function getTicket(businessId: string, id: string) {
  const { data } = await http.get(`/support/admin/tickets/${id}`, {
    headers: headers(businessId),
  });
  return data.data; // TicketDetail
}

export async function replyToTicket(businessId: string, id: string, message: string) {
  const { data } = await http.post(
    `/support/admin/tickets/${id}/reply`,
    { message },
    { headers: headers(businessId) },
  );
  return data.data; // TicketDetail
}

export async function updateTicket(
  businessId: string,
  id: string,
  patch: { status?: TicketStatus; assignedToUserId?: string | null },
) {
  const { data } = await http.patch(`/support/admin/tickets/${id}`, patch, {
    headers: headers(businessId),
  });
  return data.data; // TicketDetail
}
```

---

## 6. Platform tickets (marketing landing page + Super Admin)

### Submit (public landing page)

`POST /support/platform/tickets` — same body rules as §3, but **no business**.
Do **not** send `businessSlug` or `X-Business-Id`.

```http
POST /support/platform/tickets
Content-Type: application/json
```

```json
{
  "name": "Sam Buyer",
  "email": "sam@startup.com",
  "subject": "Pricing for 10 locations",
  "message": "Can we get a demo?"
}
```

Creates a ticket with `type: "Platform"`, `businessId: null`.

### Manage (Super Admin only)

Require `Authorization` for a **Super Admin**. Business owners/staff get `403`.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/support/platform/tickets` | List / filter / search |
| `GET` | `/support/platform/tickets/:id` | Detail + conversation |
| `POST` | `/support/platform/tickets/:id/reply` | Reply (emails customer) |
| `PATCH` | `/support/platform/tickets/:id` | Status / assignment |

Same query params and bodies as the CRM endpoints (§5). Assignment targets must
be Super Admins. **No `X-Business-Id` header** is used here.

---

## 7. Error handling

| Status | Cause | UX |
| --- | --- | --- |
| **400** | Missing `name`/`email`/`phone` when logged out; no business resolvable; reply to a closed ticket; invalid `status`; assignee not a business member | Field / inline validation message |
| **403** | Missing `view_tickets`/`manage_tickets`; non-admin hitting platform endpoints | "You don't have permission" |
| **404** | Ticket not in this scope (wrong business / not the requester) | Error or redirect |

**Example 400:**

```json
{
  "statusCode": 400,
  "message": "name, email and phone are required when not logged in",
  "error": "Bad Request"
}
```

---

## 8. API summary

| Method | Path | Auth | Headers | Body |
| --- | --- | --- | --- | --- |
| `POST` | `/support/tickets` | Optional | `X-Business-Id`? | subject, message, (name, email, phone — required if logged out), [businessSlug] |
| `GET` | `/support/my-tickets` | Bearer | — | — |
| `GET` | `/support/my-tickets/:id` | Bearer | — | — |
| `POST` | `/support/my-tickets/:id/reply` | Bearer | — | message |
| `GET` | `/support/admin/tickets` | Bearer + `view_tickets` | `X-Business-Id` | — |
| `GET` | `/support/admin/tickets/:id` | Bearer + `view_tickets` | `X-Business-Id` | — |
| `POST` | `/support/admin/tickets/:id/reply` | Bearer + `manage_tickets` | `X-Business-Id` | message |
| `PATCH` | `/support/admin/tickets/:id` | Bearer + `manage_tickets` | `X-Business-Id` | status?, assignedToUserId? |
| `POST` | `/support/platform/tickets` | Optional | — | subject, message, [name, email, phone] |
| `GET` | `/support/platform/tickets` | Super Admin | — | — |
| `GET` | `/support/platform/tickets/:id` | Super Admin | — | — |
| `POST` | `/support/platform/tickets/:id/reply` | Super Admin | — | message |
| `PATCH` | `/support/platform/tickets/:id` | Super Admin | — | status?, assignedToUserId? |

---

## 9. Quick test plan

| # | Step | Expected |
| --- | --- | --- |
| 1 | `POST /support/tickets` logged out (name+email+phone) with `businessSlug` | `201`, `status: Open`, confirmation email sent |
| 1b | `POST /support/tickets` logged out **without** phone | `400` (name, email and phone required) |
| 2 | `POST /support/tickets` logged in (subject+message only) | `201`, requester taken from profile |
| 3 | `GET /support/admin/tickets` (other business) | Ticket from step 1 **not** visible |
| 4 | `POST /support/admin/tickets/:id/reply` | `WaitingForCustomer`, customer emailed |
| 5 | `GET /support/my-tickets/:id` (logged-in requester) | Shows the staff reply |
| 6 | `POST /support/my-tickets/:id/reply` | `status: Open` again |
| 7 | `PATCH …/:id` `{ "status": "Resolved" }` | `Resolved` |
| 8 | `POST /support/platform/tickets` | `type: Platform`, `businessId: null` |
| 9 | `GET /support/platform/tickets` as business owner | `403` |
| 10 | `GET /support/platform/tickets` as super admin | Platform ticket visible |

---

## 10. Deploy prerequisite

Apply the backend migration before integrating:

```bash
npx prisma migrate deploy
```

Adds the `support_tickets` and `support_messages` tables and their enums
(`SupportTicketType`, `SupportTicketStatus`, `SupportMessageAuthor`).

> **Email delivery** requires `MAIL_DRIVER=resend` + `RESEND_API_KEY` in the
> backend env. Without them, emails are logged to the console (the ticket is
> still created and the conversation still works in-app).
