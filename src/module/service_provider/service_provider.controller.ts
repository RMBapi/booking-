import {
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
import { ServiceProviderService } from './service_provider.service';
import { CreateServiceProviderDto } from './dto/create-service_provider.dto';
import { UpdateServiceProviderDto } from './dto/update-service_provider.dto';
import { ServiceProviderQueryDto } from './dto/service_provider-query.dto';
import { GetSingleServiceProviderDto } from './dto/response/get-single-service_provider.dto';
import { GetAllServiceProviderDto } from './dto/response/get-all-service_provider.dto';
import { ServiceProviderResponseDto } from './dto/response/service_provider-response.dto';
import { RequireFeature } from '../../common/decorators/require-feature.decorator';
import { FEATURES } from '../../common/constants/permissions';

@ApiTags('Service Provider')
@ApiBearerAuth('JWT-auth')
@Controller('service-provider')
export class ServiceProviderController {
  constructor(
    private readonly serviceProviderService: ServiceProviderService,
  ) {}

  @Get()
  @RequireFeature(FEATURES.VIEW_PROVIDERS)
  @ApiOperation({ summary: 'Get all service providers with pagination' })
  @ApiResponse({ status: 200, type: GetAllServiceProviderDto })
  async findAll(
    @Query() queryDto: ServiceProviderQueryDto,
    @Headers('x-business-id') businessId: string,
  ) {
    const result = await this.serviceProviderService.findAll(
      queryDto,
      businessId,
    );
    const transformedData = plainToInstance(
      ServiceProviderResponseDto,
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
  @RequireFeature(FEATURES.MANAGE_PROVIDERS)
  @ApiOperation({ summary: 'Create a new service provider' })
  @ApiResponse({ status: 201, type: GetSingleServiceProviderDto })
  async create(
    @Body() dto: CreateServiceProviderDto,
    @Headers('x-business-id') businessId: string,
  ) {
    const sp = await this.serviceProviderService.create(dto, businessId);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Service provider created successfully',
      timestamp: new Date().toISOString(),
      data: plainToInstance(ServiceProviderResponseDto, sp, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Get(':id')
  @RequireFeature(FEATURES.VIEW_PROVIDERS)
  @ApiOperation({ summary: 'Get a single service provider' })
  @ApiResponse({ status: 200, type: GetSingleServiceProviderDto })
  async findOne(
    @Param('id') id: string,
    @Headers('x-business-id') businessId: string,
  ) {
    const sp = await this.serviceProviderService.findOne(id, businessId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Service provider fetched successfully',
      timestamp: new Date().toISOString(),
      data: plainToInstance(ServiceProviderResponseDto, sp, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Patch(':id')
  @RequireFeature(FEATURES.MANAGE_PROVIDERS)
  @ApiOperation({ summary: 'Update a service provider' })
  @ApiResponse({ status: 200, type: GetSingleServiceProviderDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceProviderDto,
    @Headers('x-business-id') businessId: string,
  ) {
    const sp = await this.serviceProviderService.update(id, dto, businessId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Service provider updated successfully',
      timestamp: new Date().toISOString(),
      data: plainToInstance(ServiceProviderResponseDto, sp, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequireFeature(FEATURES.MANAGE_PROVIDERS)
  @ApiOperation({ summary: 'Delete a service provider' })
  async delete(
    @Param('id') id: string,
    @Headers('x-business-id') businessId: string,
  ) {
    return this.serviceProviderService.delete(id, businessId);
  }
}
