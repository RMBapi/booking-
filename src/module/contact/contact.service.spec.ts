import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ContactService } from './contact.service';
import { PaginationService } from '../../common/services/pagination.service';

describe('ContactService', () => {
  let service: ContactService;
  let paginationService: jest.Mocked<PaginationService>;

  const mockContact = {
    id: 'contact-1',
    businessId: 'business-1',
    serviceId: 'service-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    bookingTime: { start: '2025-01-01T10:00:00Z', end: '2025-01-01T11:00:00Z' },
    notes: 'Test notes',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
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
        ContactService,
        {
          provide: PaginationService,
          useValue: mockPaginationService,
        },
      ],
    }).compile();

    service = module.get<ContactService>(ContactService);
    paginationService = module.get(PaginationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw error - database layer not implemented', async () => {
      const createDto = {
        serviceId: 'service-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
      };
      const businessId = 'business-1';

      await expect(service.create(createDto, businessId)).rejects.toThrow(
        'Database layer not implemented',
      );
    });
  });

  describe('findOne', () => {
    it('should throw error - database layer not implemented', async () => {
      await expect(service.findOne('contact-1', 'business-1')).rejects.toThrow(
        'Database layer not implemented',
      );
    });
  });

  describe('update', () => {
    it('should throw error - database layer not implemented', async () => {
      const updateDto = { firstName: 'Jane' };

      await expect(
        service.update('contact-1', updateDto, 'business-1'),
      ).rejects.toThrow('Database layer not implemented');
    });
  });

  describe('delete', () => {
    it('should throw error - database layer not implemented', async () => {
      await expect(service.delete('contact-1', 'business-1')).rejects.toThrow(
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
