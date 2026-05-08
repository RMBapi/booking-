import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import { InvitationService } from '../invitation/invitation.service';
import { SYSTEM_ROLES } from '../../common/constants/permissions';

describe('AuthService.changePassword', () => {
  let service: AuthService;
  let prisma: any;
  let jwt: { sign: jest.Mock };
  let userUpdate: jest.Mock;
  let refreshUpdateMany: jest.Mock;
  let refreshCreate: jest.Mock;

  const baseUser = {
    id: 'u1',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@x',
    isActive: true,
    systemRole: SYSTEM_ROLES.BUSINESS_OWNER,
  };

  beforeEach(async () => {
    userUpdate = jest.fn().mockResolvedValue({});
    refreshUpdateMany = jest.fn().mockResolvedValue({ count: 0 });
    refreshCreate = jest.fn().mockResolvedValue({});

    const txProxy = {
      user: { update: userUpdate },
      refreshToken: {
        updateMany: refreshUpdateMany,
        create: refreshCreate,
      },
    };

    prisma = {
      user: { findUnique: jest.fn() },
      refreshToken: {
        updateMany: refreshUpdateMany,
        create: refreshCreate,
      },
      $transaction: jest.fn().mockImplementation(async (fn: any) => fn(txProxy)),
    };
    jwt = { sign: jest.fn().mockReturnValue('fresh-jwt') };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: InvitationService, useValue: { acceptDuringRegister: jest.fn() } },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('happy path: hashes new password, clears flag, revokes refresh tokens, issues fresh pair', async () => {
    const passwordHash = await bcrypt.hash('old-pw', 10);
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash });

    const result = await service.changePassword(
      'u1',
      {
        currentPassword: 'old-pw',
        newPassword: 'brand-new-pw',
        confirmPassword: 'brand-new-pw',
      },
      { userAgent: 'jest', ip: '127.0.0.1' },
    );

    // Password row updated with new hash + flag cleared.
    expect(userUpdate).toHaveBeenCalledTimes(1);
    const userUpdateArgs = userUpdate.mock.calls[0][0];
    expect(userUpdateArgs.where).toEqual({ id: 'u1' });
    expect(userUpdateArgs.data.passwordChangeRequired).toBe(false);
    expect(userUpdateArgs.data.passwordHash).toEqual(expect.any(String));
    expect(userUpdateArgs.data.passwordHash).not.toBe('brand-new-pw');

    // All outstanding refresh tokens for this user revoked.
    expect(refreshUpdateMany).toHaveBeenCalledWith({
      where: { userId: 'u1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });

    // New refresh row inserted.
    expect(refreshCreate).toHaveBeenCalledTimes(1);

    // Fresh access token signed with the same JWT shape.
    expect(jwt.sign).toHaveBeenCalledWith({
      sub: 'u1',
      email: 'jane@x',
      systemRole: SYSTEM_ROLES.BUSINESS_OWNER,
    });

    expect(result.accessToken).toBe('fresh-jwt');
    expect(result.user.passwordChangeRequired).toBe(false);
    expect(result.refreshToken).toEqual(expect.any(String));
  });

  it('rejects wrong currentPassword with 401', async () => {
    const passwordHash = await bcrypt.hash('actual-pw', 10);
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash });

    await expect(
      service.changePassword('u1', {
        currentPassword: 'guessed-pw',
        newPassword: 'whatever-new',
        confirmPassword: 'whatever-new',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(userUpdate).not.toHaveBeenCalled();
    expect(refreshUpdateMany).not.toHaveBeenCalled();
  });

  it('rejects when newPassword equals currentPassword (post-hash compare)', async () => {
    const passwordHash = await bcrypt.hash('same-pw', 10);
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash });

    await expect(
      service.changePassword('u1', {
        currentPassword: 'same-pw',
        newPassword: 'same-pw',
        confirmPassword: 'same-pw',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(userUpdate).not.toHaveBeenCalled();
  });

  it('rejects when newPassword !== confirmPassword', async () => {
    const passwordHash = await bcrypt.hash('old-pw', 10);
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash });

    await expect(
      service.changePassword('u1', {
        currentPassword: 'old-pw',
        newPassword: 'new-pw-1',
        confirmPassword: 'new-pw-2',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(userUpdate).not.toHaveBeenCalled();
  });

  it('rejects when user is gone or inactive', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.changePassword('u1', {
        currentPassword: 'x',
        newPassword: 'yyyyyyyy',
        confirmPassword: 'yyyyyyyy',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    prisma.user.findUnique.mockResolvedValue({
      ...baseUser,
      passwordHash: 'irrelevant',
      isActive: false,
    });
    await expect(
      service.changePassword('u1', {
        currentPassword: 'x',
        newPassword: 'yyyyyyyy',
        confirmPassword: 'yyyyyyyy',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
