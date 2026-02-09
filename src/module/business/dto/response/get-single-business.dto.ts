import { BaseApiResponseDto } from '../../../../common/dto/api-response.dto';
import { BusinessResponseDto } from './business-response.dto';
import { ApiProperty } from '@nestjs/swagger';

export class GetSingleBusinessDto extends BaseApiResponseDto {
  @ApiProperty({
    type: BusinessResponseDto,
  })
  data: BusinessResponseDto;
}
