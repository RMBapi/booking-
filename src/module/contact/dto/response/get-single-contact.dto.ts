import { BaseApiResponseDto } from '../../../../common/dto/api-response.dto';
import { ContactResponseDto } from './contact-response.dto';
import { ApiProperty } from '@nestjs/swagger';

export class GetSingleContactDto extends BaseApiResponseDto {
  @ApiProperty({
    type: ContactResponseDto,
  })
  data: ContactResponseDto;
}
