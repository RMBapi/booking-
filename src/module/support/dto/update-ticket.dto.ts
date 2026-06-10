import { ApiPropertyOptional } from '@nestjs/swagger';
import { SupportTicketStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';

export class UpdateTicketDto {
  @ApiPropertyOptional({
    description: 'New ticket status',
    enum: SupportTicketStatus,
    example: SupportTicketStatus.InProgress,
  })
  @IsOptional()
  @IsEnum(SupportTicketStatus, {
    message: `status must be one of: ${Object.values(SupportTicketStatus).join(', ')}`,
  })
  status?: SupportTicketStatus;

  @ApiPropertyOptional({
    description:
      'User id of the staff member to assign. Pass null to unassign.',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  @IsString()
  assignedToUserId?: string | null;
}
