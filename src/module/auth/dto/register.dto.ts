import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ALL_SYSTEM_ROLES } from '../../../common/constants/permissions';

export class RegisterDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+1234567890' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ minLength: 6 })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description:
      'One of the four system roles. Super_Admin cannot self-register.',
    enum: ALL_SYSTEM_ROLES,
    example: 'Customer',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(ALL_SYSTEM_ROLES as readonly string[])
  role: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  businessSiteSlug?: string;

  @ApiProperty({
    required: false,
    description: 'Business name when registering as Business_owner',
  })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  invitationToken?: string;
}
