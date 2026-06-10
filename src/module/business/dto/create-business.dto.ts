import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
  ValidateNested,
} from 'class-validator';
import { OpeningHoursDto } from './opening-hours.dto';
import { SocialAccountDto } from './social-accounts.dto';

export class CreateBusinessDto {
  @ApiProperty({
    description: 'The name of the business',
    example: 'Acme Corporation',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

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
    description:
      'The unique slug of the business (auto-generated from name if not provided)',
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

  @ApiPropertyOptional({ type: OpeningHoursDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => OpeningHoursDto)
  openingHours?: OpeningHoursDto;

  @ApiPropertyOptional({ type: [SocialAccountDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialAccountDto)
  socialAccounts?: SocialAccountDto[];
}
