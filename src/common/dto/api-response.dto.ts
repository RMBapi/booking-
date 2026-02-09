import { ApiProperty } from '@nestjs/swagger';

export class BaseApiResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;

  @ApiProperty({ example: '2025-01-01T12:00:00.000Z' })
  timestamp: string;
}
