import { BaseApiResponseDto } from '../../../../common/dto/api-response.dto';
import { ServiceResponseDto } from './service-response.dto';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationMeta } from '../../../../common/dto/pagination.dto';

export class GetAllServiceDto extends BaseApiResponseDto {
  @ApiProperty({
    type: [ServiceResponseDto],
  })
  data: ServiceResponseDto[];

  @ApiProperty({
    type: PaginationMeta,
  })
  meta: PaginationMeta;
}
