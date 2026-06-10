import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  IsEmail,
  ValidateNested,
} from 'class-validator';
import { OpeningHoursDto } from './opening-hours.dto';
import { SocialAccountDto } from './social-accounts.dto';

export class UpdateBusinessDto {
  @ApiPropertyOptional({
    description: 'The name of the business',
    example: 'Acme Corporation',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Name must be a string' })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'The description of the business',
    example: 'A leading provider of services',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'The unique slug of the business',
    example: 'acme-corporation',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Slug must be a string' })
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({
    description:
      'Business logo image URL (upload via POST /upload/image or provide an external URL)',
    example:
      'https://<project>.supabase.co/storage/v1/object/public/uploads/abc123.png',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Logo must be a string' })
  @IsOptional()
  logo?: string;

  @ApiPropertyOptional({
    description:
      'Business image URL (upload via POST /upload/image or provide an external URL)',
    example:
      'https://<project>.supabase.co/storage/v1/object/public/uploads/abc123.png',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Image must be a string' })
  @IsOptional()
  image?: string;

  @ApiPropertyOptional({
    description:
      'Business backup image URL (upload via POST /upload/image or provide an external URL)',
    example:
      'https://<project>.supabase.co/storage/v1/object/public/uploads/abc123.png',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Backup image must be a string' })
  @IsOptional()
  backupImage?: string;

  @ApiPropertyOptional({
    description:
      'Login screen image URL (upload via POST /upload/image or provide an external URL)',
    example:
      'https://<project>.supabase.co/storage/v1/object/public/uploads/login.png',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Login image must be a string' })
  @IsOptional()
  loginImage?: string;

  @ApiPropertyOptional({
    description: 'The email of the business',
    example: 'contact@acme.com',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'The phone number of the business',
    example: '+1234567890',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Phone must be a string' })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'The address of the business',
    example: '123 Main St, City, State 12345',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Address must be a string' })
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    type: OpeningHoursDto,
    description:
      'Weekly opening hours for this business. All seven days required when provided.',
    example: {
      monday: { isOpen: true, open: '07:00', close: '18:00' },
      tuesday: { isOpen: true, open: '07:00', close: '18:00' },
      wednesday: { isOpen: true, open: '07:00', close: '18:00' },
      thursday: { isOpen: true, open: '07:00', close: '19:00' },
      friday: { isOpen: true, open: '07:00', close: '18:00' },
      saturday: { isOpen: false },
      sunday: { isOpen: false },
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OpeningHoursDto)
  openingHours?: OpeningHoursDto;

  @ApiPropertyOptional({
    type: [SocialAccountDto],
    description:
      'Social account links. Replaces the stored list when provided. Each item carries a platform (icon) and url.',
    example: [
      { platform: 'facebook', url: 'https://facebook.com/eleganzahairsalon' },
      { platform: 'instagram', url: 'https://instagram.com/eleganzahairsalon' },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialAccountDto)
  socialAccounts?: SocialAccountDto[];
}
