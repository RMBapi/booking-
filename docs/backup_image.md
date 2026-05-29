# Backup Image Field

## Overview

The `backup_image` field is an optional (nullable) URL for a secondary business image. It follows the same upload flow as the existing `image` and `logo` fields.

## Purpose

Use `backup_image` as a fallback when the primary `image` is missing or fails to load.

## Storage

- Database column: `businesses.backup_image`
- Prisma model field: `backupImage` (nullable)

## API

- Create/update via `backupImage` in business DTOs.
- Returned in business responses as `backupImage`.
- Response shape reference: [src/module/business/dto/response/business-response.dto.ts](src/module/business/dto/response/business-response.dto.ts)

## Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Business fetched successfully",
  "timestamp": "2026-05-29T10:00:00.000Z",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Acme Corporation",
    "slug": "acme-corporation",
    "description": null,
    "logo": "https://<project>.supabase.co/storage/v1/object/public/uploads/logo.png",
    "image": "https://<project>.supabase.co/storage/v1/object/public/uploads/primary.png",
    "backupImage": "https://<project>.supabase.co/storage/v1/object/public/uploads/backup.png",
    "email": "contact@acme.com",
    "phone": "+1234567890",
    "address": "123 Main St, City, State 12345",
    "createdAt": "2026-05-01T10:00:00.000Z",
    "updatedAt": "2026-05-20T12:00:00.000Z"
  }
}
```

## Upload Flow

1. Upload file with `POST /upload/image`.
2. Use the returned URL as the `backupImage` value.

## Notes

- No special validation beyond string URL handling.
- Treat as optional; do not require it for create or update.
