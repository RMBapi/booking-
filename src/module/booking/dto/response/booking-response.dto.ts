import { Exclude, Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus, ConfirmationMethod, BookingSource } from '../../../../types/enums';

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
  @ApiProperty({
    description: 'The user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @Expose()
  @ApiProperty({
    description: 'The service ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  serviceId: string;

  @Expose()
  @ApiProperty({
    description: 'The service provider ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  serviceProviderId: string;

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
