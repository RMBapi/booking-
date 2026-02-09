import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
} from 'class-validator';
import { BookingStatus, ConfirmationMethod, BookingSource } from '../../../types/enums';

export class CreateBookingDto {
  @ApiPropertyOptional({
    description: 'The user ID (auto-filled from token if not provided)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString({ message: 'User ID must be a string' })
  @IsOptional()
  userId?: string;

  @ApiProperty({
    description: 'The service ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString({ message: 'Service ID must be a string' })
  @IsNotEmpty({ message: 'Service ID is required' })
  serviceId: string;

  @ApiProperty({
    description: 'The service provider ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString({ message: 'Service provider ID must be a string' })
  @IsNotEmpty({ message: 'Service provider ID is required' })
  serviceProviderId: string;

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
  @IsEnum(ConfirmationMethod, { message: 'Confirmation method must be a valid ConfirmationMethod' })
  @IsNotEmpty({ message: 'Confirmation method is required' })
  confirmationMethod: ConfirmationMethod;

  @ApiProperty({
    description: 'The booking source',
    enum: BookingSource,
    example: BookingSource.Website,
  })
  @IsEnum(BookingSource, { message: 'Booking source must be a valid BookingSource' })
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
