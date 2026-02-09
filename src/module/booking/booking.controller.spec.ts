import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { BookingStatus, ConfirmationMethod, BookingSource } from '../../../types/enums';

describe('BookingController', () => {
  let controller: BookingController;
  let service: jest.Mocked<BookingService>;

  const mockBooking = {
    id: 'booking-1',
    businessId: 'business-1',
    userId: 'user-1',
    serviceId: 'service-1',
    serviceProviderId: 'provider-1',
    status: BookingStatus.Pending,
    confirmationMethod: ConfirmationMethod.Email,
    bookingSource: BookingSource.Website,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockBookingService = {
      findAll: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      cancel: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        {
          provide: BookingService,
          useValue: mockBookingService,
        },
      ],
    }).compile();

    controller = module.get<BookingController>(BookingController);
    service = module.get(BookingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all bookings with 200 status', async () => {
      const queryDto = { page: 1, limit: 10 };
      const businessId = 'business-1';
      const mockResult = {
        data: [mockBooking],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      service.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(queryDto, businessId);

      expect(service.findAll).toHaveBeenCalledWith(queryDto, businessId);
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
    });
  });

  describe('create', () => {
    it('should create a booking with 201 status', async () => {
      const createDto = {
        userId: 'user-1',
        serviceId: 'service-1',
        serviceProviderId: 'provider-1',
        status: BookingStatus.Pending,
        confirmationMethod: ConfirmationMethod.Email,
        bookingSource: BookingSource.Website,
      };
      const businessId = 'business-1';

      service.create.mockResolvedValue(mockBooking);

      const result = await controller.create(createDto, businessId);

      expect(service.create).toHaveBeenCalledWith(createDto, businessId);
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.CREATED);
    });
  });

  describe('findOne', () => {
    it('should return a booking by ID with 200 status', async () => {
      const businessId = 'business-1';

      service.findOne.mockResolvedValue(mockBooking);

      const result = await controller.findOne('booking-1', businessId);

      expect(service.findOne).toHaveBeenCalledWith('booking-1', businessId);
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
    });
  });

  describe('update', () => {
    it('should update a booking with 200 status', async () => {
      const updateDto = { status: BookingStatus.Confirmed };
      const businessId = 'business-1';
      const updatedBooking = { ...mockBooking, ...updateDto };

      service.update.mockResolvedValue(updatedBooking);

      const result = await controller.update('booking-1', updateDto, businessId);

      expect(service.update).toHaveBeenCalledWith('booking-1', updateDto, businessId);
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
    });
  });

  describe('cancel', () => {
    it('should cancel a booking with 200 status', async () => {
      const businessId = 'business-1';
      const cancellationReason = 'Customer request';
      const cancelledBooking = {
        ...mockBooking,
        status: BookingStatus.Cancelled,
        cancelledAt: new Date(),
        cancellationReason,
      };

      service.cancel.mockResolvedValue(cancelledBooking);

      const result = await controller.cancel('booking-1', cancellationReason, businessId);

      expect(service.cancel).toHaveBeenCalledWith('booking-1', cancellationReason, businessId);
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('Booking cancelled successfully');
    });
  });
});
