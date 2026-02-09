import { BaseApiResponseDto } from '../../../../common/dto/api-response.dto';
import { ServiceProviderResponseDto } from './service_provider-response.dto';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationMeta } from '../../../../common/dto/pagination.dto';

export class GetAllServiceProviderDto extends BaseApiResponseDto {
  @ApiProperty({
    type: [ServiceProviderResponseDto],
  })
  data: ServiceProviderResponseDto[];

  @ApiProperty({
    type: PaginationMeta,
  })
  meta: PaginationMeta;
}
