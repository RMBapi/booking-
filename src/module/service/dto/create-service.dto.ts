import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ServiceStatus } from '../../../types/enums';

export class CreateServiceDto {
  @ApiProperty({
    description: 'The name of the service',
    example: 'Haircut',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiPropertyOptional({
    description: 'The description of the service',
    example: 'Professional haircut service',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description:
      'Service image URL (upload via POST /upload/image or provide an external URL)',
    example:
      'https://<project>.supabase.co/storage/v1/object/public/uploads/abc123.png',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Image must be a string' })
  @IsOptional()
  image?: string;

  @ApiProperty({
    description: 'The price of the service',
    example: 50.0,
  })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? value : parsed;
    }
    return value;
  })
  @IsNumber({}, { message: 'Price must be a number' })
  @IsNotEmpty({ message: 'Price is required' })
  price: number;

  @ApiProperty({
    description: 'The status of the service',
    enum: ServiceStatus,
    example: ServiceStatus.Active,
  })
  @IsEnum(ServiceStatus, { message: 'Status must be a valid ServiceStatus' })
  @IsNotEmpty({ message: 'Status is required' })
  status: ServiceStatus;

  @ApiPropertyOptional({
    description: 'Whether to display price',
    example: true,
    default: false,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value === 'true' : value,
  )
  @IsBoolean({ message: 'Price display mode must be a boolean' })
  @IsOptional()
  priceDisplayMode?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the service is active',
    example: true,
    default: true,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value === 'true' : value,
  )
  @IsBoolean({ message: 'Is active must be a boolean' })
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Whether customers can choose a provider for this service',
    example: false,
    default: false,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value === 'true' : value,
  )
  @IsBoolean({ message: 'Allow customer choose provider must be a boolean' })
  @IsOptional()
  allowCustomerChooseProvider?: boolean;
}
