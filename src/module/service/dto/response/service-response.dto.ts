import { Exclude, Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceStatus } from '../../../../types/enums';

@Exclude()
export class ServiceResponseDto {
  @Expose()
  @ApiProperty({
    description: 'The id of the service',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @Expose()
  @ApiProperty({
    description: 'The name of the service',
    example: 'Haircut',
  })
  name: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'The description of the service',
    example: 'Professional haircut service',
    nullable: true,
  })
  description: string | null;

  @Expose()
  @ApiProperty({
    description: 'The price of the service',
    example: 50.00,
  })
  price: number;

  @Expose()
  @ApiProperty({
    description: 'The status of the service',
    enum: ServiceStatus,
    example: ServiceStatus.Active,
  })
  status: ServiceStatus;

  @Expose()
  @ApiProperty({
    description: 'Whether to display price',
    example: true,
  })
  priceDisplayMode: boolean;

  @Expose()
  @ApiProperty({
    description: 'Whether the service is active',
    example: true,
  })
  isActive: boolean;

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
