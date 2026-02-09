import { BaseApiResponseDto } from '../../../../common/dto/api-response.dto';
import { ServiceProviderResponseDto } from './service_provider-response.dto';
import { ApiProperty } from '@nestjs/swagger';

export class GetSingleServiceProviderDto extends BaseApiResponseDto {
  @ApiProperty({
    type: ServiceProviderResponseDto,
  })
  data: ServiceProviderResponseDto;
}
