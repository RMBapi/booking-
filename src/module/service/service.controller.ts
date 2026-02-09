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
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceQueryDto } from './dto/service-query.dto';
import { GetSingleServiceDto } from './dto/response/get-single-service.dto';
import { GetAllServiceDto } from './dto/response/get-all-service.dto';
import { plainToInstance } from 'class-transformer';
import { ServiceResponseDto } from './dto/response/service-response.dto';
import { BusinessId } from '../../common/decorators/business.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Prisma } from '@prisma/client';

@ApiTags('Service')
@ApiBearerAuth('JWT-auth')
@Controller('service')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  /**
   * Helper method to normalize Prisma.Decimal to number for response DTOs
   */
  private normalizeService(service: any) {
    return {
      ...service,
      price:
        service.price instanceof Prisma.Decimal
          ? service.price.toNumber()
          : Number(service.price),
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all services with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Services fetched successfully',
    type: GetAllServiceDto,
  })
  async findAll(
    @Query() queryDto: ServiceQueryDto,
    @BusinessId() businessId: string,
    @CurrentUser() user: any,
  ) {
    const result = await this.serviceService.findAll(queryDto, businessId, user.id);

    // Normalize Decimal to number for each service
    const normalizedData = result.data.map((service) =>
      this.normalizeService(service),
    );

    const transformedData = plainToInstance(
      ServiceResponseDto,
      normalizedData,
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
  @ApiOperation({ summary: 'Create a new service' })
  @ApiResponse({
    status: 201,
    description: 'Service created successfully',
    type: GetSingleServiceDto,
  })
  async create(
    @Body() createServiceDto: CreateServiceDto,
    @BusinessId() businessId: string,
    @CurrentUser() user: any,
  ) {
    const service = await this.serviceService.create(createServiceDto, businessId, user.id);
    
    // Normalize Decimal to number before transformation
    const normalizedService = this.normalizeService(service);
    
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Service created successfully',
      timestamp: new Date().toISOString(),
      data: plainToInstance(ServiceResponseDto, normalizedService, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single service' })
  @ApiResponse({
    status: 200,
    description: 'Service fetched successfully',
    type: GetSingleServiceDto,
  })
  async findOne(
    @Param('id') id: string,
    @BusinessId() businessId: string,
    @CurrentUser() user: any,
  ) {
    const service = await this.serviceService.findOne(id, businessId, user.id);
    
    // Normalize Decimal to number before transformation
    const normalizedService = this.normalizeService(service);
    
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Service fetched successfully',
      timestamp: new Date().toISOString(),
      data: plainToInstance(ServiceResponseDto, normalizedService, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a service' })
  @ApiResponse({
    status: 200,
    description: 'Service updated successfully',
    type: GetSingleServiceDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @BusinessId() businessId: string,
    @CurrentUser() user: any,
  ) {
    const service = await this.serviceService.update(id, updateServiceDto, businessId, user.id);
    
    // Normalize Decimal to number before transformation
    const normalizedService = this.normalizeService(service);
    
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Service updated successfully',
      timestamp: new Date().toISOString(),
      data: plainToInstance(ServiceResponseDto, normalizedService, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a service' })
  @ApiResponse({
    status: 200,
    description: 'Service deleted successfully',
  })
  async delete(
    @Param('id') id: string,
    @BusinessId() businessId: string,
    @CurrentUser() user: any,
  ) {
    return await this.serviceService.delete(id, businessId, user.id);
  }
}
