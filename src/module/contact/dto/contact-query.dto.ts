import { IntersectionType } from '@nestjs/swagger';
import { PaginationFilterDto } from '../../../common/dto/pagination-filter.dto';
import { ContactFilterDto } from './contact-filter.dto';

export class ContactQueryDto extends IntersectionType(
  PaginationFilterDto,
  ContactFilterDto,
) {}
