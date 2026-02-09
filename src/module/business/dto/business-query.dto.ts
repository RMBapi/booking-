import { IntersectionType } from '@nestjs/swagger';
import { PaginationFilterDto } from '../../../common/dto/pagination-filter.dto';
import { BusinessFilterDto } from './business-filter.dto';

export class BusinessQueryDto extends IntersectionType(
  PaginationFilterDto,
  BusinessFilterDto,
) {}
