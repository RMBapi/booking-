import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

export class CreateInvitationDto {
  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Role to grant on accept. Defaults to Business_owner.',
    example: 'Business_owner',
    enum: ['Business_owner', 'Service_Provider'],
  })
  @IsString()
  @IsOptional()
  @IsIn(['Business_owner', 'Service_Provider'])
  role?: string;
}
