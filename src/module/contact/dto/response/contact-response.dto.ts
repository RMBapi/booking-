import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Exclude()
export class ContactServiceBriefDto {
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
export class ContactResponseDto {
  @Expose()
  @ApiProperty({
    description: 'The id of the contact',
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
    description: 'The service ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  serviceId: string;

  @Expose()
  @Type(() => ContactServiceBriefDto)
  @ApiProperty({ type: ContactServiceBriefDto })
  service: ContactServiceBriefDto;

  @Expose()
  @ApiProperty({
    description: 'The first name of the contact',
    example: 'John',
  })
  firstName: string;

  @Expose()
  @ApiProperty({
    description: 'The last name of the contact',
    example: 'Doe',
  })
  lastName: string;

  @Expose()
  @ApiProperty({
    description: 'The email of the contact',
    example: 'john.doe@example.com',
  })
  email: string;

  @Expose()
  @ApiProperty({
    description: 'The phone number of the contact',
    example: '+1234567890',
  })
  phone: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'The booking time in JSON format',
    example: { start: '2025-11-19T10:00:00Z', end: '2025-11-19T11:00:00Z' },
    nullable: true,
  })
  bookingTime: any;

  @Expose()
  @ApiPropertyOptional({
    description: 'Additional notes about the contact',
    example: 'Prefers morning appointments',
    nullable: true,
  })
  notes: string | null;

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
}
