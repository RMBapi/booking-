# Image Upload & Business Image Fields — Frontend Integration Guide

This guide explains how image upload works, how to use uploaded images when creating/updating a business, and the full journey from file selection to displaying the image.

---

## Overview

There are two image fields on a Business:

| Field   | Purpose                          |
|---------|----------------------------------|
| `logo`  | Business logo (small, branding)  |
| `image` | Business cover/banner image      |

Both fields support **two ways** to set an image:

1. **Upload a file** via `POST /upload/image` → get back a URL → use that URL in business create/update.
2. **Provide an external URL** directly (e.g. `"https://example.com/photo.jpg"`).

---

## Full Journey: Upload to Display

```
┌──────────┐     POST /upload/image      ┌──────────┐
│ Frontend │  ───── (file binary) ─────> │  Server  │
│          │                              │          │
│          │  <── { url: "/uploads/..." } │          │  Saves file to disk
└──────────┘                              └──────────┘
     │
     │  Now use that URL in business create/update
     │
     ▼
┌──────────┐   POST /business             ┌──────────┐
│ Frontend │  ── { logo, image } ───────> │  Server  │
│          │                              │          │
│          │  <── full business object    │          │  Stores URLs in DB
└──────────┘                              └──────────┘
     │
     │  Display the image on your page
     │
     ▼
┌──────────┐   GET image                  ┌──────────┐
│ Frontend │  ── <img src="..."> ───────> │  Server  │
│  (HTML)  │                              │ (static) │  Serves file
└──────────┘                              └──────────┘
```

**Step by step:**

1. User picks a file in the browser.
2. Frontend sends the file to `POST /upload/image` as `multipart/form-data`.
3. Server validates the file (type, size), saves it with a unique name, and returns the URL.
4. Frontend takes the returned URL and includes it in the `POST /business` or `PATCH /business/:id` request body as `logo` or `image`.
5. Server saves the URL string in the database.
6. When displaying, frontend fetches the business data via `GET /business/:id` and uses the `logo` / `image` fields as `<img src="...">`.

---

## API Reference

### 1. Upload an Image

**Endpoint:** `POST /upload/image`

**Authentication:** Required (JWT Bearer token)

**Content-Type:** `multipart/form-data`

**Constraints:**
- Allowed file types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/svg+xml`
- Max file size: 5 MB

#### Request (Frontend Code Example)

```javascript
// Using fetch API
const fileInput = document.getElementById('fileInput'); // <input type="file">
const file = fileInput.files[0];

const formData = new FormData();
formData.append('file', file);  // field name MUST be "file"

const response = await fetch('http://localhost:3000/upload/image', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <your-jwt-token>',
    // Do NOT set Content-Type header — browser sets it automatically with boundary
  },
  body: formData,
});

const result = await response.json();
console.log(result.data.url); // "/uploads/a1b2c3d4-e5f6-7890-abcd-ef1234567890.png"
```

```javascript
// Using axios
const formData = new FormData();
formData.append('file', file);

const { data } = await axios.post('/upload/image', formData, {
  headers: {
    'Authorization': 'Bearer <your-jwt-token>',
  },
});

console.log(data.data.url); // "/uploads/a1b2c3d4-e5f6-7890-abcd-ef1234567890.png"
```

#### Response — Success (201)

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Image uploaded successfully",
  "timestamp": "2026-04-11T10:30:00.000Z",
  "data": {
    "url": "/uploads/a1b2c3d4-e5f6-7890-abcd-ef1234567890.png"
  }
}
```

#### Response — Invalid File Type (400)

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid file type: application/pdf. Allowed types: image/jpeg, image/png, image/webp, image/gif, image/svg+xml",
  "timestamp": "2026-04-11T10:30:00.000Z"
}
```

#### Response — File Too Large (400)

```json
{
  "success": false,
  "statusCode": 400,
  "message": "File too large: 8.50MB. Max size: 5.00MB",
  "timestamp": "2026-04-11T10:30:00.000Z"
}
```

#### Response — No File Provided (400)

```json
{
  "success": false,
  "statusCode": 400,
  "message": "No file provided",
  "timestamp": "2026-04-11T10:30:00.000Z"
}
```

#### Response — Unauthorized (401)

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Unauthorized",
  "timestamp": "2026-04-11T10:30:00.000Z"
}
```

---

### 2. Create a Business (with images)

**Endpoint:** `POST /business`

**Authentication:** Required (JWT Bearer token)

**Content-Type:** `application/json`

#### Request Body

```json
{
  "name": "Acme Corporation",
  "description": "A leading provider of services",
  "slug": "acme-corporation",
  "logo": "/uploads/a1b2c3d4-e5f6-7890-abcd-ef1234567890.png",
  "image": "/uploads/f9e8d7c6-b5a4-3210-fedc-ba0987654321.jpg",
  "email": "contact@acme.com",
  "phone": "+1234567890",
  "address": "123 Main St, City, State 12345"
}
```

> **Note:** `logo` and `image` can be:
> - A path returned from `POST /upload/image` (e.g. `"/uploads/abc123.png"`)
> - An external URL (e.g. `"https://example.com/logo.png"`)
> - Omitted entirely (both are optional)

#### Response — Success (201)

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Business created successfully",
  "timestamp": "2026-04-11T10:35:00.000Z",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Acme Corporation",
    "description": "A leading provider of services",
    "slug": "acme-corporation",
    "logo": "/uploads/a1b2c3d4-e5f6-7890-abcd-ef1234567890.png",
    "image": "/uploads/f9e8d7c6-b5a4-3210-fedc-ba0987654321.jpg",
    "email": "contact@acme.com",
    "phone": "+1234567890",
    "address": "123 Main St, City, State 12345",
    "createdAt": "2026-04-11T10:35:00.000Z",
    "updatedAt": "2026-04-11T10:35:00.000Z"
  }
}
```

---

### 3. Update a Business (change images)

**Endpoint:** `PATCH /business/:id`

**Authentication:** Required (JWT Bearer token)

**Content-Type:** `application/json`

You can update just the image fields without touching other fields:

#### Request Body (partial update)

```json
{
  "logo": "/uploads/new-logo-uuid.png",
  "image": "/uploads/new-cover-image-uuid.jpg"
}
```

#### Response — Success (200)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Business updated successfully",
  "timestamp": "2026-04-11T11:00:00.000Z",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Acme Corporation",
    "description": "A leading provider of services",
    "slug": "acme-corporation",
    "logo": "/uploads/new-logo-uuid.png",
    "image": "/uploads/new-cover-image-uuid.jpg",
    "email": "contact@acme.com",
    "phone": "+1234567890",
    "address": "123 Main St, City, State 12345",
    "createdAt": "2026-04-11T10:35:00.000Z",
    "updatedAt": "2026-04-11T11:00:00.000Z"
  }
}
```

---

### 4. Get a Business (read images)

**Endpoint:** `GET /business/:id` or `GET /business/slug/:slug`

#### Response

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Business fetched successfully",
  "timestamp": "2026-04-11T11:05:00.000Z",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Acme Corporation",
    "description": "A leading provider of services",
    "slug": "acme-corporation",
    "logo": "/uploads/a1b2c3d4-e5f6-7890-abcd-ef1234567890.png",
    "image": "/uploads/f9e8d7c6-b5a4-3210-fedc-ba0987654321.jpg",
    "email": "contact@acme.com",
    "phone": "+1234567890",
    "address": "123 Main St, City, State 12345",
    "createdAt": "2026-04-11T10:35:00.000Z",
    "updatedAt": "2026-04-11T10:35:00.000Z"
  }
}
```

---

## Displaying Images in Frontend

### Building the full image URL

If the image value starts with `/uploads/`, it is a local upload — prepend your API base URL:

```javascript
const API_BASE = 'http://localhost:3000'; // or your production URL

function getImageUrl(value) {
  if (!value) return null;
  // External URL — use as-is
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  // Local upload — prepend API base
  return `${API_BASE}${value}`;
}
```

### React example

```jsx
function BusinessCard({ business }) {
  const logoSrc = getImageUrl(business.logo);
  const coverSrc = getImageUrl(business.image);

  return (
    <div className="business-card">
      {coverSrc && (
        <img
          src={coverSrc}
          alt={`${business.name} cover`}
          className="cover-image"
        />
      )}
      <div className="business-info">
        {logoSrc && (
          <img
            src={logoSrc}
            alt={`${business.name} logo`}
            className="logo"
          />
        )}
        <h2>{business.name}</h2>
        <p>{business.description}</p>
      </div>
    </div>
  );
}
```

### Full upload + create flow (React example)

```jsx
async function handleCreateBusiness(formValues, logoFile, coverFile) {
  const token = getAuthToken();
  const headers = { 'Authorization': `Bearer ${token}` };

  // Step 1: Upload logo if a file was selected
  let logo = formValues.logo; // might be an external URL typed by user
  if (logoFile) {
    const formData = new FormData();
    formData.append('file', logoFile);
    const uploadRes = await fetch('/upload/image', {
      method: 'POST',
      headers,
      body: formData,
    });
    const uploadData = await uploadRes.json();
    logo = uploadData.data.url; // e.g. "/uploads/abc.png"
  }

  // Step 2: Upload cover image if a file was selected
  let image = formValues.image;
  if (coverFile) {
    const formData = new FormData();
    formData.append('file', coverFile);
    const uploadRes = await fetch('/upload/image', {
      method: 'POST',
      headers,
      body: formData,
    });
    const uploadData = await uploadRes.json();
    image = uploadData.data.url;
  }

  // Step 3: Create the business with the image URLs
  const createRes = await fetch('/business', {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: formValues.name,
      description: formValues.description,
      logo,
      image,
      email: formValues.email,
      phone: formValues.phone,
      address: formValues.address,
    }),
  });

  return await createRes.json();
}
```

---

## Important Notes for Frontend

1. **Upload field name must be `file`** — the server expects `formData.append('file', ...)`.
2. **Do NOT set `Content-Type` header** when uploading — let the browser set `multipart/form-data` with the correct boundary automatically.
3. **Both `logo` and `image` are nullable** — they can be `null` in responses if no image was set.
4. **Upload requires authentication** — the user must be logged in to upload files.
5. **Max file size is 5 MB** — show a client-side validation message if the file exceeds this.
6. **Accepted formats:** JPEG, PNG, WebP, GIF, SVG.
7. **The upload endpoint is separate from the business endpoint** — upload first, then use the returned URL. You cannot send a file directly in the business create/update request.
8. **Field renamed:** The old `logoUrl` field is now `logo`. If your frontend was using `logoUrl`, update it to `logo`.
