import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsObject, ValidateNested, IsOptional, IsBoolean, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

class DayScheduleDto {
  @ApiPropertyOptional({ example: '10:00', description: 'Start time in HH:mm format' })
  @IsOptional()
  @IsString({ message: 'Start time must be a string' })
  startTime?: string;

  @ApiPropertyOptional({ example: '18:00', description: 'End time in HH:mm format' })
  @IsOptional()
  @IsString({ message: 'End time must be a string' })
  endTime?: string;

  @ApiPropertyOptional({ example: false, description: 'Whether this day is off' })
  @IsOptional()
  @IsBoolean({ message: 'isOff must be a boolean' })
  isOff?: boolean;
}

class BlockedTimeDto {
  @ApiProperty({ example: '14:00', description: 'Blocked start time' })
  @IsString({ message: 'Start time must be a string' })
  @IsNotEmpty({ message: 'Start time is required' })
  startTime: string;

  @ApiProperty({ example: '16:00', description: 'Blocked end time' })
  @IsString({ message: 'End time must be a string' })
  @IsNotEmpty({ message: 'End time is required' })
  endTime: string;
}

class TimeSlotConfigDto {
  @ApiProperty({ example: 30, description: 'Interval between time slots in minutes' })
  @IsNumber({}, { message: 'Interval minutes must be a number' })
  @IsNotEmpty({ message: 'Interval minutes is required' })
  intervalMinutes: number;

  @ApiProperty({ example: false, description: 'Whether user can select time slots' })
  @IsBoolean({ message: 'Allow user selection must be a boolean' })
  @IsNotEmpty({ message: 'Allow user selection is required' })
  allowUserSelection: boolean;

  @ApiProperty({ example: 1, description: 'Number of bookings allowed per time slot (1 for single, >1 for multiple)' })
  @IsNumber({}, { message: 'Bookings per slot must be a number' })
  @IsNotEmpty({ message: 'Bookings per slot is required' })
  bookingsPerSlot: number;
}

export class CanScheduleTimeDto {
  @ApiProperty({ example: '12', description: 'Time format: 12 or 24 hour', enum: ['12', '24'] })
  @IsEnum(['12', '24'], { message: 'Time format must be either "12" or "24"' })
  @IsNotEmpty({ message: 'Time format is required' })
  timeFormat: '12' | '24';

  @ApiPropertyOptional({ type: DayScheduleDto, description: 'Schedule for each day' })
  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  sunday?: DayScheduleDto;

  @ApiPropertyOptional({ type: DayScheduleDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  monday?: DayScheduleDto;

  @ApiPropertyOptional({ type: DayScheduleDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  tuesday?: DayScheduleDto;

  @ApiPropertyOptional({ type: DayScheduleDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  wednesday?: DayScheduleDto;

  @ApiPropertyOptional({ type: DayScheduleDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  thursday?: DayScheduleDto;

  @ApiPropertyOptional({ type: DayScheduleDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  friday?: DayScheduleDto;

  @ApiPropertyOptional({ type: DayScheduleDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  saturday?: DayScheduleDto;

  @ApiPropertyOptional({ description: 'Blocked time frames per day' })
  @IsOptional()
  @IsObject()
  blockedTimes?: Record<string, BlockedTimeDto[]>;

  @ApiProperty({ type: TimeSlotConfigDto })
  @ValidateNested()
  @Type(() => TimeSlotConfigDto)
  @IsNotEmpty({ message: 'Time slot config is required' })
  timeSlotConfig: TimeSlotConfigDto;
}

export class CreateSchedulerDto {
  @ApiProperty({
    description: 'The service ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString({ message: 'Service ID must be a string' })
  @IsNotEmpty({ message: 'Service ID is required' })
  serviceId: string;

  @ApiProperty({
    description: 'The scheduler configuration',
    type: CanScheduleTimeDto,
  })
  @IsObject()
  @IsNotEmpty({ message: 'canScheduleTime is required' })
  @ValidateNested()
  @Type(() => CanScheduleTimeDto)
  canScheduleTime: CanScheduleTimeDto;
}
