import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import {
  ALL_FEATURES,
  SYSTEM_ROLES,
} from '../../../common/constants/permissions';
import { MEMBER_STATUSES } from '../../../common/constants/member-status';
import type { MemberStatus } from '../../../common/constants/member-status';

const ALLOWED_TEAM_ROLES = [
  SYSTEM_ROLES.BUSINESS_OWNER,
  SYSTEM_ROLES.SERVICE_PROVIDER,
];

export class AddTeamMemberDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ enum: ALLOWED_TEAM_ROLES })
  @IsString()
  @IsIn(ALLOWED_TEAM_ROLES as readonly string[])
  role: string;

  @ApiProperty({ type: [String], example: ['view_bookings'] })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsIn(ALL_FEATURES as readonly string[], { each: true })
  permissions: string[];

  @ApiProperty({
    minLength: 8,
    description:
      'Password set by the owner. The owner shares this with the new member out-of-band; the member is forced to change it on first login.',
  })
  @IsString()
  @MinLength(8)
  password: string;
}

export class UpdateTeamMemberDto {
  @ApiPropertyOptional({ enum: ALLOWED_TEAM_ROLES })
  @IsOptional()
  @IsString()
  @IsIn(ALLOWED_TEAM_ROLES as readonly string[])
  role?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsIn(ALL_FEATURES as readonly string[], { each: true })
  permissions?: string[];

  @ApiPropertyOptional({ enum: MEMBER_STATUSES })
  @IsOptional()
  @IsString()
  @IsIn(MEMBER_STATUSES as readonly string[])
  status?: MemberStatus;
}
