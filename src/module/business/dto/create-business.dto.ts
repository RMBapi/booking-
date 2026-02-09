import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsEmail } from 'class-validator';

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
    description: 'The unique slug of the business (auto-generated from name if not provided)',
    example: 'acme-corporation',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Slug must be a string' })
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({
    description: 'The logo URL of the business',
    example: 'https://example.com/logo.png',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Logo URL must be a string' })
  @IsOptional()
  logoUrl?: string;

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
}
