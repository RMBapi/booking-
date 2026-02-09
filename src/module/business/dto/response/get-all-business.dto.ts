import { BaseApiResponseDto } from '../../../../common/dto/api-response.dto';
import { BusinessResponseDto } from './business-response.dto';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationMeta } from '../../../../common/dto/pagination.dto';

export class GetAllBusinessDto extends BaseApiResponseDto {
  @ApiProperty({
    type: [BusinessResponseDto],
  })
  data: BusinessResponseDto[];

  @ApiProperty({
    type: PaginationMeta,
  })
  meta: PaginationMeta;
}
