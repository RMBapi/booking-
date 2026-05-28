import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class UploadService implements OnModuleInit {
  private readonly logger = new Logger(UploadService.name);
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'video/mp4',
  ];

  private supabase!: SupabaseClient;
  private bucket!: string;

  constructor() {
    this.maxFileSize = parseInt(process.env.UPLOAD_MAX_SIZE || '20971520', 10); // 20MB default
  }

  onModuleInit(): void {
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.bucket = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';

    if (!url || !serviceKey) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for uploads',
      );
    }

    this.supabase = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    this.logger.log(`Supabase Storage ready (bucket: ${this.bucket})`);
  }

  validateFile(file: Express.Multer.File): void {
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Allowed types: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max size: ${(this.maxFileSize / 1024 / 1024).toFixed(2)}MB`,
      );
    }
  }

  async saveFile(file: Express.Multer.File): Promise<string> {
    this.validateFile(file);

    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const objectKey = `${crypto.randomUUID()}${ext}`;

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(objectKey, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '31536000',
        upsert: false,
      });

    if (error) {
      this.logger.error(`Supabase upload failed: ${error.message}`);
      throw new InternalServerErrorException('Failed to upload file');
    }

    const { data } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(objectKey);

    this.logger.log(
      `File uploaded: ${objectKey} (${(file.size / 1024).toFixed(1)}KB, ${file.mimetype})`,
    );

    return data.publicUrl;
  }

  async deleteFile(publicUrl: string): Promise<void> {
    const marker = `/storage/v1/object/public/${this.bucket}/`;
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) {
      this.logger.warn(
        `Not a Supabase Storage URL, skipping delete: ${publicUrl}`,
      );
      return;
    }

    const objectKey = publicUrl.slice(idx + marker.length);
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .remove([objectKey]);

    if (error) {
      this.logger.error(
        `Supabase delete failed for ${objectKey}: ${error.message}`,
      );
      return;
    }

    this.logger.log(`File deleted: ${objectKey}`);
  }
}
