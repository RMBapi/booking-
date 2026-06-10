import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ReplyTicketDto {
  @ApiProperty({
    description: 'The reply message body',
    example: 'Thanks for reaching out — we have issued a refund.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'Message is required' })
  @MinLength(1)
  @MaxLength(5000)
  message: string;
}
