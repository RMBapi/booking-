import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

describe('BusinessController', () => {
  let controller: BusinessController;
  let service: jest.Mocked<BusinessService>;

  const mockBusiness = {
    id: 'business-1',
    name: 'Test Business',
    slug: 'test-business',
    description: 'Test Description',
    logoUrl: 'https://example.com/logo.png',
    email: 'test@example.com',
    phone: '+1234567890',
    address: '123 Test St',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    const mockBusinessService = {
      findAll: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
      findOneBySlug: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BusinessController],
      providers: [
        {
          provide: BusinessService,
          useValue: mockBusinessService,
        },
      ],
    }).compile();

    controller = module.get<BusinessController>(BusinessController);
    service = module.get(BusinessService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all businesses with 200 status', async () => {
      const queryDto = { page: 1, limit: 10 };
      const mockResult = {
        data: [mockBusiness],
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

      const result = await controller.findAll(queryDto);

      expect(service.findAll).toHaveBeenCalledWith(queryDto);
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.data).toBeDefined();
      expect(result.meta).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('create', () => {
    it('should create a business with 201 status', async () => {
      const createDto: CreateBusinessDto = {
        name: 'Test Business',
        slug: 'test-business',
        email: 'test@example.com',
      };

      service.create.mockResolvedValue(mockBusiness);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.CREATED);
      expect(result.message).toBe('Business created successfully');
      expect(result.data).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('should return a business by ID with 200 status', async () => {
      service.findOne.mockResolvedValue(mockBusiness);

      const result = await controller.findOne('business-1');

      expect(service.findOne).toHaveBeenCalledWith('business-1');
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.data).toBeDefined();
    });
  });

  describe('findOneBySlug', () => {
    it('should return a business by slug with 200 status', async () => {
      service.findOneBySlug.mockResolvedValue(mockBusiness);

      const result = await controller.findOneBySlug('test-business');

      expect(service.findOneBySlug).toHaveBeenCalledWith('test-business');
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.data).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update a business with 200 status', async () => {
      const updateDto: UpdateBusinessDto = { name: 'Updated Business' };
      const updatedBusiness = { ...mockBusiness, ...updateDto };

      service.update.mockResolvedValue(updatedBusiness);

      const result = await controller.update('business-1', updateDto);

      expect(service.update).toHaveBeenCalledWith('business-1', updateDto);
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('Business updated successfully');
    });
  });

  describe('delete', () => {
    it('should delete a business with 200 status', async () => {
      service.delete.mockResolvedValue({
        message: 'Business deleted successfully',
      });

      const result = await controller.delete('business-1');

      expect(service.delete).toHaveBeenCalledWith('business-1');
      expect(result).toEqual({ message: 'Business deleted successfully' });
    });
  });
});
