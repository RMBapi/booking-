import { BaseApiResponseDto } from '../../../../common/dto/api-response.dto';
import { ServiceResponseDto } from './service-response.dto';
import { ApiProperty } from '@nestjs/swagger';

export class GetSingleServiceDto extends BaseApiResponseDto {
  @ApiProperty({
    type: ServiceResponseDto,
  })
  data: ServiceResponseDto;
}
