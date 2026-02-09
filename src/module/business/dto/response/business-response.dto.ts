import { Exclude, Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Exclude()
export class BusinessResponseDto {
  @Expose()
  @ApiProperty({
    description: 'The id of the business',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @Expose()
  @ApiProperty({
    description: 'The name of the business',
    example: 'Acme Corporation',
  })
  name: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'The description of the business',
    example: 'A leading provider of services',
    nullable: true,
  })
  description: string | null;

  @Expose()
  @ApiProperty({
    description: 'The unique slug of the business',
    example: 'acme-corporation',
  })
  slug: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'The logo URL of the business',
    example: 'https://example.com/logo.png',
    nullable: true,
  })
  logoUrl: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'The email of the business',
    example: 'contact@acme.com',
    nullable: true,
  })
  email: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'The phone number of the business',
    example: '+1234567890',
    nullable: true,
  })
  phone: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'The address of the business',
    example: '123 Main St, City, State 12345',
    nullable: true,
  })
  address: string | null;

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
