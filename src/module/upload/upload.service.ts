import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDir: string;
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
  ];

  constructor() {
    this.uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
    this.maxFileSize = parseInt(process.env.UPLOAD_MAX_SIZE || '5242880', 10); // 5MB default

    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      this.logger.log(`Created upload directory: ${this.uploadDir}`);
    }
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

    // Generate a unique server-side filename (never use raw user paths)
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueName = `${crypto.randomUUID()}${ext}`;
    const filePath = path.join(this.uploadDir, uniqueName);

    // Write file to disk
    fs.writeFileSync(filePath, file.buffer);
    this.logger.log(
      `File saved: ${uniqueName} (${(file.size / 1024).toFixed(1)}KB, ${file.mimetype})`,
    );

    // Return the relative URL path that will be served statically
    return `/uploads/${uniqueName}`;
  }
}
