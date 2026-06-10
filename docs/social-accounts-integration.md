# Social Accounts — Frontend Integration Guide

Per-business social media links. Each business stores its own list as a **JSONB
array** on the `businesses` row. Every entry names its `platform`, so the
frontend renders the matching icon. There is no shared/global list.

**Migration:** `add_social_accounts_to_business` (adds `businesses.social_accounts`).

**Related:** [opening-hours-integration.md](opening-hours-integration.md),
[contact-us-integration.md](contact-us-integration.md),
[frontend-integration.md](frontend-integration.md) (auth, headers, errors).

---

## 1. Overview

| App | Read | Write |
| --- | --- | --- |
| **CRM** (settings) | `GET /business/:id` | `PATCH /business/:id` |
| **Public website** | `GET /business/slug/:slug` | — (read-only) |

- `socialAccounts` is **`null`** until the owner adds links in CRM.
- It is an **array** — send the full list on every save; it **replaces** the
  stored list (it is not merged).
- Supported `platform` values today: **`facebook`**, **`instagram`**. Any other
  value is rejected with `400`.
- The frontend decides the icon from `platform`; the backend only stores
  `platform` + `url`.

---

## 2. Data shape

### TypeScript

```typescript
type SocialPlatform = 'facebook' | 'instagram';

interface SocialAccount {
  platform: SocialPlatform; // drives which icon to show
  url: string;              // public profile link
}

type SocialAccounts = SocialAccount[];
```

### Example

```json
"socialAccounts": [
  { "platform": "facebook",  "url": "https://facebook.com/eleganzahairsalon" },
  { "platform": "instagram", "url": "https://instagram.com/eleganzahairsalon" }
]
```

### UI → API mapping

| UI control | API |
| --- | --- |
| Facebook link field | `{ "platform": "facebook", "url": "https://facebook.com/…" }` |
| Instagram link field | `{ "platform": "instagram", "url": "https://instagram.com/…" }` |
| Field left blank | omit that entry from the array |
| Remove all links | send `"socialAccounts": []` |

### Validation (backend)

| Rule | Error if violated |
| --- | --- |
| `platform` must be `facebook` or `instagram` | 400 |
| `url` required, non-empty string | 400 |
| `url` ≤ 500 characters | 400 |
| `socialAccounts` must be an array (when sent) | 400 |

---

## 3. Render the icons (public site + CRM display)

```tsx
import { FaFacebook, FaInstagram } from 'react-icons/fa';

const ICONS: Record<SocialPlatform, JSX.Element> = {
  facebook: <FaFacebook />,
  instagram: <FaInstagram />,
};

export function SocialLinks({ accounts }: { accounts: SocialAccount[] | null }) {
  if (!accounts || accounts.length === 0) return null; // hide the section
  return (
    <div className="social-links">
      {accounts.map((a) => (
        <a key={a.platform} href={a.url} target="_blank" rel="noreferrer" aria-label={a.platform}>
          {ICONS[a.platform]}
        </a>
      ))}
    </div>
  );
}
```

---

## 4. CRM — Read social accounts

`socialAccounts` is included in every business response.

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
  "timestamp": "2026-06-10T12:00:00.000Z",
  "data": {
    "id": "uuid",
    "name": "Eleganza Hair Salon",
    "slug": "eleganzahairsalon",
    "openingHours": { "...": "..." },
    "socialAccounts": [
      { "platform": "facebook",  "url": "https://facebook.com/eleganzahairsalon" },
      { "platform": "instagram", "url": "https://instagram.com/eleganzahairsalon" }
    ],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Not configured yet:** `"socialAccounts": null` → hide the section.

---

## 5. CRM — Save social accounts

Use the business update endpoint. Send only `socialAccounts`, or include it
alongside other profile fields in the same patch.

```http
PATCH /business/{businessId}
Authorization: Bearer <accessToken>
X-Business-Id: {businessId}
Content-Type: application/json
```

**Request body:**

```json
{
  "socialAccounts": [
    { "platform": "facebook",  "url": "https://facebook.com/eleganzahairsalon" },
    { "platform": "instagram", "url": "https://instagram.com/eleganzahairsalon" }
  ]
}
```

**Success response:** same shape as `GET /business/:id` with the updated
`socialAccounts` and `updatedAt`.

### Permissions

- Requires feature: **`manage_business`** (same as any business profile edit).
- **`Business_owner`**: always allowed.
- **`Service_Provider`**: only if granted `manage_business` on that business.
- Missing permission → **403**.

### Axios examples (CRM)

```typescript
import { http } from '@/lib/httpClient';

export async function getBusinessSettings(businessId: string) {
  const { data } = await http.get(`/business/${businessId}`, {
    headers: { 'X-Business-Id': businessId },
  });
  return data.data; // { socialAccounts, openingHours, name, ... }
}

export async function saveSocialAccounts(
  businessId: string,
  socialAccounts: SocialAccounts,
) {
  const { data } = await http.patch(
    `/business/${businessId}`,
    { socialAccounts },
    { headers: { 'X-Business-Id': businessId } },
  );
  return data.data; // updated business
}
```

### Set at creation / onboarding (optional)

`socialAccounts` may also be sent when creating a business. Same JSON shape.

```http
POST /business
POST /business/onboarding
```

---

## 6. CRM settings UI checklist

```
SOCIAL ACCOUNTS
─────────────────────────────
[f] Facebook    https://facebook.com/eleganzahairsalon
[ig] Instagram  https://instagram.com/eleganzahairsalon
                [ Save ]
```

| Control | Behavior |
| --- | --- |
| Facebook URL field | maps to `{ platform: 'facebook', url }` |
| Instagram URL field | maps to `{ platform: 'instagram', url }` |
| Save | `PATCH /business/:id` with the full `socialAccounts` array |
| Load | `GET /business/:id` on settings mount |

**On save:** build the array from only the filled fields, then PATCH. To clear a
single platform, drop its entry from the array.

---

## 7. Public website — Display

No auth. Use the business slug from site config.

```http
GET /business/slug/eleganzahairsalon
```

`socialAccounts` is returned in `data` (same structure as §2). Map over it and
render an icon per entry using the `platform` value (see §3). When it is `null`
or empty, hide the social section.

---

## 8. Error handling

| Status | Cause | CRM UX |
| --- | --- | --- |
| **400** | Unknown `platform`, missing/too-long `url`, or `socialAccounts` not an array | Show field-level validation message |
| **403** | No `manage_business` permission | "You don't have permission to edit business settings" |
| **404** | Wrong `businessId` | Redirect or error state |

**Example 400 body:**

```json
{
  "statusCode": 400,
  "message": [
    "platform must be one of: facebook, instagram",
    "url is required"
  ],
  "error": "Bad Request"
}
```

---

## 9. API summary

| Method | Path | Auth | Headers | Body field |
| --- | --- | --- | --- | --- |
| `GET` | `/business/:id` | Bearer | `X-Business-Id` | — |
| `PATCH` | `/business/:id` | Bearer + `manage_business` | `X-Business-Id` | `socialAccounts` |
| `GET` | `/business/slug/:slug` | Public | — | — |

---

## 10. Quick test plan

| # | Step | Expected |
| --- | --- | --- |
| 1 | `GET /business/:id` before config | `socialAccounts: null` |
| 2 | `PATCH` with facebook + instagram entries | 200, links persisted |
| 3 | `GET /business/:id` again | Same array returned |
| 4 | `GET /business/slug/:slug` (public) | Same array, no auth |
| 5 | `PATCH` with `platform: "twitter"` | 400 (unsupported platform) |
| 6 | `PATCH` with `"socialAccounts": []` | 200, all links cleared |
| 7 | Switch CRM to another business | Different `socialAccounts` per business |

---

## 11. Deploy prerequisite

Apply the backend migration before integration:

```bash
npx prisma migrate deploy
```

Runs `add_social_accounts_to_business`, which adds the
`businesses.social_accounts` JSONB column.
