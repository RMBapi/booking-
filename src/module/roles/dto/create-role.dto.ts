import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ description: 'Unique role name (e.g. "Moderator")', example: 'Moderator' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  name: string;

  @ApiPropertyOptional({ description: 'Human-readable description', example: 'Content moderators' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
