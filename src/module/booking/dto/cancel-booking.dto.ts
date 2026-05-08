import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CancelBookingDto {
  @ApiProperty({
    description: 'Reason for cancelling the booking',
    example: 'Customer requested reschedule via phone',
    maxLength: 500,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Cancellation reason must be a string' })
  @IsNotEmpty({ message: 'Cancellation reason is required' })
  @MaxLength(500, {
    message: 'Cancellation reason must be 500 characters or fewer',
  })
  cancellationReason: string;
}
