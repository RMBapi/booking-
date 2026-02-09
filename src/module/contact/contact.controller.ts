import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ContactQueryDto } from './dto/contact-query.dto';
import { GetSingleContactDto } from './dto/response/get-single-contact.dto';
import { GetAllContactDto } from './dto/response/get-all-contact.dto';
import { plainToInstance } from 'class-transformer';
import { ContactResponseDto } from './dto/response/contact-response.dto';
import { BusinessId } from '../../common/decorators/business.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { BusinessService } from '../business/business.service';

@ApiTags('Contact')
@ApiBearerAuth('JWT-auth')
@Controller('contact')
export class ContactController {
  constructor(
    private readonly contactService: ContactService,
    private readonly businessService: BusinessService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all contacts with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Contacts fetched successfully',
    type: GetAllContactDto,
  })
  async findAll(
    @Query() queryDto: ContactQueryDto,
    @BusinessId() businessId: string,
  ) {
    const result = await this.contactService.findAll(queryDto, businessId);

    const transformedData = plainToInstance(
      ContactResponseDto,
      result.data,
      {
        excludeExtraneousValues: true,
      },
    );

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
  @ApiOperation({
    summary: 'Create a new contact (Public - for non-logged-in users)',
    description: `Create a contact/booking request for non-logged-in users. This endpoint is public and does not require authentication.

**Use Cases:**
- Non-logged-in visitors want to book a service
- Contact forms on public business pages
- Lead generation from website visitors

**Important Notes:**
- No authentication required (public endpoint)
- You can provide businessId via \`x-business-id\` header OR \`businessSlug\` query parameter
- bookingTime must be in ISO 8601 format
- Data is stored in the Contact table (not Booking table)
- Business owners can view these contacts in their dashboard

**Request Body:**
- \`serviceId\` (required) - The service being requested
- \`firstName\` (required) - Customer's first name
- \`lastName\` (required) - Customer's last name
- \`email\` (required) - Customer's email
- \`phone\` (required) - Customer's phone number
- \`bookingTime\` (optional) - Preferred booking time
- \`notes\` (optional) - Additional notes or requirements`,
  })
  @ApiResponse({
    status: 201,
    description: 'Contact created successfully',
    type: GetSingleContactDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Missing required fields or invalid data',
  })
  @ApiResponse({
    status: 404,
    description: 'Business or service not found',
  })
  async create(
    @Body() createContactDto: CreateContactDto,
    @Query('businessSlug') businessSlug?: string,
    @BusinessId() businessId?: string,
  ) {
    // Get businessId from slug if not provided via header
    let resolvedBusinessId = businessId;
    if (!resolvedBusinessId && businessSlug) {
      const business = await this.businessService.findOneBySlug(businessSlug);
      resolvedBusinessId = business.id;
    } else if (!resolvedBusinessId) {
      throw new BadRequestException(
        'Either businessId (via x-business-id header) or businessSlug (via query parameter) is required',
      );
    }

    const contact = await this.contactService.create(createContactDto, resolvedBusinessId);
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
  @ApiOperation({ summary: 'Get a single contact' })
  @ApiResponse({
    status: 200,
    description: 'Contact fetched successfully',
    type: GetSingleContactDto,
  })
  async findOne(
    @Param('id') id: string,
    @BusinessId() businessId: string,
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
  @ApiOperation({ summary: 'Update a contact' })
  @ApiResponse({
    status: 200,
    description: 'Contact updated successfully',
    type: GetSingleContactDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateContactDto: UpdateContactDto,
    @BusinessId() businessId: string,
  ) {
    const contact = await this.contactService.update(id, updateContactDto, businessId);
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
  @ApiOperation({ summary: 'Delete a contact' })
  @ApiResponse({
    status: 200,
    description: 'Contact deleted successfully',
  })
  async delete(
    @Param('id') id: string,
    @BusinessId() businessId: string,
  ) {
    return await this.contactService.delete(id, businessId);
  }
}
