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
import { Prisma } from '@prisma/client';
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceQueryDto } from './dto/service-query.dto';
import { GetSingleServiceDto } from './dto/response/get-single-service.dto';
import { GetAllServiceDto } from './dto/response/get-all-service.dto';
import { ServiceResponseDto } from './dto/response/service-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { RequireFeature } from '../../common/decorators/require-feature.decorator';
import { FEATURES } from '../../common/constants/permissions';

@ApiTags('Service')
@ApiBearerAuth('JWT-auth')
@Controller('service')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

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
  @RequireFeature(FEATURES.VIEW_SERVICES)
  @ApiOperation({ summary: 'Get all services with pagination' })
  @ApiResponse({ status: 200, type: GetAllServiceDto })
  async findAll(
    @Query() queryDto: ServiceQueryDto,
    @Headers('x-business-id') businessId: string,
    @CurrentUser() user: JwtUser,
  ) {
    const result = await this.serviceService.findAll(
      queryDto,
      businessId,
      user.id,
    );
    const normalizedData = result.data.map((s) => this.normalizeService(s));
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
  @RequireFeature(FEATURES.MANAGE_SERVICES)
  @ApiOperation({ summary: 'Create a new service' })
  @ApiResponse({ status: 201, type: GetSingleServiceDto })
  async create(
    @Body() dto: CreateServiceDto,
    @Headers('x-business-id') businessId: string,
    @CurrentUser() user: JwtUser,
  ) {
    const service = await this.serviceService.create(dto, businessId, user.id);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Service created successfully',
      timestamp: new Date().toISOString(),
      data: plainToInstance(
        ServiceResponseDto,
        this.normalizeService(service),
        {
          excludeExtraneousValues: true,
        },
      ),
    };
  }

  @Get(':id')
  @RequireFeature(FEATURES.VIEW_SERVICES)
  @ApiOperation({ summary: 'Get a single service' })
  @ApiResponse({ status: 200, type: GetSingleServiceDto })
  async findOne(
    @Param('id') id: string,
    @Headers('x-business-id') businessId: string,
    @CurrentUser() user: JwtUser,
  ) {
    const service = await this.serviceService.findOne(id, businessId, user.id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Service fetched successfully',
      timestamp: new Date().toISOString(),
      data: plainToInstance(
        ServiceResponseDto,
        this.normalizeService(service),
        {
          excludeExtraneousValues: true,
        },
      ),
    };
  }

  @Patch(':id')
  @RequireFeature(FEATURES.MANAGE_SERVICES)
  @ApiOperation({ summary: 'Update a service' })
  @ApiResponse({ status: 200, type: GetSingleServiceDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
    @Headers('x-business-id') businessId: string,
    @CurrentUser() user: JwtUser,
  ) {
    const service = await this.serviceService.update(
      id,
      dto,
      businessId,
      user.id,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Service updated successfully',
      timestamp: new Date().toISOString(),
      data: plainToInstance(
        ServiceResponseDto,
        this.normalizeService(service),
        {
          excludeExtraneousValues: true,
        },
      ),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequireFeature(FEATURES.MANAGE_SERVICES)
  @ApiOperation({ summary: 'Delete a service' })
  async delete(
    @Param('id') id: string,
    @Headers('x-business-id') businessId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.serviceService.delete(id, businessId, user.id);
  }
}
