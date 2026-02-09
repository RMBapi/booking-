import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class UpdateServiceProviderDto {
  @ApiPropertyOptional({
    description: 'The service ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString({ message: 'Service ID must be a string' })
  @IsOptional()
  serviceId?: string;

  @ApiPropertyOptional({
    description: 'The user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString({ message: 'User ID must be a string' })
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({
    description: 'The description of the service provider',
    example: 'Experienced professional',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'The image URL of the service provider',
    example: 'https://example.com/image.png',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Image URL must be a string' })
  @IsOptional()
  impUrl?: string;
}
