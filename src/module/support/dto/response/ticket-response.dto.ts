import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SupportMessageAuthor,
  SupportTicketStatus,
  SupportTicketType,
} from '@prisma/client';

@Exclude()
export class TicketPersonBriefDto {
  @Expose()
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'Jane Doe' })
  name: string;

  @Expose()
  @ApiPropertyOptional({ example: 'jane@example.com', nullable: true })
  email: string | null;
}

@Exclude()
export class TicketMessageResponseDto {
  @Expose()
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @Expose()
  @ApiProperty({ enum: SupportMessageAuthor, example: SupportMessageAuthor.Customer })
  authorType: SupportMessageAuthor;

  @Expose()
  @ApiProperty({ example: 'Jane Doe' })
  authorName: string;

  @Expose()
  @ApiProperty({ example: 'Hi, I need help with my booking.' })
  body: string;

  @Expose()
  @ApiProperty({ example: true })
  viaEmail: boolean;

  @Expose()
  @ApiProperty({ example: '2026-06-09T10:00:00.000Z' })
  createdAt: Date;
}

@Exclude()
export class TicketResponseDto {
  @Expose()
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @Expose()
  @ApiProperty({ example: 1042, description: 'Human-friendly ticket number' })
  ticketNumber: number;

  @Expose()
  @ApiProperty({ enum: SupportTicketType, example: SupportTicketType.Business })
  type: SupportTicketType;

  @Expose()
  @ApiPropertyOptional({ nullable: true, example: '123e4567-...' })
  businessId: string | null;

  @Expose()
  @ApiProperty({ enum: SupportTicketStatus, example: SupportTicketStatus.Open })
  status: SupportTicketStatus;

  @Expose()
  @ApiProperty({ example: 'Booking issue' })
  subject: string;

  @Expose()
  @ApiProperty({ example: 'Jane Doe' })
  requesterName: string;

  @Expose()
  @ApiProperty({ example: 'jane@example.com' })
  requesterEmail: string;

  @Expose()
  @ApiPropertyOptional({ nullable: true, example: '+61400000000' })
  requesterPhone: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  requesterUserId: string | null;

  @Expose()
  @Type(() => TicketPersonBriefDto)
  @ApiPropertyOptional({ type: TicketPersonBriefDto, nullable: true })
  assignedTo: TicketPersonBriefDto | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true, example: '2026-06-09T11:00:00.000Z' })
  lastReplyAt: Date | null;

  @Expose()
  @ApiProperty({ example: '2026-06-09T10:00:00.000Z' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ example: '2026-06-09T10:00:00.000Z' })
  updatedAt: Date;
}

@Exclude()
export class TicketDetailResponseDto extends TicketResponseDto {
  @Expose()
  @Type(() => TicketMessageResponseDto)
  @ApiProperty({ type: [TicketMessageResponseDto] })
  messages: TicketMessageResponseDto[];
}
