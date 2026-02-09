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
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { BusinessQueryDto } from './dto/business-query.dto';
import { GetSingleBusinessDto } from './dto/response/get-single-business.dto';
import { GetAllBusinessDto } from './dto/response/get-all-business.dto';
import { plainToInstance } from 'class-transformer';
import { BusinessResponseDto } from './dto/response/business-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { AddBusinessOwnerDto, AddBusinessOwnerByEmailDto } from './dto/add-business-owner.dto';
import { BusinessOwnerResponseDto } from './dto/response/business-owner-response.dto';
import { ServiceResponseDto } from '../service/dto/response/service-response.dto';
import { GetAllServiceDto } from '../service/dto/response/get-all-service.dto';
import { Prisma } from '@prisma/client';

@ApiTags('Business')
@ApiBearerAuth('JWT-auth')
@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Get()
  @ApiOperation({ summary: 'Get all businesses with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Businesses fetched successfully',
    type: GetAllBusinessDto,
  })
  async findAll(@Query() queryDto: BusinessQueryDto) {
    const result = await this.businessService.findAll(queryDto);

    const transformedData = plainToInstance(
      BusinessResponseDto,
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

  @Post()
  @ApiOperation({ summary: 'Create a new business (Business Owner only)' })
  @ApiResponse({
    status: 201,
    description: 'Business created successfully',
    type: GetSingleBusinessDto,
  })
  async create(
    @Body() createBusinessDto: CreateBusinessDto,
    @CurrentUser() user: any,
  ) {
    // Automatically link business to the authenticated user
    const business = await this.businessService.create(
      createBusinessDto,
      user.id,
    );
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Business created successfully',
      timestamp: new Date().toISOString(),
      data: plainToInstance(BusinessResponseDto, business, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Get('my-businesses')
  @ApiOperation({ summary: 'Get current user businesses' })
  @ApiResponse({
    status: 200,
    description: 'User businesses fetched successfully',
  })
  async getMyBusinesses(@CurrentUser() user: any) {
    const businesses = await this.businessService.findByUserId(user.id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'User businesses fetched successfully',
      timestamp: new Date().toISOString(),
      data: plainToInstance(BusinessResponseDto, businesses, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Get('check-has-business')
  @ApiOperation({ summary: 'Check if current user has a business' })
  @ApiResponse({
    status: 200,
    description: 'Business check completed',
  })
  async checkHasBusiness(@CurrentUser() user: any) {
    const hasBusiness = await this.businessService.checkUserHasBusiness(
      user.id,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Business check completed',
      timestamp: new Date().toISOString(),
      data: {
        hasBusiness,
        userId: user.id,
      },
    };
  }

  @Public()
  @Get('slug/:slug/services')
  @ApiOperation({
    summary: 'Get public services for a business by slug (Public - no authentication required)',
    description: `Get all active services for a business using the business slug. This endpoint is public and does not require authentication.

**Use Cases:**
- Display services on public business pages
- Service listings for customers browsing businesses
- Integration with booking forms

**Important Notes:**
- No authentication required (public endpoint)
- Only returns services with status === "Active" AND isActive === true
- Supports pagination via \`page\` and \`limit\` query parameters
- Prices are returned as numbers (not Decimal objects)

**Query Parameters:**
- \`page\` (optional) - Page number (default: 1)
- \`limit\` (optional) - Items per page (default: 100)

**Response:**
Returns paginated list of active services with business information.`,
  })
  @ApiResponse({
    status: 200,
    description: 'Services fetched successfully',
    type: GetAllServiceDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Business not found',
  })
  async findPublicServicesBySlug(
    @Param('slug') slug: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    console.log('✅ Route handler called - findPublicServicesBySlug with slug:', slug);
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 100;

    const result = await this.businessService.findPublicServicesBySlug(
      slug,
      pageNum,
      limitNum,
    );

    // Normalize Decimal to number for each service
    const normalizeService = (service: any) => {
      return {
        ...service,
        price:
          service.price instanceof Prisma.Decimal
            ? service.price.toNumber()
            : Number(service.price),
      };
    };

    const normalizedData = result.data.map((service) =>
      normalizeService(service),
    );

    const transformedData = plainToInstance(
      ServiceResponseDto,
      normalizedData,
      {
        excludeExtraneousValues: true,
      },
    );

    // Add businessId to each service object (since ServiceResponseDto doesn't include it)
    const dataWithBusinessId = transformedData.map((service) => ({
      ...service,
      businessId: result.businessId,
    }));

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Operation completed successfully',
      timestamp: new Date().toISOString(),
      data: dataWithBusinessId,
      meta: result.meta,
    };
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({
    summary: 'Get a single business by slug (Public - for website access)',
    description: `Get business information using the business slug. This endpoint is public and does not require authentication.

**Use Cases:**
- Public business profile pages
- Landing pages for businesses
- Business information display

**Important Notes:**
- No authentication required (public endpoint)
- Slug is auto-generated when business is created (e.g., "acme-salon-spa")
- Returns complete business information including name, description, contact info, logo, etc.

**Example:**
If business name is "Acme Salon & Spa", the slug might be "acme-salon-spa"
Access via: \`GET /business/slug/acme-salon-spa\``,
  })
  @ApiResponse({
    status: 200,
    description: 'Business fetched successfully',
    type: GetSingleBusinessDto,
  })
  async findOneBySlug(@Param('slug') slug: string) {
    const business = await this.businessService.findOneBySlug(slug);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Business fetched successfully',
      timestamp: new Date().toISOString(),
      data: plainToInstance(BusinessResponseDto, business, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single business' })
  @ApiResponse({
    status: 200,
    description: 'Business fetched successfully',
    type: GetSingleBusinessDto,
  })
  async findOne(@Param('id') id: string) {
    const business = await this.businessService.findOne(id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Business fetched successfully',
      timestamp: new Date().toISOString(),
      data: plainToInstance(BusinessResponseDto, business, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a business' })
  @ApiResponse({
    status: 200,
    description: 'Business updated successfully',
    type: GetSingleBusinessDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateBusinessDto: UpdateBusinessDto,
  ) {
    const business = await this.businessService.update(id, updateBusinessDto);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Business updated successfully',
      timestamp: new Date().toISOString(),
      data: plainToInstance(BusinessResponseDto, business, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a business' })
  @ApiResponse({
    status: 200,
    description: 'Business deleted successfully',
  })
  async delete(@Param('id') id: string) {
    return await this.businessService.delete(id);
  }

  // ============ Business Owner Management ============

  @Get(':id/owners')
  @ApiOperation({ summary: 'Get all owners of a business' })
  @ApiResponse({
    status: 200,
    description: 'Business owners fetched successfully',
  })
  async getBusinessOwners(@Param('id') businessId: string) {
    const owners = await this.businessService.getBusinessOwners(businessId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Business owners fetched successfully',
      timestamp: new Date().toISOString(),
      data: plainToInstance(BusinessOwnerResponseDto, owners, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Post(':id/owners')
  @ApiOperation({ summary: 'Add an owner to a business (Business Owner only)' })
  @ApiResponse({
    status: 201,
    description: 'Business owner added successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only business owners can add other owners',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found or does not have Business_owner role',
  })
  @ApiResponse({
    status: 409,
    description: 'User is already an owner of this business',
  })
  async addBusinessOwner(
    @Param('id') businessId: string,
    @Body() addOwnerDto: AddBusinessOwnerDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.businessService.addBusinessOwner(
      businessId,
      addOwnerDto.userId,
      user.id,
    );
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: result.message,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/owners/by-email')
  @ApiOperation({
    summary:
      'Add an owner to a business by email (Business Owner only)',
  })
  @ApiResponse({
    status: 201,
    description: 'Business owner added successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only business owners can add other owners',
  })
  @ApiResponse({
    status: 404,
    description: 'No Business_owner user found with this email',
  })
  @ApiResponse({
    status: 409,
    description: 'User is already an owner of this business',
  })
  async addBusinessOwnerByEmail(
    @Param('id') businessId: string,
    @Body() addOwnerDto: AddBusinessOwnerByEmailDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.businessService.addBusinessOwnerByEmail(
      businessId,
      addOwnerDto.email,
      user.id,
    );
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: result.message,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':id/owners/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove an owner from a business (Business Owner only)' })
  @ApiResponse({
    status: 200,
    description: 'Business owner removed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot remove the last owner',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only business owners can remove other owners',
  })
  @ApiResponse({
    status: 404,
    description: 'User is not an owner of this business',
  })
  async removeBusinessOwner(
    @Param('id') businessId: string,
    @Param('userId') ownerUserId: string,
    @CurrentUser() user: any,
  ) {
    const result = await this.businessService.removeBusinessOwner(
      businessId,
      ownerUserId,
      user.id,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: result.message,
      timestamp: new Date().toISOString(),
    };
  }
}
