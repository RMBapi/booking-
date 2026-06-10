import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
const trimLower = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

/**
 * Body for creating a Contact-Us ticket.
 *
 * - Logged-out (guest): `name`, `email` and `phone` are all required so the
 *   ticket carries the same contactable identity as a logged-in user.
 * - Logged-in: `name` / `email` / `phone` are ignored — the requester's
 *   profile is used instead, so only `subject` + `message` are needed.
 */
export class CreateTicketDto {
  @ApiProperty({ description: 'Ticket subject', example: 'Booking issue' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Subject is required' })
  @MinLength(2)
  @MaxLength(200)
  subject: string;

  @ApiProperty({
    description: 'The message body',
    example: 'I was charged twice for my appointment.',
  })
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Message is required' })
  @MinLength(2)
  @MaxLength(5000)
  message: string;

  @ApiPropertyOptional({
    description: 'Requester full name (REQUIRED for logged-out users)',
    example: 'Jane Doe',
  })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    description: 'Requester email (REQUIRED for logged-out users)',
    example: 'jane@example.com',
  })
  @Transform(trimLower)
  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Requester phone number (REQUIRED for logged-out users)',
    example: '+61400000000',
  })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional({
    description:
      'Business slug the request is for. Required for tenant Contact-Us when no X-Business-Id header is sent. Ignored for platform tickets.',
    example: 'eleganzahairsalon',
  })
  @Transform(trim)
  @IsOptional()
  @IsString()
  businessSlug?: string;
}
