import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class BusinessFilterDto {
  @ApiPropertyOptional({
    description: 'The slug of the business',
    example: 'acme-corporation',
  })
  @IsString({ message: 'Slug must be a string' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  slug?: string;

  @ApiPropertyOptional({
    description: 'The name of the business',
    example: 'Acme Corporation',
  })
  @IsString({ message: 'Name must be a string' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  name?: string;
}
