import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { SupportTicketStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationFilterDto } from '../../../common/dto/pagination-filter.dto';

class TicketFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: SupportTicketStatus,
  })
  @IsOptional()
  @IsEnum(SupportTicketStatus)
  status?: SupportTicketStatus;

  @ApiPropertyOptional({
    description: 'Filter by assigned staff user id',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;

  @ApiPropertyOptional({
    description: 'Filter to only unassigned tickets',
    example: 'true',
  })
  @IsOptional()
  @IsString()
  unassigned?: string;
}

export class TicketQueryDto extends IntersectionType(
  PaginationFilterDto,
  TicketFilterDto,
) {}
