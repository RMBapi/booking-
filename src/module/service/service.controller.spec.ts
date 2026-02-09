import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { ServiceController } from './service.controller';
import { ServiceService } from './service.service';
import { ServiceStatus } from '../../../types/enums';

describe('ServiceController', () => {
  let controller: ServiceController;
  let service: jest.Mocked<ServiceService>;

  const mockService = {
    id: 'service-1',
    name: 'Haircut',
    description: 'Professional haircut',
    price: 50.0,
    status: ServiceStatus.Active,
    priceDisplayMode: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockServiceService = {
      findAll: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceController],
      providers: [
        {
          provide: ServiceService,
          useValue: mockServiceService,
        },
      ],
    }).compile();

    controller = module.get<ServiceController>(ServiceController);
    service = module.get(ServiceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all services with 200 status', async () => {
      const queryDto = { page: 1, limit: 10 };
      const businessId = 'business-1';
      const mockResult = {
        data: [mockService],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      service.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(queryDto, businessId);

      expect(service.findAll).toHaveBeenCalledWith(queryDto, businessId);
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.data).toBeDefined();
    });
  });

  describe('create', () => {
    it('should create a service with 201 status', async () => {
      const createDto = {
        name: 'Haircut',
        price: 50.0,
        status: ServiceStatus.Active,
      };
      const businessId = 'business-1';

      service.create.mockResolvedValue(mockService);

      const result = await controller.create(createDto, businessId);

      expect(service.create).toHaveBeenCalledWith(createDto, businessId);
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.CREATED);
    });
  });

  describe('findOne', () => {
    it('should return a service by ID with 200 status', async () => {
      const businessId = 'business-1';

      service.findOne.mockResolvedValue(mockService);

      const result = await controller.findOne('service-1', businessId);

      expect(service.findOne).toHaveBeenCalledWith('service-1', businessId);
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
    });
  });

  describe('update', () => {
    it('should update a service with 200 status', async () => {
      const updateDto = { name: 'Updated Service' };
      const businessId = 'business-1';
      const updatedService = { ...mockService, ...updateDto };

      service.update.mockResolvedValue(updatedService);

      const result = await controller.update('service-1', updateDto, businessId);

      expect(service.update).toHaveBeenCalledWith('service-1', updateDto, businessId);
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
    });
  });

  describe('delete', () => {
    it('should delete a service with 200 status', async () => {
      const businessId = 'business-1';

      service.delete.mockResolvedValue({
        message: 'Service deleted successfully',
      });

      const result = await controller.delete('service-1', businessId);

      expect(service.delete).toHaveBeenCalledWith('service-1', businessId);
      expect(result).toEqual({ message: 'Service deleted successfully' });
    });
  });
});
