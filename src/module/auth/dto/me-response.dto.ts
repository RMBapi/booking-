import { ApiProperty } from '@nestjs/swagger';

export class MeUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;

  @ApiProperty({ example: 'Business_owner' })
  systemRole: string;

  @ApiProperty({
    description:
      'When true, the frontend MUST redirect to the change-password flow.',
  })
  passwordChangeRequired: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}

export class MeBusinessDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ nullable: true, required: false })
  logo: string | null;

  @ApiProperty({ example: 'Business_owner' })
  role: string;

  @ApiProperty({
    enum: ['Pending', 'Active', 'Deactivated'],
    example: 'Active',
    description:
      "Membership status. Only 'Active' members may enter the dashboard for this business.",
  })
  status: 'Pending' | 'Active' | 'Deactivated';

  @ApiProperty({ type: [String] })
  permissions: string[];
}

export class MeResponseDto {
  @ApiProperty({ type: MeUserDto })
  user: MeUserDto;

  @ApiProperty({ type: [MeBusinessDto] })
  businesses: MeBusinessDto[];
}
