import { BaseApiResponseDto } from '../../../../common/dto/api-response.dto';
import { ContactResponseDto } from './contact-response.dto';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationMeta } from '../../../../common/dto/pagination.dto';

export class GetAllContactDto extends BaseApiResponseDto {
  @ApiProperty({
    type: [ContactResponseDto],
  })
  data: ContactResponseDto[];

  @ApiProperty({
    type: PaginationMeta,
  })
  meta: PaginationMeta;
}
