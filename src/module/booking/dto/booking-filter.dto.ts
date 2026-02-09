import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { BookingStatus } from '../../../types/enums';

export class BookingFilterDto {
  @ApiPropertyOptional({
    description: 'The status of the booking',
    enum: BookingStatus,
    example: BookingStatus.Pending,
  })
  @IsEnum(BookingStatus, { message: 'Status must be a valid BookingStatus' })
  @IsOptional()
  status?: BookingStatus;

  @ApiPropertyOptional({
    description: 'The user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString({ message: 'User ID must be a string' })
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({
    description: 'The service ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString({ message: 'Service ID must be a string' })
  @IsOptional()
  serviceId?: string;

  @ApiPropertyOptional({
    description: 'The service provider ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString({ message: 'Service provider ID must be a string' })
  @IsOptional()
  serviceProviderId?: string;
}
