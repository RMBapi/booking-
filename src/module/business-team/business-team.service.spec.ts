import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { BusinessTeamService } from './business-team.service';
import { PrismaService } from '../../database/prisma.service';
import {
  ALL_FEATURES,
  FEATURES,
  SYSTEM_ROLES,
} from '../../common/constants/permissions';

function makePrisma(overrides: Partial<any> = {}) {
  const txProxy: any = {
    user: { create: jest.fn(), update: jest.fn() },
    userBusiness: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    userPermission: {
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  };

  const prisma: any = {
    business: {
      findFirst: jest.fn().mockResolvedValue({ id: 'b1', name: 'Acme' }),
    },
    user: { findFirst: jest.fn() },
    userBusiness: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      count: jest.fn().mockResolvedValue(2),
    },
    userPermission: {
      findMany: jest.fn().mockResolvedValue([]),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    $transaction: jest.fn().mockImplementation(async (fn: any) => fn(txProxy)),
    ...overrides,
  };
  return { prisma, txProxy };
}

describe('BusinessTeamService', () => {
  let service: BusinessTeamService;
  let prisma: any;
  let txProxy: any;

  beforeEach(async () => {
    const built = makePrisma();
    prisma = built.prisma;
    txProxy = built.txProxy;

    const module = await Test.createTestingModule({
      providers: [
        BusinessTeamService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(BusinessTeamService);
  });

  describe('addMember', () => {
    it('creates a brand-new user, membership in Pending, and permissions', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      txProxy.user.create.mockResolvedValue({ id: 'u-new' });

      const result = await service.addMember(
        'b1',
        {
          email: 'new@example.com',
          firstName: 'New',
          lastName: 'User',
          phone: '+1',
          role: SYSTEM_ROLES.SERVICE_PROVIDER,
          permissions: [FEATURES.VIEW_BOOKINGS, FEATURES.VIEW_CALENDAR],
          password: 'super-secret-pw',
        },
        'actor',
      );

      expect(result.userId).toBe('u-new');
      expect(result.status).toBe('Pending');
      expect(txProxy.user.create).toHaveBeenCalled();
      expect(txProxy.userBusiness.create).toHaveBeenCalledWith({
        data: {
          userId: 'u-new',
          businessId: 'b1',
          role: SYSTEM_ROLES.SERVICE_PROVIDER,
          status: 'Pending',
        },
      });
      expect(txProxy.userPermission.createMany).toHaveBeenCalledWith({
        data: [
          {
            userId: 'u-new',
            businessId: 'b1',
            permission: FEATURES.VIEW_BOOKINGS,
            grantedBy: 'actor',
          },
          {
            userId: 'u-new',
            businessId: 'b1',
            permission: FEATURES.VIEW_CALENDAR,
            grantedBy: 'actor',
          },
        ],
        skipDuplicates: true,
      });
    });

    it('attaches an existing user without creating a duplicate', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'u-existing' });
      prisma.userBusiness.findUnique.mockResolvedValue(null);

      await service.addMember(
        'b1',
        {
          email: 'old@example.com',
          firstName: 'Old',
          lastName: 'User',
          phone: '+1',
          role: SYSTEM_ROLES.SERVICE_PROVIDER,
          permissions: [FEATURES.VIEW_BOOKINGS],
          password: 'super-secret-pw',
        },
        'actor',
      );

      expect(txProxy.user.create).not.toHaveBeenCalled();
      expect(txProxy.userBusiness.create).toHaveBeenCalledWith({
        data: {
          userId: 'u-existing',
          businessId: 'b1',
          role: SYSTEM_ROLES.SERVICE_PROVIDER,
          status: 'Pending',
        },
      });
    });

    it('throws conflict when an existing user is already a member', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'u-existing' });
      prisma.userBusiness.findUnique.mockResolvedValue({ id: 'ub' });

      await expect(
        service.addMember(
          'b1',
          {
            email: 'old@example.com',
            firstName: 'Old',
            lastName: 'User',
            phone: '+1',
            role: SYSTEM_ROLES.SERVICE_PROVIDER,
            permissions: [],
            password: 'super-secret-pw',
          },
          'actor',
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('skips UserPermission writes when role is Business_owner', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      txProxy.user.create.mockResolvedValue({ id: 'u-new' });

      await service.addMember(
        'b1',
        {
          email: 'owner2@example.com',
          firstName: 'Owner',
          lastName: 'Two',
          phone: '+1',
          role: SYSTEM_ROLES.BUSINESS_OWNER,
          permissions: [FEATURES.VIEW_BOOKINGS],
          password: 'super-secret-pw',
        },
        'actor',
      );

      expect(txProxy.userPermission.createMany).not.toHaveBeenCalled();
    });
  });

  describe('updateMember', () => {
    it('replaces the entire permission set atomically', async () => {
      prisma.userBusiness.findUnique.mockResolvedValue({
        userId: 'u1',
        businessId: 'b1',
        role: SYSTEM_ROLES.SERVICE_PROVIDER,
        status: 'Active',
      });

      await service.updateMember(
        'b1',
        'u1',
        {
          permissions: [FEATURES.VIEW_BOOKINGS],
        },
        'actor',
      );

      expect(txProxy.userPermission.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'u1', businessId: 'b1' },
      });
      expect(txProxy.userPermission.createMany).toHaveBeenCalledWith({
        data: [
          {
            userId: 'u1',
            businessId: 'b1',
            permission: FEATURES.VIEW_BOOKINGS,
            grantedBy: 'actor',
          },
        ],
        skipDuplicates: true,
      });
    });

    it('forbids demoting the last Business_owner', async () => {
      prisma.userBusiness.findUnique.mockResolvedValue({
        userId: 'u1',
        businessId: 'b1',
        role: SYSTEM_ROLES.BUSINESS_OWNER,
        status: 'Active',
      });
      prisma.userBusiness.count.mockResolvedValue(1);

      await expect(
        service.updateMember(
          'b1',
          'u1',
          { role: SYSTEM_ROLES.SERVICE_PROVIDER },
          'actor',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('updates membership status', async () => {
      prisma.userBusiness.findUnique.mockResolvedValue({
        userId: 'u1',
        businessId: 'b1',
        role: SYSTEM_ROLES.SERVICE_PROVIDER,
        status: 'Pending',
      });

      await service.updateMember('b1', 'u1', { status: 'Active' }, 'actor');

      expect(txProxy.userBusiness.update).toHaveBeenCalledWith({
        where: { userId_businessId: { userId: 'u1', businessId: 'b1' } },
        data: { status: 'Active' },
      });
    });

    it('forbids changing your own status', async () => {
      prisma.userBusiness.findUnique.mockResolvedValue({
        userId: 'u1',
        businessId: 'b1',
        role: SYSTEM_ROLES.BUSINESS_OWNER,
        status: 'Active',
      });

      await expect(
        service.updateMember('b1', 'u1', { status: 'Deactivated' }, 'u1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('forbids deactivating the last active Business_owner', async () => {
      prisma.userBusiness.findUnique.mockResolvedValue({
        userId: 'u1',
        businessId: 'b1',
        role: SYSTEM_ROLES.BUSINESS_OWNER,
        status: 'Active',
      });
      prisma.userBusiness.count.mockResolvedValue(1);

      await expect(
        service.updateMember('b1', 'u1', { status: 'Deactivated' }, 'actor'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('removeMember', () => {
    it('forbids removing yourself', async () => {
      await expect(
        service.removeMember('b1', 'u1', 'u1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('forbids removing the last Business_owner', async () => {
      prisma.userBusiness.findUnique.mockResolvedValue({
        role: SYSTEM_ROLES.BUSINESS_OWNER,
      });
      prisma.userBusiness.count.mockResolvedValue(1);

      await expect(
        service.removeMember('b1', 'u1', 'actor'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('removes a normal member and their permissions', async () => {
      prisma.userBusiness.findUnique.mockResolvedValue({
        role: SYSTEM_ROLES.SERVICE_PROVIDER,
      });
      prisma.userBusiness.count.mockResolvedValue(2);

      await service.removeMember('b1', 'u1', 'actor');

      expect(txProxy.userPermission.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'u1', businessId: 'b1' },
      });
      expect(txProxy.userBusiness.delete).toHaveBeenCalled();
    });
  });

  describe('listMembers', () => {
    it('shows Business_owner with implicit ALL_FEATURES and status', async () => {
      prisma.userBusiness.findMany.mockResolvedValue([
        {
          userId: 'u1',
          role: SYSTEM_ROLES.BUSINESS_OWNER,
          status: 'Active',
          createdAt: new Date(),
          user: {
            id: 'u1',
            firstName: 'O',
            lastName: 'Wner',
            email: 'o@x',
            phone: '+1',
            createdAt: new Date(),
          },
        },
      ]);
      prisma.userPermission.findMany.mockResolvedValue([]);

      const result = await service.listMembers('b1');
      expect(result).toHaveLength(1);
      expect(result[0].permissions).toEqual([...ALL_FEATURES]);
      expect(result[0].status).toBe('Active');
    });

    it('shows Service_Provider with their explicit grants', async () => {
      prisma.userBusiness.findMany.mockResolvedValue([
        {
          userId: 'u2',
          role: SYSTEM_ROLES.SERVICE_PROVIDER,
          status: 'Pending',
          createdAt: new Date(),
          user: {
            id: 'u2',
            firstName: 'Svc',
            lastName: 'Prov',
            email: 's@x',
            phone: '+1',
            createdAt: new Date(),
          },
        },
      ]);
      prisma.userPermission.findMany.mockResolvedValue([
        { userId: 'u2', permission: FEATURES.VIEW_BOOKINGS },
      ]);

      const result = await service.listMembers('b1');
      expect(result[0].permissions).toEqual([FEATURES.VIEW_BOOKINGS]);
      expect(result[0].status).toBe('Pending');
    });
  });
});
