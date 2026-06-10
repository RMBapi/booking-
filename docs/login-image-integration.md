# Login Image — Frontend Integration Guide

Per-business **login screen image**. Each business stores its own image URL on
the `businesses` row. Use it as the artwork/branding on that business's login
page. There is no shared/global value.

**Migration:** `add_login_image_to_business` (adds `businesses.login_image`).

**Related:** [opening-hours-integration.md](opening-hours-integration.md),
[social-accounts-integration.md](social-accounts-integration.md),
[frontend-integration.md](frontend-integration.md) (auth, headers, errors).

---

## 1. Overview

| App | Read | Write |
| --- | --- | --- |
| **CRM** (settings) | `GET /business/:id` | `PATCH /business/:id` |
| **Public website / login page** | `GET /business/slug/:slug` | — (read-only) |

- `loginImage` is a single **URL string**, or **`null`** until the owner sets it.
- Upload the file first via `POST /upload/image` to get a URL, then save that URL
  on the business (or paste an external URL directly).
- It behaves exactly like the existing `logo` / `image` / `backupImage` fields.

---

## 2. Data shape

```typescript
interface Business {
  // …existing fields
  logo: string | null;
  image: string | null;
  backupImage: string | null;
  loginImage: string | null; // login screen image URL
}
```

### Example

```json
"loginImage": "https://<project>.supabase.co/storage/v1/object/public/uploads/login.png"
```

### Validation (backend)

| Rule | Error if violated |
| --- | --- |
| `loginImage` must be a string (when sent) | 400 |
| Field is optional | — |

> Strings are trimmed server-side. Send `""` or omit the field to leave it
> unchanged; to clear it, send an explicit value your product treats as empty
> (e.g. set a new URL when one is chosen).

---

## 3. Upload, then save

Two steps, same as logo/image.

### Step 1 — upload the file

```http
POST /upload/image
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

Returns a public URL (see the Upload docs for the exact response shape).

### Step 2 — save the URL on the business

```http
PATCH /business/{businessId}
Authorization: Bearer <accessToken>
X-Business-Id: {businessId}
Content-Type: application/json
```

```json
{ "loginImage": "https://<project>.supabase.co/storage/v1/object/public/uploads/login.png" }
```

**Success response:** same shape as `GET /business/:id` with the updated
`loginImage` and `updatedAt`.

### Permissions

- Requires feature: **`manage_business`** (same as any business profile edit).
- **`Business_owner`**: always allowed.
- **`Service_Provider`**: only if granted `manage_business`.
- Missing permission → **403**.

---

## 4. CRM — Read

`loginImage` is included in every business response.

```http
GET /business/{businessId}
Authorization: Bearer <accessToken>
X-Business-Id: {businessId}
```

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Business fetched successfully",
  "data": {
    "id": "uuid",
    "name": "Eleganza Hair Salon",
    "slug": "eleganzahairsalon",
    "logo": "https://…/logo.png",
    "loginImage": "https://…/login.png",
    "socialAccounts": [ "…" ],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Not configured yet:** `"loginImage": null` → fall back to a default image.

---

## 5. Public website — Display on the login page

No auth. Resolve the business by slug, then use `loginImage` as the login-page
artwork.

```http
GET /business/slug/eleganzahairsalon
```

```tsx
function LoginArtwork({ business }: { business: Business }) {
  const src = business.loginImage ?? '/default-login.png';
  return <img src={src} alt={`${business.name} login`} />;
}
```

---

## 6. Axios examples

```typescript
import { http } from '@/lib/httpClient';

export async function saveLoginImage(businessId: string, loginImage: string) {
  const { data } = await http.patch(
    `/business/${businessId}`,
    { loginImage },
    { headers: { 'X-Business-Id': businessId } },
  );
  return data.data; // updated business
}
```

It can also be sent at creation/onboarding (`POST /business`,
`POST /business/onboarding`) — same field name.

---

## 7. Error handling

| Status | Cause | CRM UX |
| --- | --- | --- |
| **400** | `loginImage` is not a string | Inline validation message |
| **403** | No `manage_business` permission | "You don't have permission to edit business settings" |
| **404** | Wrong `businessId` | Redirect or error state |

---

## 8. API summary

| Method | Path | Auth | Headers | Body field |
| --- | --- | --- | --- | --- |
| `GET` | `/business/:id` | Bearer | `X-Business-Id` | — |
| `PATCH` | `/business/:id` | Bearer + `manage_business` | `X-Business-Id` | `loginImage` |
| `GET` | `/business/slug/:slug` | Public | — | — |
| `POST` | `/upload/image` | Bearer | — | file (multipart) |

---

## 9. Quick test plan

| # | Step | Expected |
| --- | --- | --- |
| 1 | `GET /business/:id` before config | `loginImage: null` |
| 2 | `POST /upload/image` | returns a URL |
| 3 | `PATCH /business/:id` with that URL | 200, `loginImage` persisted |
| 4 | `GET /business/slug/:slug` (public) | Same `loginImage`, no auth |
| 5 | `PATCH` with `loginImage: 123` | 400 (must be a string) |

---

## 10. Deploy prerequisite

```bash
npx prisma migrate deploy
```

Runs `add_login_image_to_business`, which adds the `businesses.login_image`
column.
