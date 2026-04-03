import { Exclude, Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceStatus } from '../../../../types/enums';

class ServiceProviderProfileDto {
  @ApiProperty({
    description: 'The service provider ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'The provider user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'Provider first name',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'Provider last name',
    example: 'Doe',
  })
  lastName: string;

  @ApiPropertyOptional({
    description: 'Provider profile description',
    example: 'Senior stylist',
    nullable: true,
  })
  description?: string | null;

  @ApiPropertyOptional({
    description: 'Provider image URL',
    example: 'https://example.com/provider.png',
    nullable: true,
  })
  impUrl?: string | null;
}

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
    example: 50.0,
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
    description: 'Whether customers can choose providers for this service',
    example: false,
  })
  allowCustomerChooseProvider: boolean;

  @Expose()
  @ApiProperty({
    description: 'Whether provider selection should be shown in booking flow',
    example: true,
  })
  showProvider: boolean;

  @Expose()
  @ApiPropertyOptional({
    description: 'Provider profiles attached to this service',
    type: [ServiceProviderProfileDto],
    nullable: true,
  })
  providers?: ServiceProviderProfileDto[];

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
