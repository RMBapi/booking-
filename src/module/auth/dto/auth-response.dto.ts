import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ example: 'Business_owner' })
  systemRole: string;

  @ApiProperty({
    description:
      'When true, the frontend MUST redirect to the change-password flow before allowing any other action.',
  })
  passwordChangeRequired: boolean;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;

  @ApiProperty({
    required: false,
    description:
      'Set for customer sessions — the business the customer logged into or registered with.',
  })
  businessId?: string;
}
