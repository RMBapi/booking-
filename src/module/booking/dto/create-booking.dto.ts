import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  BookingStatus,
  ConfirmationMethod,
  BookingSource,
} from '../../../types/enums';

export class GuestBookingDto {
  @ApiProperty({ example: 'Jane' })
  @IsString({ message: 'Guest first name must be a string' })
  @IsNotEmpty({ message: 'Guest first name is required' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString({ message: 'Guest last name must be a string' })
  @IsNotEmpty({ message: 'Guest last name is required' })
  lastName: string;

  @ApiProperty({ example: 'jane@example.com' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Guest email must be a valid email' })
  email: string;

  @ApiProperty({ example: '+1234567890' })
  @IsString({ message: 'Guest phone must be a string' })
  @IsNotEmpty({ message: 'Guest phone is required' })
  phone: string;
}

export class CreateBookingDto {
  @ApiPropertyOptional({
    description:
      'The user ID. Provide either userId (registered customer) or guest (walk-in / unregistered).',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString({ message: 'User ID must be a string' })
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({
    description:
      'Guest details for an unregistered customer. Provide either userId or guest, not both.',
    type: GuestBookingDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => GuestBookingDto)
  guest?: GuestBookingDto;

  @ApiProperty({
    description: 'The service ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString({ message: 'Service ID must be a string' })
  @IsNotEmpty({ message: 'Service ID is required' })
  serviceId: string;

  @ApiPropertyOptional({
    description: 'The service provider ID (auto-selected if not provided)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString({ message: 'Service provider ID must be a string' })
  @IsOptional()
  serviceProviderId?: string;

  @ApiPropertyOptional({
    description: 'The booking time in JSON format',
    example: { start: '2025-11-19T10:00:00Z', end: '2025-11-19T11:00:00Z' },
  })
  @IsOptional()
  bookingTime?: any;

  @ApiProperty({
    description: 'The status of the booking',
    enum: BookingStatus,
    example: BookingStatus.Pending,
  })
  @IsEnum(BookingStatus, { message: 'Status must be a valid BookingStatus' })
  @IsNotEmpty({ message: 'Status is required' })
  status: BookingStatus;

  @ApiProperty({
    description: 'The confirmation method',
    enum: ConfirmationMethod,
    example: ConfirmationMethod.Email,
  })
  @IsEnum(ConfirmationMethod, {
    message: 'Confirmation method must be a valid ConfirmationMethod',
  })
  @IsNotEmpty({ message: 'Confirmation method is required' })
  confirmationMethod: ConfirmationMethod;

  @ApiProperty({
    description: 'The booking source',
    enum: BookingSource,
    example: BookingSource.Website,
  })
  @IsEnum(BookingSource, {
    message: 'Booking source must be a valid BookingSource',
  })
  @IsNotEmpty({ message: 'Booking source is required' })
  bookingSource: BookingSource;

  @ApiPropertyOptional({
    description: 'Customer notes',
    example: 'Please call before arrival',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Customer notes must be a string' })
  @IsOptional()
  customerNotes?: string;
}
