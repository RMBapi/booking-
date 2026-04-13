import {
  Controller,
  Post,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Upload')
@ApiBearerAuth('JWT-auth')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @ApiOperation({
    summary: 'Upload an image file',
    description: `Upload an image file and get back a URL that can be used for business logo, image, or any other image field.

**Supported formats:** JPEG, PNG, WebP, GIF, SVG
**Max file size:** 5MB (configurable via UPLOAD_MAX_SIZE env var)

**Usage:** Send the file as multipart/form-data with field name \`file\`.
The returned \`url\` can then be used when creating or updating a business.`,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file to upload',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 201 },
        message: { type: 'string', example: 'Image uploaded successfully' },
        timestamp: { type: 'string', example: '2025-01-01T00:00:00.000Z' },
        data: {
          type: 'object',
          properties: {
            url: { type: 'string', example: '/uploads/abc123.png' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseInterceptors(FileInterceptor('file', { storage: undefined }))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const url = await this.uploadService.saveFile(file);

    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Image uploaded successfully',
      timestamp: new Date().toISOString(),
      data: { url },
    };
  }
}
