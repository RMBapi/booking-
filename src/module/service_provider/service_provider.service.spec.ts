import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ServiceProviderService } from './service_provider.service';
import { PaginationService } from '../../common/services/pagination.service';

describe('ServiceProviderService', () => {
  let service: ServiceProviderService;
  let paginationService: jest.Mocked<PaginationService>;

  const mockServiceProvider = {
    id: 'provider-1',
    businessId: 'business-1',
    serviceId: 'service-1',
    userId: 'user-1',
    description: 'Experienced professional',
    impUrl: 'https://example.com/image.png',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    user: { id: 'user-1', firstName: 'John', lastName: 'Doe' },
    service: { id: 'service-1', name: 'Haircut' },
    business: { id: 'business-1', name: 'Test Business' },
  };

  beforeEach(async () => {
    const mockPaginationService = {
      buildPaginationOptions: jest.fn().mockReturnValue({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
      buildMeta: jest.fn().mockReturnValue({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceProviderService,
        {
          provide: PaginationService,
          useValue: mockPaginationService,
        },
      ],
    }).compile();

    service = module.get<ServiceProviderService>(ServiceProviderService);
    paginationService = module.get(PaginationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw error - database layer not implemented', async () => {
      const createDto = {
        serviceId: 'service-1',
        userId: 'user-1',
        description: 'Experienced professional',
      };
      const businessId = 'business-1';

      await expect(service.create(createDto, businessId)).rejects.toThrow(
        'Database layer not implemented',
      );
    });
  });

  describe('findOne', () => {
    it('should throw error - database layer not implemented', async () => {
      await expect(service.findOne('provider-1', 'business-1')).rejects.toThrow(
        'Database layer not implemented',
      );
    });
  });

  describe('update', () => {
    it('should throw error - database layer not implemented', async () => {
      const updateDto = { description: 'Updated description' };

      await expect(
        service.update('provider-1', updateDto, 'business-1'),
      ).rejects.toThrow('Database layer not implemented');
    });
  });

  describe('delete', () => {
    it('should throw error - database layer not implemented', async () => {
      await expect(service.delete('provider-1', 'business-1')).rejects.toThrow(
        'Database layer not implemented',
      );
    });
  });

  describe('findAll', () => {
    it('should throw error - database layer not implemented', async () => {
      const queryDto = { page: 1, limit: 10 };

      await expect(service.findAll(queryDto, 'business-1')).rejects.toThrow(
        'Database layer not implemented',
      );
    });
  });
});
