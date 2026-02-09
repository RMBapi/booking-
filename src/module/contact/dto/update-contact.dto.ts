import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsEmail } from 'class-validator';

export class UpdateContactDto {
  @ApiPropertyOptional({
    description: 'The service ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString({ message: 'Service ID must be a string' })
  @IsOptional()
  serviceId?: string;

  @ApiPropertyOptional({
    description: 'The first name of the contact',
    example: 'John',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'First name must be a string' })
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'The last name of the contact',
    example: 'Doe',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Last name must be a string' })
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'The email of the contact',
    example: 'john.doe@example.com',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'The phone number of the contact',
    example: '+1234567890',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Phone must be a string' })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'The booking time in JSON format',
    example: { start: '2025-11-19T10:00:00Z', end: '2025-11-19T11:00:00Z' },
  })
  @IsOptional()
  bookingTime?: any;

  @ApiPropertyOptional({
    description: 'Additional notes about the contact',
    example: 'Prefers morning appointments',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Notes must be a string' })
  @IsOptional()
  notes?: string;
}
