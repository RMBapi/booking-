import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BookingStatus,
  ConfirmationMethod,
  BookingSource,
} from '../../../../types/enums';

@Exclude()
export class BookingUserBriefDto {
  @Expose()
  @ApiPropertyOptional({
    description: 'Null when the booking was created for a guest customer.',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  id: string | null;

  @Expose()
  @ApiProperty({ example: 'Jane', nullable: true })
  firstName: string | null;

  @Expose()
  @ApiProperty({ example: 'Doe', nullable: true })
  lastName: string | null;

  @Expose()
  @ApiProperty({ example: 'jane@example.com' })
  email: string;

  @Expose()
  @ApiProperty({ example: '+1234567890', nullable: true })
  phone: string | null;

  @Expose()
  @ApiPropertyOptional({
    description:
      'True when this customer is a guest (no User record). Absent / false for registered customers.',
    example: false,
  })
  isGuest?: boolean;
}

@Exclude()
export class BookingServiceBriefDto {
  @Expose()
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'Haircut' })
  name: string;

  @Expose()
  @ApiProperty({ example: 50 })
  price: number;
}

@Exclude()
export class BookingServiceProviderBriefDto {
  @Expose()
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @Expose()
  @ApiPropertyOptional({ example: 'John', nullable: true })
  firstName: string | null;

  @Expose()
  @ApiPropertyOptional({ example: 'Smith', nullable: true })
  lastName: string | null;
}

@Exclude()
export class BookingResponseDto {
  @Expose()
  @ApiProperty({
    description: 'The id of the booking',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @Expose()
  @ApiProperty({
    description: 'The business ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  businessId: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'The user ID. Null for guest bookings.',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  userId: string | null;

  @Expose()
  @ApiProperty({
    description: 'The service ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  serviceId: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'The service provider ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  serviceProviderId: string | null;

  @Expose()
  @Type(() => BookingUserBriefDto)
  @ApiPropertyOptional({ type: BookingUserBriefDto, nullable: true })
  user: BookingUserBriefDto | null;

  @Expose()
  @Type(() => BookingServiceBriefDto)
  @ApiProperty({ type: BookingServiceBriefDto })
  service: BookingServiceBriefDto;

  @Expose()
  @Type(() => BookingServiceProviderBriefDto)
  @ApiPropertyOptional({ type: BookingServiceProviderBriefDto, nullable: true })
  serviceProvider: BookingServiceProviderBriefDto | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'The booking time in JSON format',
    example: { start: '2025-11-19T10:00:00Z', end: '2025-11-19T11:00:00Z' },
    nullable: true,
  })
  bookingTime: any;

  @Expose()
  @ApiProperty({
    description: 'The status of the booking',
    enum: BookingStatus,
    example: BookingStatus.Pending,
  })
  status: BookingStatus;

  @Expose()
  @ApiProperty({
    description: 'The confirmation method',
    enum: ConfirmationMethod,
    example: ConfirmationMethod.Email,
  })
  confirmationMethod: ConfirmationMethod;

  @Expose()
  @ApiProperty({
    description: 'The booking source',
    enum: BookingSource,
    example: BookingSource.Website,
  })
  bookingSource: BookingSource;

  @Expose()
  @ApiPropertyOptional({
    description: 'Customer notes',
    example: 'Please call before arrival',
    nullable: true,
  })
  customerNotes: string | null;

  @Expose()
  @ApiProperty({
    description: 'The created at timestamp',
    example: '2025-11-19T10:00:00.000Z',
  })
  createdAt: Date;

  @Expose()
  @ApiProperty({
    description: 'The updated at timestamp',
    example: '2025-11-19T10:00:00.000Z',
  })
  updatedAt: Date;

  @Expose()
  @ApiPropertyOptional({
    description: 'The cancelled at timestamp',
    example: '2025-11-19T10:00:00.000Z',
    nullable: true,
  })
  cancelledAt: Date | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'The cancellation reason',
    example: 'Customer requested cancellation',
    nullable: true,
  })
  cancellationReason: string | null;
}
