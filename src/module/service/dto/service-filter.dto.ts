import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsEnum, IsBoolean, ValidateIf } from 'class-validator';
import { ServiceStatus } from '../../../types/enums';

export class ServiceFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by service status. Send empty string "" for all statuses, or "Active", "Inactive", "Archived"',
    enum: ServiceStatus,
    example: ServiceStatus.Active,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    // Allow empty string for "all statuses" - convert to undefined so it's not filtered
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    return value;
  })
  @ValidateIf((o) => o.status !== undefined && o.status !== null && o.status !== '')
  @IsEnum(ServiceStatus, { message: 'Status must be a valid ServiceStatus (Active, Inactive, Archived) or empty string for all' })
  status?: ServiceStatus;

  @ApiPropertyOptional({
    description: 'Filter by active toggle state. Omit parameter for all, or send true/false',
    example: true,
  })
  @IsBoolean({ message: 'isActive must be a boolean' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    return typeof value === 'string' ? value === 'true' : value;
  })
  isActive?: boolean;
}
