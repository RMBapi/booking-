import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * Supported social platforms. The frontend renders the matching icon from the
 * `platform` value. Extend this enum (and nothing else) to add more.
 */
export enum SocialPlatform {
  Facebook = 'facebook',
  Instagram = 'instagram',
}

/**
 * One social account link for a business. Stored inside the `socialAccounts`
 * JSONB array on the business row.
 */
export class SocialAccountDto {
  @ApiProperty({
    enum: SocialPlatform,
    example: SocialPlatform.Instagram,
    description: 'Which platform this link points to (drives the icon shown).',
  })
  @IsEnum(SocialPlatform, {
    message: `platform must be one of: ${Object.values(SocialPlatform).join(', ')}`,
  })
  platform: SocialPlatform;

  @ApiProperty({
    example: 'https://instagram.com/eleganzahairsalon',
    description: 'Public URL / link to the profile.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'url is required' })
  @MaxLength(500)
  url: string;
}
