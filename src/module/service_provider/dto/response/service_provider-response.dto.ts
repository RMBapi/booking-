import { Exclude, Expose, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Exclude()
export class ServiceProviderResponseDto {
  @Expose()
  @ApiProperty({
    description: 'The id of the service provider',
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
  @ApiProperty({
    description: 'The user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @Expose()
  @Transform(({ obj }: { obj: any }) => obj.user?.firstName ?? null)
  @ApiPropertyOptional({
    description: 'The first name of the provider (from user)',
    example: 'Jane',
    nullable: true,
  })
  firstName: string | null;

  @Expose()
  @Transform(({ obj }: { obj: any }) => obj.user?.lastName ?? null)
  @ApiPropertyOptional({
    description: 'The last name of the provider (from user)',
    example: 'Doe',
    nullable: true,
  })
  lastName: string | null;

  @Expose()
  @Transform(({ obj }: { obj: any }) => {
    const f = obj.user?.firstName ?? '';
    const l = obj.user?.lastName ?? '';
    const full = `${f} ${l}`.trim();
    return full.length > 0 ? full : null;
  })
  @ApiPropertyOptional({
    description: 'The full name of the provider (firstName + lastName)',
    example: 'Jane Doe',
    nullable: true,
  })
  name: string | null;

  @Expose()
  @Transform(({ obj }: { obj: any }) => obj.user?.email ?? null)
  @ApiPropertyOptional({
    description: 'The email of the provider (from user)',
    example: 'jane.doe@example.com',
    nullable: true,
  })
  email: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'The description of the service provider',
    example: 'Experienced professional',
    nullable: true,
  })
  description: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'The image URL of the service provider',
    example: 'https://example.com/image.png',
    nullable: true,
  })
  impUrl: string | null;

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
