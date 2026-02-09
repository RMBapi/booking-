import { Test, TestingModule } from '@nestjs/testing';
import { BusinessService } from './business.service';
import { PaginationService } from '../../common/services/pagination.service';

describe('BusinessService', () => {
  let service: BusinessService;

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
        BusinessService,
        {
          provide: PaginationService,
          useValue: mockPaginationService,
        },
      ],
    }).compile();

    service = module.get<BusinessService>(BusinessService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw error - database layer not implemented', async () => {
      const createDto = {
        name: 'Test Business',
        slug: 'test-business',
        email: 'test@example.com',
      };

      await expect(service.create(createDto)).rejects.toThrow(
        'Database layer not implemented',
      );
    });
  });

  describe('findOne', () => {
    it('should throw error - database layer not implemented', async () => {
      await expect(service.findOne('business-1')).rejects.toThrow(
        'Database layer not implemented',
      );
    });
  });

  describe('findOneBySlug', () => {
    it('should throw error - database layer not implemented', async () => {
      await expect(service.findOneBySlug('test-business')).rejects.toThrow(
        'Database layer not implemented',
      );
    });
  });

  describe('update', () => {
    it('should throw error - database layer not implemented', async () => {
      const updateDto = { name: 'Updated Business' };

      await expect(service.update('business-1', updateDto)).rejects.toThrow(
        'Database layer not implemented',
      );
    });
  });

  describe('delete', () => {
    it('should throw error - database layer not implemented', async () => {
      await expect(service.delete('business-1')).rejects.toThrow(
        'Database layer not implemented',
      );
    });
  });

  describe('findAll', () => {
    it('should throw error - database layer not implemented', async () => {
      const queryDto = { page: 1, limit: 10 };

      await expect(service.findAll(queryDto)).rejects.toThrow(
        'Database layer not implemented',
      );
    });
  });
});
