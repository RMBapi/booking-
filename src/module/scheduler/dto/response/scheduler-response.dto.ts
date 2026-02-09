import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class SchedulerResponseDto {
  @Expose()
  @ApiProperty({
    description: 'The id of the scheduler',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @Expose()
  @ApiProperty({
    description: 'The service ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  serviceId: string;

  @Expose()
  @ApiProperty({
    description: 'The scheduler configuration',
    example: {
      timeFormat: '12',
      sunday: { startTime: '10:00', endTime: '18:00', isOff: false },
      monday: { startTime: '10:00', endTime: '18:00', isOff: false },
      timeSlotConfig: {
        intervalMinutes: 30,
        allowUserSelection: true,
        bookingsPerSlot: 1,
      },
    },
  })
  canScheduleTime: any;
}
