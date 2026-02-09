import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class BusinessOwnerResponseDto {
  @ApiProperty({ example: 'uuid' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'John' })
  @Expose()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @Expose()
  lastName: string;

  @ApiProperty({ example: 'john@example.com' })
  @Expose()
  email: string;

  @ApiProperty({ example: '+1234567890' })
  @Expose()
  phone: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  createdAt: Date;
}
