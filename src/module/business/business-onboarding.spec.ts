import { Test } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { BusinessService } from './business.service';
import { PrismaService } from '../../database/prisma.service';
import { PaginationService } from '../../common/services/pagination.service';
import { SYSTEM_ROLES } from '../../common/constants/permissions';

describe('BusinessService.onboardOwnBusiness', () => {
  let service: BusinessService;
  let prisma: any;
  let txProxy: any;

  beforeEach(async () => {
    txProxy = {
      business: { create: jest.fn() },
      userBusiness: { create: jest.fn() },
    };
    prisma = {
      userBusiness: { findFirst: jest.fn() },
      business: { findUnique: jest.fn() },
      $transaction: jest.fn().mockImplementation(async (fn: any) => fn(txProxy)),
    };

    const module = await Test.createTestingModule({
      providers: [
        BusinessService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: PaginationService,
          useValue: {
            buildPaginationOptions: jest.fn(),
            buildMeta: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(BusinessService);
  });

  const validDto = {
    name: 'Acme Salon',
    slug: 'acme-salon',
    email: 'hello@acme.com',
  };

  it('owner with no existing business: creates Business + UserBusiness owner row', async () => {
    prisma.userBusiness.findFirst.mockResolvedValue(null);
    prisma.business.findUnique.mockResolvedValue(null);
    txProxy.business.create.mockResolvedValue({
      id: 'b1',
      name: 'Acme Salon',
      slug: 'acme-salon',
    });

    const result = await service.onboardOwnBusiness(validDto, 'u1');

    expect(txProxy.business.create).toHaveBeenCalledTimes(1);
    expect(txProxy.userBusiness.create).toHaveBeenCalledWith({
      data: {
        userId: 'u1',
        businessId: 'b1',
        role: SYSTEM_ROLES.BUSINESS_OWNER,
      },
    });
    expect(result).toMatchObject({ id: 'b1', slug: 'acme-salon' });
  });

  it('rejects when caller already has a business with 409', async () => {
    prisma.userBusiness.findFirst.mockResolvedValue({ id: 'ub1' });

    await expect(
      service.onboardOwnBusiness(validDto, 'u1'),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.business.findUnique).not.toHaveBeenCalled();
    expect(txProxy.business.create).not.toHaveBeenCalled();
  });

  it('rejects when slug collides with an existing (non-deleted) business', async () => {
    prisma.userBusiness.findFirst.mockResolvedValue(null);
    prisma.business.findUnique.mockResolvedValue({
      id: 'b-other',
      deletedAt: null,
    });

    await expect(
      service.onboardOwnBusiness(validDto, 'u1'),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(txProxy.business.create).not.toHaveBeenCalled();
  });

  it('allows a slug previously held by a soft-deleted business', async () => {
    prisma.userBusiness.findFirst.mockResolvedValue(null);
    prisma.business.findUnique.mockResolvedValue({
      id: 'b-deleted',
      deletedAt: new Date('2025-01-01'),
    });
    txProxy.business.create.mockResolvedValue({
      id: 'b-new',
      name: 'Acme Salon',
      slug: 'acme-salon',
    });

    const result = await service.onboardOwnBusiness(validDto, 'u1');
    expect(result.id).toBe('b-new');
  });
});
