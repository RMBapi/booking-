import { Test } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import { InvitationService } from '../invitation/invitation.service';
import { ALL_FEATURES, SYSTEM_ROLES } from '../../common/constants/permissions';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwt: { sign: jest.Mock };
  let invitations: { acceptDuringRegister: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
      business: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      businessCustomer: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      userBusiness: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      userPermission: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn().mockImplementation(async (fn: any) => fn(prisma)),
    };
    jwt = { sign: jest.fn().mockReturnValue('access-jwt') };
    invitations = { acceptDuringRegister: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: InvitationService, useValue: invitations },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register', () => {
    it('rejects Super_Admin self-registration', async () => {
      await expect(
        service.register({
          firstName: 'X',
          lastName: 'Y',
          email: 'x@y',
          phone: '+1',
          password: 'secret123',
          role: SYSTEM_ROLES.SUPER_ADMIN,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates a Business_owner with auto-business and UserBusiness owner row', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.business.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'u1',
        firstName: 'A',
        lastName: 'B',
        email: 'a@b',
        systemRole: SYSTEM_ROLES.BUSINESS_OWNER,
        passwordChangeRequired: false,
      });
      prisma.business.create.mockResolvedValue({ id: 'b1' });

      const result = await service.register({
        firstName: 'A',
        lastName: 'B',
        email: 'a@b',
        phone: '+1',
        password: 'secret123',
        role: SYSTEM_ROLES.BUSINESS_OWNER,
        businessName: 'Acme',
      });

      expect(prisma.business.create).toHaveBeenCalled();
      expect(prisma.userBusiness.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          businessId: 'b1',
          role: SYSTEM_ROLES.BUSINESS_OWNER,
        },
      });
      expect(jwt.sign).toHaveBeenCalledWith({
        sub: 'u1',
        email: 'a@b',
        systemRole: SYSTEM_ROLES.BUSINESS_OWNER,
      });
      expect(result.accessToken).toBe('access-jwt');
      expect(result.user.systemRole).toBe(SYSTEM_ROLES.BUSINESS_OWNER);
    });

    it('rejects duplicate emails for staff registration', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'existing' });
      await expect(
        service.register({
          firstName: 'A',
          lastName: 'B',
          email: 'a@b',
          phone: '+1',
          password: 'secret123',
          role: SYSTEM_ROLES.SERVICE_PROVIDER,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('links an existing customer to a new business when password matches', async () => {
      const passwordHash = require('bcrypt').hashSync('secret123', 10);
      prisma.business.findFirst.mockResolvedValue({ id: 'b2' });
      prisma.user.findFirst.mockResolvedValue({
        id: 'u1',
        firstName: 'Rafid',
        lastName: 'X',
        email: 'rafid@x',
        systemRole: SYSTEM_ROLES.CUSTOMER,
        passwordChangeRequired: false,
        passwordHash,
      });
      prisma.businessCustomer.findUnique.mockResolvedValue(null);
      prisma.businessCustomer.create.mockResolvedValue({ id: 'bc1' });

      const result = await service.register({
        firstName: 'Rafid',
        lastName: 'X',
        email: 'rafid@x',
        phone: '+1',
        password: 'secret123',
        role: SYSTEM_ROLES.CUSTOMER,
        businessSiteSlug: 'salon-b',
      });

      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(prisma.businessCustomer.create).toHaveBeenCalledWith({
        data: { userId: 'u1', businessId: 'b2' },
      });
      expect(jwt.sign).toHaveBeenCalledWith({
        sub: 'u1',
        email: 'rafid@x',
        systemRole: SYSTEM_ROLES.CUSTOMER,
        businessId: 'b2',
      });
      expect(result.businessId).toBe('b2');
    });
  });

  describe('login', () => {
    it('signs JWT and returns passwordChangeRequired=false on a normal active user', async () => {
      const passwordHash = await bcrypt.hash('right-pw', 10);
      prisma.user.findFirst.mockResolvedValue({
        id: 'u1',
        email: 'a@b',
        passwordHash,
        firstName: 'A',
        lastName: 'B',
        isActive: true,
        systemRole: SYSTEM_ROLES.BUSINESS_OWNER,
        passwordChangeRequired: false,
      });

      const ok = await service.login({ email: 'a@b', password: 'right-pw' });
      expect(ok.user.systemRole).toBe(SYSTEM_ROLES.BUSINESS_OWNER);
      expect(ok.user.passwordChangeRequired).toBe(false);
      expect(jwt.sign).toHaveBeenCalledWith({
        sub: 'u1',
        email: 'a@b',
        systemRole: SYSTEM_ROLES.BUSINESS_OWNER,
      });

      await expect(
        service.login({ email: 'a@b', password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('surfaces passwordChangeRequired=true on the login response when set on the user', async () => {
      const passwordHash = await bcrypt.hash('admin-set-pw', 10);
      prisma.user.findFirst.mockResolvedValue({
        id: 'u1',
        email: 'a@b',
        passwordHash,
        firstName: 'A',
        lastName: 'B',
        isActive: true,
        systemRole: SYSTEM_ROLES.BUSINESS_OWNER,
        passwordChangeRequired: true,
      });

      const ok = await service.login({
        email: 'a@b',
        password: 'admin-set-pw',
      });
      expect(ok.user.passwordChangeRequired).toBe(true);
    });

    it('rejects inactive users with the dedicated message', async () => {
      const passwordHash = await bcrypt.hash('right-pw', 10);
      prisma.user.findFirst.mockResolvedValue({
        id: 'u1',
        email: 'a@b',
        passwordHash,
        firstName: 'A',
        lastName: 'B',
        isActive: false,
        systemRole: SYSTEM_ROLES.BUSINESS_OWNER,
        passwordChangeRequired: true,
      });

      await expect(
        service.login({ email: 'a@b', password: 'right-pw' }),
      ).rejects.toMatchObject({
        message: expect.stringContaining('inactive'),
      });
    });
  });

  describe('getMe', () => {
    it('returns businesses[] with permissions, expanding Business_owner to ALL_FEATURES', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@x',
        phone: '+1',
        systemRole: SYSTEM_ROLES.BUSINESS_OWNER,
        passwordChangeRequired: false,
        createdAt: new Date(),
        isActive: true,
        userBusinesses: [
          {
            role: SYSTEM_ROLES.BUSINESS_OWNER,
            business: {
              id: 'b1',
              name: 'Acme',
              slug: 'a',
              logo: null,
              deletedAt: null,
            },
          },
          {
            role: SYSTEM_ROLES.SERVICE_PROVIDER,
            business: {
              id: 'b2',
              name: 'Other',
              slug: 'o',
              logo: null,
              deletedAt: null,
            },
          },
        ],
        businessCustomers: [],
      });
      prisma.userPermission.findMany.mockResolvedValue([
        { businessId: 'b2', permission: 'view_bookings' },
      ]);

      const me = await service.getMe('u1');
      expect(me.businesses).toHaveLength(2);
      expect(me.businesses[0].permissions).toEqual([...ALL_FEATURES]);
      expect(me.businesses[1].permissions).toEqual(['view_bookings']);
      expect(me.user.passwordChangeRequired).toBe(false);
    });

    it('exposes passwordChangeRequired=true when set on the user', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@x',
        phone: '+1',
        systemRole: SYSTEM_ROLES.BUSINESS_OWNER,
        passwordChangeRequired: true,
        createdAt: new Date(),
        isActive: true,
        userBusinesses: [],
        businessCustomers: [],
      });

      const me = await service.getMe('u1');
      expect(me.user.passwordChangeRequired).toBe(true);
      expect(me.businesses).toEqual([]);
    });

    it('returns customer businesses from businessCustomers memberships', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        firstName: 'Rafid',
        lastName: 'X',
        email: 'rafid@x',
        phone: '+1',
        systemRole: SYSTEM_ROLES.CUSTOMER,
        passwordChangeRequired: false,
        createdAt: new Date(),
        isActive: true,
        userBusinesses: [],
        businessCustomers: [
          {
            status: 'Active',
            business: {
              id: 'b1',
              name: 'Salon A',
              slug: 'salon-a',
              logo: null,
              deletedAt: null,
            },
          },
        ],
      });

      const me = await service.getMe('u1');
      expect(me.businesses).toEqual([
        {
          id: 'b1',
          name: 'Salon A',
          slug: 'salon-a',
          logo: null,
          role: SYSTEM_ROLES.CUSTOMER,
          status: 'Active',
          permissions: [],
        },
      ]);
    });
  });
});
