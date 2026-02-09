import { IntersectionType } from '@nestjs/swagger';
import { PaginationFilterDto } from '../../../common/dto/pagination-filter.dto';
import { BookingFilterDto } from './booking-filter.dto';

export class BookingQueryDto extends IntersectionType(
  PaginationFilterDto,
  BookingFilterDto,
) {}
