import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '../../database/prisma.service';
import { SYSTEM_ROLES } from '../../common/constants/permissions';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      business: { create: jest.fn() },
      userBusiness: { create: jest.fn() },
      businessInvitation: { create: jest.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(AdminService);
  });

  describe('createBusinessOwner', () => {
    const validDto = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      phone: '+61400000000',
      password: 'super-secret-pw',
      confirmPassword: 'super-secret-pw',
    };

    it('creates only the User row — no Business, no UserBusiness, no invitation', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'u1',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        phone: '+61400000000',
        isActive: false,
        systemRole: SYSTEM_ROLES.BUSINESS_OWNER,
        passwordChangeRequired: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createBusinessOwner(validDto);

      expect(prisma.user.create).toHaveBeenCalledTimes(1);
      const args = prisma.user.create.mock.calls[0][0];
      expect(args.data.isActive).toBe(false);
      expect(args.data.systemRole).toBe(SYSTEM_ROLES.BUSINESS_OWNER);
      expect(args.data.passwordChangeRequired).toBe(true);
      expect(args.data.passwordHash).toEqual(expect.any(String));
      expect(args.data.passwordHash).not.toBe(validDto.password);

      expect(prisma.business.create).not.toHaveBeenCalled();
      expect(prisma.userBusiness.create).not.toHaveBeenCalled();
      expect(prisma.businessInvitation.create).not.toHaveBeenCalled();

      expect(result).toMatchObject({
        id: 'u1',
        email: 'jane@example.com',
        isActive: false,
        passwordChangeRequired: true,
        systemRole: SYSTEM_ROLES.BUSINESS_OWNER,
      });
    });

    it('rejects mismatched password / confirmPassword with 400', async () => {
      await expect(
        service.createBusinessOwner({
          ...validDto,
          confirmPassword: 'something-else',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('rejects duplicate email with 409', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'existing' });
      await expect(
        service.createBusinessOwner(validDto),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('setBusinessOwnerActivation', () => {
    it('updates isActive only, not other fields', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'u1' });
      prisma.user.update.mockResolvedValue({
        id: 'u1',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@x',
        phone: '+1',
        isActive: true,
        systemRole: SYSTEM_ROLES.BUSINESS_OWNER,
        passwordChangeRequired: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.setBusinessOwnerActivation('u1', true);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { isActive: true },
        select: expect.any(Object),
      });
      expect(result.isActive).toBe(true);
    });

    it('throws NotFound when target is not a Business_owner', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      await expect(
        service.setBusinessOwnerActivation('u-missing', false),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
