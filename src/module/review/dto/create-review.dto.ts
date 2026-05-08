import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    description: 'Rating between 1 and 5',
    minimum: 1,
    maximum: 5,
    example: 5,
  })
  @IsInt({ message: 'Rating must be an integer' })
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating must be at most 5' })
  rating: number;

  @ApiPropertyOptional({
    description: 'Optional free-text comment',
    example: 'Great service, very professional!',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString({ message: 'Comment must be a string' })
  @MaxLength(2000, { message: 'Comment must be 2000 characters or fewer' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  comment?: string;
}
