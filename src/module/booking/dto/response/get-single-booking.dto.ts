import { BaseApiResponseDto } from '../../../../common/dto/api-response.dto';
import { BookingResponseDto } from './booking-response.dto';
import { ApiProperty } from '@nestjs/swagger';

export class GetSingleBookingDto extends BaseApiResponseDto {
  @ApiProperty({
    type: BookingResponseDto,
  })
  data: BookingResponseDto;
}
