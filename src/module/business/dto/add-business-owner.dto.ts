import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class AddBusinessOwnerDto {
  @ApiProperty({
    description: 'User ID of the business owner to add (must be a registered Business_owner)',
    example: 'uuid-of-existing-business-owner',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;
}

export class AddBusinessOwnerByEmailDto {
  @ApiProperty({
    description: 'Email of the business owner to add',
    example: 'newowner@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
