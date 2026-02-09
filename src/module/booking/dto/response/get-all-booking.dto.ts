import { BaseApiResponseDto } from '../../../../common/dto/api-response.dto';
import { BookingResponseDto } from './booking-response.dto';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationMeta } from '../../../../common/dto/pagination.dto';

export class GetAllBookingDto extends BaseApiResponseDto {
  @ApiProperty({
    type: [BookingResponseDto],
  })
  data: BookingResponseDto[];

  @ApiProperty({
    type: PaginationMeta,
  })
  meta: PaginationMeta;
}
