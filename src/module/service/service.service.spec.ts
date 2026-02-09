import { Test, TestingModule } from '@nestjs/testing';
import { ServiceService } from './service.service';
import { PaginationService } from '../../common/services/pagination.service';
import { ServiceStatus } from '../../types/enums';

describe('ServiceService', () => {
  let service: ServiceService;

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
        ServiceService,
        {
          provide: PaginationService,
          useValue: mockPaginationService,
        },
      ],
    }).compile();

    service = module.get<ServiceService>(ServiceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw error - database layer not implemented', async () => {
      const createDto = {
        name: 'Haircut',
        price: 50.0,
        status: ServiceStatus.Active,
      };
      const businessId = 'business-1';

      await expect(service.create(createDto, businessId)).rejects.toThrow(
        'Database layer not implemented',
      );
    });
  });

  describe('findOne', () => {
    it('should throw error - database layer not implemented', async () => {
      await expect(service.findOne('service-1', 'business-1')).rejects.toThrow(
        'Database layer not implemented',
      );
    });
  });

  describe('update', () => {
    it('should throw error - database layer not implemented', async () => {
      const updateDto = { name: 'Updated Service' };

      await expect(
        service.update('service-1', updateDto, 'business-1'),
      ).rejects.toThrow('Database layer not implemented');
    });
  });

  describe('delete', () => {
    it('should throw error - database layer not implemented', async () => {
      await expect(service.delete('service-1', 'business-1')).rejects.toThrow(
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
