import { IntersectionType } from '@nestjs/swagger';
import { PaginationFilterDto } from '../../../common/dto/pagination-filter.dto';
import { ServiceProviderFilterDto } from './service_provider-filter.dto';

export class ServiceProviderQueryDto extends IntersectionType(
  PaginationFilterDto,
  ServiceProviderFilterDto,
) {}
