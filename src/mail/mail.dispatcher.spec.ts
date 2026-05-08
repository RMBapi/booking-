import { Test, TestingModule } from '@nestjs/testing';
import { MailDispatcher } from './mail.dispatcher';
import { MAIL_ADAPTER } from './mail.tokens';
import { PrismaService } from '../database/prisma.service';
import { MailAdapter, SendEmailRequest } from './mail.types';

describe('MailDispatcher', () => {
  let dispatcher: MailDispatcher;
  let adapter: MailAdapter & { send: jest.Mock };
  let prisma: { failedEmail: { create: jest.Mock } };

  const baseReq: SendEmailRequest = {
    to: 'jane@example.com',
    template: 'invitation',
    payload: { businessName: 'Acme' },
    rendered: { subject: 'hi', html: '<p>hi</p>', text: 'hi' },
  };

  beforeEach(async () => {
    adapter = {
      name: 'test',
      send: jest.fn(),
    };
    prisma = { failedEmail: { create: jest.fn().mockResolvedValue({}) } };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailDispatcher,
        { provide: MAIL_ADAPTER, useValue: adapter },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    dispatcher = module.get(MailDispatcher);
    // Make the backoff fast for testing.
    (MailDispatcher as any).BACKOFF_MS = [0, 0, 0];
  });

  it('sendNow succeeds on first attempt', async () => {
    adapter.send.mockResolvedValueOnce(undefined);
    await dispatcher.sendNow(baseReq);
    expect(adapter.send).toHaveBeenCalledTimes(1);
    expect(prisma.failedEmail.create).not.toHaveBeenCalled();
    expect(dispatcher.getMetrics()).toContainEqual({
      template: 'invitation',
      status: 'sent',
      count: 1,
    });
  });

  it('retries up to 3 times then dead-letters', async () => {
    adapter.send.mockRejectedValue(new Error('boom'));
    await dispatcher.sendNow(baseReq);

    expect(adapter.send).toHaveBeenCalledTimes(3);
    expect(prisma.failedEmail.create).toHaveBeenCalledTimes(1);
    expect(prisma.failedEmail.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        toEmail: 'jane@example.com',
        template: 'invitation',
        attempts: 3,
        error: 'boom',
      }),
    });
    expect(dispatcher.getMetrics()).toContainEqual({
      template: 'invitation',
      status: 'dead_letter',
      count: 1,
    });
  });

  it('succeeds on second attempt without dead-lettering', async () => {
    adapter.send
      .mockRejectedValueOnce(new Error('flake'))
      .mockResolvedValueOnce(undefined);
    await dispatcher.sendNow(baseReq);

    expect(adapter.send).toHaveBeenCalledTimes(2);
    expect(prisma.failedEmail.create).not.toHaveBeenCalled();
  });

  it('does not throw when DB write itself fails — email is just lost', async () => {
    adapter.send.mockRejectedValue(new Error('boom'));
    prisma.failedEmail.create.mockRejectedValue(new Error('db down'));

    await expect(dispatcher.sendNow(baseReq)).resolves.toBeUndefined();
  });

  it('enqueue returns synchronously (does not block on adapter)', async () => {
    let resolved = false;
    adapter.send.mockImplementation(
      () =>
        new Promise<void>((res) => {
          setTimeout(() => {
            resolved = true;
            res();
          }, 50);
        }),
    );

    dispatcher.enqueue(baseReq);

    // enqueue returned immediately; adapter has not yet been awaited.
    expect(resolved).toBe(false);
    expect(adapter.send).not.toHaveBeenCalled();

    // Allow event loop + setImmediate + setTimeout to fire.
    await new Promise((r) => setTimeout(r, 80));
    expect(resolved).toBe(true);
  });
});
