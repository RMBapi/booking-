import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { ContactService } from './contact.service';
import { BusinessService } from '../business/business.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ContactQueryDto } from './dto/contact-query.dto';
import { GetSingleContactDto } from './dto/response/get-single-contact.dto';
import { GetAllContactDto } from './dto/response/get-all-contact.dto';
import { ContactResponseDto } from './dto/response/contact-response.dto';
import { Public } from '../auth/decorators/public.decorator';
import { RequireFeature } from '../../common/decorators/require-feature.decorator';
import { FEATURES } from '../../common/constants/permissions';

@ApiTags('Contact')
@ApiBearerAuth('JWT-auth')
@Controller('contact')
export class ContactController {
  constructor(
    private readonly contactService: ContactService,
    private readonly businessService: BusinessService,
  ) {}

  @Get()
  @RequireFeature(FEATURES.VIEW_CONTACTS)
  @ApiOperation({ summary: 'Get all contacts with pagination' })
  @ApiResponse({ status: 200, type: GetAllContactDto })
  async findAll(
    @Query() queryDto: ContactQueryDto,
    @Headers('x-business-id') businessId: string,
  ) {
    const result = await this.contactService.findAll(queryDto, businessId);
    const transformedData = plainToInstance(ContactResponseDto, result.data, {
      excludeExtraneousValues: true,
    });
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Operation completed successfully',
      timestamp: new Date().toISOString(),
      data: transformedData,
      meta: result.meta,
    };
  }

  @Public()
  @Post()
  @ApiOperation({ summary: 'Create a new contact (public, customer-facing)' })
  @ApiResponse({ status: 201, type: GetSingleContactDto })
  async create(
    @Body() dto: CreateContactDto,
    @Query('businessSlug') businessSlug?: string,
    @Headers('x-business-id') businessId?: string,
  ) {
    let resolvedBusinessId = businessId;
    if (!resolvedBusinessId && businessSlug) {
      const business = await this.businessService.findOneBySlug(businessSlug);
      resolvedBusinessId = business.id;
    } else if (!resolvedBusinessId) {
      throw new BadRequestException(
        'Either businessId (via x-business-id header) or businessSlug (via query parameter) is required',
      );
    }
    const contact = await this.contactService.create(dto, resolvedBusinessId);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Contact created successfully',
      timestamp: new Date().toISOString(),
      data: plainToInstance(ContactResponseDto, contact, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Get(':id')
  @RequireFeature(FEATURES.VIEW_CONTACTS)
  @ApiOperation({ summary: 'Get a single contact' })
  @ApiResponse({ status: 200, type: GetSingleContactDto })
  async findOne(
    @Param('id') id: string,
    @Headers('x-business-id') businessId: string,
  ) {
    const contact = await this.contactService.findOne(id, businessId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Contact fetched successfully',
      timestamp: new Date().toISOString(),
      data: plainToInstance(ContactResponseDto, contact, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Patch(':id')
  @RequireFeature(FEATURES.MANAGE_CONTACTS)
  @ApiOperation({ summary: 'Update a contact' })
  @ApiResponse({ status: 200, type: GetSingleContactDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
    @Headers('x-business-id') businessId: string,
  ) {
    const contact = await this.contactService.update(id, dto, businessId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Contact updated successfully',
      timestamp: new Date().toISOString(),
      data: plainToInstance(ContactResponseDto, contact, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequireFeature(FEATURES.MANAGE_CONTACTS)
  @ApiOperation({ summary: 'Delete a contact' })
  async delete(
    @Param('id') id: string,
    @Headers('x-business-id') businessId: string,
  ) {
    return this.contactService.delete(id, businessId);
  }
}
