import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
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
import { Prisma } from '@prisma/client';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { CreateOwnBusinessDto } from './dto/create-own-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { BusinessQueryDto } from './dto/business-query.dto';
import { GetSingleBusinessDto } from './dto/response/get-single-business.dto';
import { GetAllBusinessDto } from './dto/response/get-all-business.dto';
import { BusinessResponseDto } from './dto/response/business-response.dto';
import { ServiceResponseDto } from '../service/dto/response/service-response.dto';
import { GetAllServiceDto } from '../service/dto/response/get-all-service.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { RequireFeature } from '../../common/decorators/require-feature.decorator';
import { FEATURES, SYSTEM_ROLES } from '../../common/constants/permissions';

@ApiTags('Business')
@ApiBearerAuth('JWT-auth')
@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Get()
  @ApiOperation({ summary: 'Get all businesses with pagination' })
  @ApiResponse({ status: 200, type: GetAllBusinessDto })
  async findAll(@Query() queryDto: BusinessQueryDto) {
    const result = await this.businessService.findAll(queryDto);
    const transformedData = plainToInstance(BusinessResponseDto, result.data, {
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

  @Post()
  @ApiOperation({ summary: 'Create a new business (Business Owner only)' })
  @ApiResponse({ status: 201, type: GetSingleBusinessDto })
  async create(@Body() dto: CreateBusinessDto, @CurrentUser() user: JwtUser) {
    const business = await this.businessService.create(dto, user.id);
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
  async getMyBusinesses(@CurrentUser() user: JwtUser) {
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

  @Post('onboarding')
  @ApiOperation({
    summary:
      'Self-serve business creation for an authenticated Business_owner.',
    description:
      'Stage 5 of the new owner onboarding flow. The caller must be a Business_owner with no existing UserBusiness rows.',
  })
  @ApiResponse({ status: 201, type: GetSingleBusinessDto })
  async onboardOwnBusiness(
    @Body() dto: CreateOwnBusinessDto,
    @CurrentUser() user: JwtUser,
  ) {
    if (user.systemRole !== SYSTEM_ROLES.BUSINESS_OWNER) {
      throw new ForbiddenException(
        'Only Business_owner can onboard a business',
      );
    }
    const business = await this.businessService.onboardOwnBusiness(
      dto,
      user.id,
    );
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Business created successfully',
      timestamp: new Date().toISOString(),
      data: { business },
    };
  }

  @Get('check-has-business')
  @ApiOperation({ summary: 'Check if current user has a business' })
  async checkHasBusiness(@CurrentUser() user: JwtUser) {
    const hasBusiness = await this.businessService.checkUserHasBusiness(
      user.id,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Business check completed',
      timestamp: new Date().toISOString(),
      data: { hasBusiness, userId: user.id },
    };
  }

  @Public()
  @Get('slug/:slug/services')
  @ApiOperation({ summary: 'Get public services for a business by slug' })
  @ApiResponse({ status: 200, type: GetAllServiceDto })
  async findPublicServicesBySlug(
    @Param('slug') slug: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 100;

    const result = await this.businessService.findPublicServicesBySlug(
      slug,
      pageNum,
      limitNum,
    );

    const normalizeService = (service: any) => ({
      ...service,
      price:
        service.price instanceof Prisma.Decimal
          ? service.price.toNumber()
          : Number(service.price),
    });

    const normalizedData = result.data.map((service) => {
      const normalizedService = normalizeService(service);
      const providers = (normalizedService.serviceProviders || []).map(
        (provider: any) => ({
          id: provider.id,
          userId: provider.userId,
          firstName: provider.user?.firstName,
          lastName: provider.user?.lastName,
          description: provider.description ?? null,
          impUrl: provider.impUrl ?? null,
        }),
      );
      const showProvider =
        Boolean(normalizedService.allowCustomerChooseProvider) &&
        providers.length > 0;
      return {
        ...normalizedService,
        showProvider,
        providers: showProvider ? providers : [],
      };
    });

    const transformedData = plainToInstance(
      ServiceResponseDto,
      normalizedData,
      {
        excludeExtraneousValues: true,
      },
    );

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
  @Get('slug/:slug/services/:serviceId/providers')
  @ApiOperation({
    summary: 'Get public providers for a service by business slug',
  })
  async findPublicServiceProviders(
    @Param('slug') slug: string,
    @Param('serviceId') serviceId: string,
  ) {
    const result = await this.businessService.findPublicServiceProvidersBySlug(
      slug,
      serviceId,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Providers fetched successfully',
      timestamp: new Date().toISOString(),
      data: result,
    };
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a single business by slug (public)' })
  @ApiResponse({ status: 200, type: GetSingleBusinessDto })
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
  @ApiOperation({ summary: 'Get a single business (membership-only)' })
  @ApiResponse({ status: 200, type: GetSingleBusinessDto })
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
  @RequireFeature(FEATURES.MANAGE_BUSINESS)
  @ApiOperation({ summary: 'Update a business' })
  @ApiResponse({ status: 200, type: GetSingleBusinessDto })
  async update(@Param('id') id: string, @Body() dto: UpdateBusinessDto) {
    const business = await this.businessService.update(id, dto);
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
  @RequireFeature(FEATURES.MANAGE_BUSINESS)
  @ApiOperation({ summary: 'Delete a business' })
  async delete(@Param('id') id: string) {
    return this.businessService.delete(id);
  }
}
