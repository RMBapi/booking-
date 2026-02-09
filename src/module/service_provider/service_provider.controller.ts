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
import { ServiceProviderService } from './service_provider.service';
import { CreateServiceProviderDto } from './dto/create-service_provider.dto';
import { UpdateServiceProviderDto } from './dto/update-service_provider.dto';
import { ServiceProviderQueryDto } from './dto/service_provider-query.dto';
import { GetSingleServiceProviderDto } from './dto/response/get-single-service_provider.dto';
import { GetAllServiceProviderDto } from './dto/response/get-all-service_provider.dto';
import { plainToInstance } from 'class-transformer';
import { ServiceProviderResponseDto } from './dto/response/service_provider-response.dto';
import { BusinessId } from '../../common/decorators/business.decorator';

@ApiTags('Service Provider')
@ApiBearerAuth('JWT-auth')
@Controller('service-provider')
export class ServiceProviderController {
  constructor(private readonly serviceProviderService: ServiceProviderService) {}

  @Get()
  @ApiOperation({ summary: 'Get all service providers with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Service providers fetched successfully',
    type: GetAllServiceProviderDto,
  })
  async findAll(
    @Query() queryDto: ServiceProviderQueryDto,
    @BusinessId() businessId: string,
  ) {
    const result = await this.serviceProviderService.findAll(queryDto, businessId);

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
  @ApiOperation({ summary: 'Create a new service provider' })
  @ApiResponse({
    status: 201,
    description: 'Service provider created successfully',
    type: GetSingleServiceProviderDto,
  })
  async create(
    @Body() createServiceProviderDto: CreateServiceProviderDto,
    @BusinessId() businessId: string,
  ) {
    const serviceProvider = await this.serviceProviderService.create(
      createServiceProviderDto,
      businessId,
    );
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Service provider created successfully',
      timestamp: new Date().toISOString(),
      data: plainToInstance(ServiceProviderResponseDto, serviceProvider, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single service provider' })
  @ApiResponse({
    status: 200,
    description: 'Service provider fetched successfully',
    type: GetSingleServiceProviderDto,
  })
  async findOne(
    @Param('id') id: string,
    @BusinessId() businessId: string,
  ) {
    const serviceProvider = await this.serviceProviderService.findOne(id, businessId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Service provider fetched successfully',
      timestamp: new Date().toISOString(),
      data: plainToInstance(ServiceProviderResponseDto, serviceProvider, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a service provider' })
  @ApiResponse({
    status: 200,
    description: 'Service provider updated successfully',
    type: GetSingleServiceProviderDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateServiceProviderDto: UpdateServiceProviderDto,
    @BusinessId() businessId: string,
  ) {
    const serviceProvider = await this.serviceProviderService.update(
      id,
      updateServiceProviderDto,
      businessId,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Service provider updated successfully',
      timestamp: new Date().toISOString(),
      data: plainToInstance(ServiceProviderResponseDto, serviceProvider, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a service provider' })
  @ApiResponse({
    status: 200,
    description: 'Service provider deleted successfully',
  })
  async delete(
    @Param('id') id: string,
    @BusinessId() businessId: string,
  ) {
    return await this.serviceProviderService.delete(id, businessId);
  }
}
