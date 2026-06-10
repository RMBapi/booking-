import { Exclude, Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OpeningHoursDto } from '../opening-hours.dto';
import { SocialAccountDto } from '../social-accounts.dto';

@Exclude()
export class BusinessResponseDto {
  @Expose()
  @ApiProperty({
    description: 'The id of the business',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @Expose()
  @ApiProperty({
    description: 'The name of the business',
    example: 'Acme Corporation',
  })
  name: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'The description of the business',
    example: 'A leading provider of services',
    nullable: true,
  })
  description: string | null;

  @Expose()
  @ApiProperty({
    description: 'The unique slug of the business',
    example: 'acme-corporation',
  })
  slug: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Business logo image URL',
    example:
      'https://<project>.supabase.co/storage/v1/object/public/uploads/abc123.png',
    nullable: true,
  })
  logo: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Business image URL',
    example:
      'https://<project>.supabase.co/storage/v1/object/public/uploads/abc123.png',
    nullable: true,
  })
  image: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Business backup image URL',
    example:
      'https://<project>.supabase.co/storage/v1/object/public/uploads/abc123.png',
    nullable: true,
  })
  backupImage: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Business login screen image URL',
    example:
      'https://<project>.supabase.co/storage/v1/object/public/uploads/login.png',
    nullable: true,
  })
  loginImage: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'The email of the business',
    example: 'contact@acme.com',
    nullable: true,
  })
  email: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'The phone number of the business',
    example: '+1234567890',
    nullable: true,
  })
  phone: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'The address of the business',
    example: '123 Main St, City, State 12345',
    nullable: true,
  })
  address: string | null;

  @Expose()
  @ApiPropertyOptional({
    type: OpeningHoursDto,
    description: 'Weekly opening hours. Null until configured in CRM settings.',
    nullable: true,
  })
  openingHours: OpeningHoursDto | null;

  @Expose()
  @ApiPropertyOptional({
    type: [SocialAccountDto],
    description:
      'Social account links. Null/empty until configured. Each item has a platform (drives the icon) and a url.',
    nullable: true,
    example: [
      { platform: 'facebook', url: 'https://facebook.com/eleganzahairsalon' },
      { platform: 'instagram', url: 'https://instagram.com/eleganzahairsalon' },
    ],
  })
  socialAccounts: SocialAccountDto[] | null;

  @Expose()
  @ApiProperty({
    description: 'The created at timestamp',
    example: '2025-11-19T10:00:00.000Z',
  })
  createdAt: Date;

  @Expose()
  @ApiProperty({
    description: 'The updated at timestamp',
    example: '2025-11-19T10:00:00.000Z',
  })
  updatedAt: Date;
}
