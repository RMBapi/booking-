import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class ContactFilterDto {
  @ApiPropertyOptional({
    description: 'The email of the contact',
    example: 'john.doe@example.com',
  })
  @IsString({ message: 'Email must be a string' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email?: string;

  @ApiPropertyOptional({
    description: 'The phone number of the contact',
    example: '+1234567890',
  })
  @IsString({ message: 'Phone must be a string' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  phone?: string;

  @ApiPropertyOptional({
    description: 'The service ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString({ message: 'Service ID must be a string' })
  @IsOptional()
  serviceId?: string;
}
