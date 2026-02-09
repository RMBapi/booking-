import { IntersectionType } from '@nestjs/swagger';
import { PaginationFilterDto } from '../../../common/dto/pagination-filter.dto';
import { ServiceFilterDto } from './service-filter.dto';

export class ServiceQueryDto extends IntersectionType(
  PaginationFilterDto,
  ServiceFilterDto,
) {}
