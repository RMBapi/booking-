import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InvitationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  businessId: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  invitedBy: string;

  @ApiProperty({ type: String, format: 'date-time' })
  expiresAt: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  acceptedAt?: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  revokedAt?: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}

export class InvitationCreatedResponseDto extends InvitationResponseDto {
  @ApiProperty({
    description:
      'Raw invitation token. Shown ONCE at creation time — store it via the email link, never persisted unhashed in the DB.',
  })
  token: string;
}

export class InvitationPublicViewDto {
  @ApiProperty()
  businessName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  isExpired: boolean;

  @ApiProperty()
  isRevoked: boolean;

  @ApiProperty()
  isAccepted: boolean;
}
