# CRM Dashboard + Analytics API Support

## Auth + Business Scope
- All endpoints require `Authorization: Bearer <jwt>`.
- Send `X-Business-Id: <businessId>` on every request.
- Permissions enforced:
  - Dashboard: `view_dashboard`
  - Analytics: `view_analytics`

## Standard Response Envelope
Successful responses include:
```
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```
Errors:
```
{ "success": false, "message": "...", "error": "..." }
```

## 1) Dashboard Summary (P0)
**GET** `/dashboard/summary`

Query params:
- `timezone` (optional): IANA timezone, default `UTC`
- `includeCancelled` (optional): include cancelled in counts, default `false`

Response data:
```
{
  "today": {
    "bookingsCount": 12,
    "activeProvidersCount": 7,
    "pendingCount": 3,
    "confirmedCount": 8,
    "completedCount": 1
  },
  "comparison": {
    "bookingsVsLastWeekPercent": 12.5,
    "bookingsLastWeekSameDay": 10
  },
  "counts": {
    "activeServices": 8,
    "teamMembers": 5,
    "activeProviders": 7,
    "newCustomersLast7Days": 4
  },
  "sparkline": [
    { "date": "2026-05-23", "bookings": 4 },
    { "date": "2026-05-24", "bookings": 7 }
  ],
  "weekHeatmap": [
    { "date": "2026-05-26", "dayOfWeek": 2, "bookings": 4, "isToday": false },
    { "date": "2026-05-29", "dayOfWeek": 5, "bookings": 12, "isToday": true }
  ]
}
```

Notes:
- Counts use `bookingTime.start` in the requested timezone.
- Cancelled bookings are excluded unless `includeCancelled=true`.
- `sparkline` is last 7 days including today.
- `weekHeatmap` uses Monday-start weeks (Mon=1, Sun=7).

## 2) Analytics Summary (P0)
**GET** `/analytics/summary`

Query params:
- `range` (required): `30d | 90d | year`
- `timezone` (optional): IANA timezone, default `UTC`

Response data:
```
{
  "range": "30d",
  "from": "2026-04-29T00:00:00.000Z",
  "to": "2026-05-29T23:59:59.999Z",
  "revenue": 4250.00,
  "currency": "USD",
  "totalBookings": 86,
  "uniqueCustomers": 42,
  "avgBookingValue": 49.42,
  "completedBookings": 70,
  "cancelledBookings": 6,
  "pendingBookings": 10
}
```

Revenue rules:
- Revenue includes bookings with status `Confirmed` or `Completed`.
- Revenue uses the current `service.price` (no stored booking amount).

Customer identity:
- Distinct customers are deduped by `userId` if present, else `guestEmail`.

## 3) Analytics Time Series (P0)
**GET** `/analytics/timeseries`

Query params:
- `metric` (required): `revenue | bookings`
- `granularity` (required): `day | week | month`
- `from` (required): ISO date or datetime
- `to` (required): ISO date or datetime
- `timezone` (optional): IANA timezone, default `UTC`

Response data:
```
{
  "metric": "revenue",
  "granularity": "month",
  "points": [
    { "periodStart": "2026-01-01", "periodEnd": "2026-01-31", "value": 1200 },
    { "periodStart": "2026-02-01", "periodEnd": "2026-02-28", "value": 980 }
  ]
}
```

## 4) Analytics Breakdown (P0)
**GET** `/analytics/breakdown`

Query params:
- `groupBy` (required): `service | provider`
- `range` (required): `30d | 90d | year`
- `limit` (optional): default `5`
- `sortBy` (optional): `bookings | revenue` (default `bookings`)

Response data:
```
{
  "groupBy": "service",
  "items": [
    { "id": "uuid", "name": "Haircut", "bookingsCount": 24, "revenue": 960.00 }
  ]
}
```

Provider breakdown:
- Includes an `Unassigned` bucket for bookings without a provider.

## 5) Activity Feed (P1)
**GET** `/activity`

Query params:
- `limit` (optional): default `20`
- `cursor` (optional): ISO timestamp
- `types` (optional): comma-separated, e.g. `booking.created,booking.completed`

Response data:
```
{
  "items": [
    {
      "id": "act_123",
      "type": "booking.created",
      "occurredAt": "2026-05-29T14:02:00.000Z",
      "actor": { "id": "user-uuid", "firstName": "Sarah", "lastName": "Chen" },
      "summary": "Sarah Chen booked Haircut with John",
      "entity": { "kind": "booking", "id": "booking-uuid" },
      "metadata": { "serviceName": "Haircut", "providerName": "John Smith" }
    }
  ],
  "nextCursor": "..."
}
```

Implementation note:
- Activity is derived from current booking status (no activity log table yet).

## 6) Extend GET /booking (P1)
**GET** `/booking`

New query params:
- `startDate`: ISO date/datetime (filters `bookingTime.start >=`)
- `endDate`: ISO date/datetime (filters `bookingTime.start <=`)
- `excludeStatus`: comma-separated statuses, e.g. `Cancelled`
- `include`: comma-separated embeds: `service,serviceProvider,customer`

Example:
```
GET /booking?startDate=2026-05-01&endDate=2026-05-31&limit=100&sortBy=bookingTime&sortOrder=asc
```

Notes:
- When `include` is omitted, the existing full embeds are returned.
- When `startDate`/`endDate` are provided, filtering is applied to `bookingTime.start`.

## Open Items / Follow-ups
- Currency is fixed to `USD` until a business currency field exists.
- If you want revenue based on stored booking amounts, a `booking.amount` column is needed.
- Activity feed can be upgraded to a real audit log when required.
