import { Exclude, Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Exclude()
export class ReviewResponseDto {
  @Expose()
  @ApiProperty({
    description: 'Review ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @Expose()
  @ApiProperty({
    description: 'Booking ID this review belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  bookingId: string;

  @Expose()
  @ApiProperty({
    description: 'User ID who left the review',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @Expose()
  @ApiProperty({
    description: 'Business ID the review is about',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  businessId: string;

  @Expose()
  @ApiProperty({
    description: 'Rating (1-5)',
    example: 5,
  })
  rating: number;

  @Expose()
  @ApiPropertyOptional({
    description: 'Optional review comment',
    example: 'Great service!',
    nullable: true,
  })
  comment: string | null;

  @Expose()
  @ApiProperty({
    description: 'Created timestamp',
    example: '2026-04-17T10:00:00.000Z',
  })
  createdAt: Date;

  @Expose()
  @ApiProperty({
    description: 'Updated timestamp',
    example: '2026-04-17T10:00:00.000Z',
  })
  updatedAt: Date;
}
