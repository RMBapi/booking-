# MP4 Upload — Frontend Integration Guide

This guide explains how to upload MP4 videos and use the returned URL in your business or service data.

---

## Overview

- Upload an MP4 file via `POST /upload/image` and receive a public URL.
- Store the URL in your business or service fields.
- Render the video with a `<video>` tag on the frontend.

---

## API Reference

### Upload an MP4 Video

**Endpoint:** `POST /upload/image`

**Authentication:** Required (JWT Bearer token)

**Content-Type:** `multipart/form-data`

**Constraints:**

- Allowed file type: `video/mp4`
- Max file size: 20 MB (configurable via `UPLOAD_MAX_SIZE`)

#### Request (Frontend Code Example)

```javascript
// Using fetch API
const fileInput = document.getElementById('videoInput'); // <input type="file" accept="video/mp4">
const file = fileInput.files[0];

const formData = new FormData();
formData.append('file', file); // field name MUST be "file"

const response = await fetch('http://localhost:3000/upload/image', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer <your-jwt-token>',
    // Do NOT set Content-Type header — browser sets it automatically with boundary
  },
  body: formData,
});

const result = await response.json();
console.log(result.data.url); // MP4 public URL
```

```javascript
// Using axios
const formData = new FormData();
formData.append('file', file);

const { data } = await axios.post('/upload/image', formData, {
  headers: {
    Authorization: 'Bearer <your-jwt-token>',
  },
});

console.log(data.data.url); // MP4 public URL
```

#### Response — Success (201)

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Image uploaded successfully",
  "timestamp": "2026-04-11T10:30:00.000Z",
  "data": {
    "url": "https://<project>.supabase.co/storage/v1/object/public/uploads/abc123.mp4"
  }
}
```

---

## Use the MP4 URL

Include the returned URL in your business or service payload wherever you store media URLs.

---

## Display MP4 on the Frontend

```html
<video
  controls
  preload="metadata"
  src="https://<project>.supabase.co/storage/v1/object/public/uploads/abc123.mp4"
></video>
```
