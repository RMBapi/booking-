import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class AssignRoleDto {
  @ApiProperty({ description: 'User ID to assign the role to', example: 'uuid-here' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Role name to assign', example: 'Business_owner' })
  @IsString()
  @IsNotEmpty()
  roleName: string;
}
