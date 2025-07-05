import OrderStatusHistory from '../OrderStatusHistory';
import Order from '../Order';

// Mock the database connection
jest.mock('../../config/database', () => ({
  sequelize: {
    define: jest.fn(),
    sync: jest.fn(),
  },
}));

// Mock related models
jest.mock('../Order');

describe('OrderStatusHistory Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Model Definition', () => {
    it('should define OrderStatusHistory model with correct attributes', () => {
      // Arrange
      const expectedAttributes = [
        'id',
        'orderId',
        'status',
        'previousStatus',
        'notes',
        'trackingNumber',
        'estimatedDelivery',
        'changedBy',
        'createdAt',
        'updatedAt',
      ];

      // Act - Create a new instance to verify model structure
      const statusHistory = new OrderStatusHistory();

      // Assert - Verify the model has expected properties
      expectedAttributes.forEach(attr => {
        expect(statusHistory).toHaveProperty(attr);
      });
    });

    it('should have correct data types for model attributes', () => {
      // Arrange
      const statusHistory = new OrderStatusHistory();

      // Act & Assert - Test attribute types
      statusHistory.id = 1;
      expect(typeof statusHistory.id).toBe('number');

      statusHistory.orderId = 'order-123';
      expect(typeof statusHistory.orderId).toBe('string');

      statusHistory.status = 'shipped';
      expect(typeof statusHistory.status).toBe('string');

      statusHistory.previousStatus = 'processing';
      expect(typeof statusHistory.previousStatus).toBe('string');

      statusHistory.notes = 'Status updated';
      expect(typeof statusHistory.notes).toBe('string');

      statusHistory.trackingNumber = 'TRACK123';
      expect(typeof statusHistory.trackingNumber).toBe('string');

      statusHistory.estimatedDelivery = new Date();
      expect(statusHistory.estimatedDelivery).toBeInstanceOf(Date);

      statusHistory.changedBy = 1;
      expect(typeof statusHistory.changedBy).toBe('number');

      statusHistory.createdAt = new Date();
      expect(statusHistory.createdAt).toBeInstanceOf(Date);

      statusHistory.updatedAt = new Date();
      expect(statusHistory.updatedAt).toBeInstanceOf(Date);
    });

    it('should allow null values for optional fields', () => {
      // Arrange
      const statusHistory = new OrderStatusHistory();

      // Act & Assert - Test nullable fields
      statusHistory.previousStatus = null;
      expect(statusHistory.previousStatus).toBeNull();

      statusHistory.notes = null;
      expect(statusHistory.notes).toBeNull();

      statusHistory.trackingNumber = null;
      expect(statusHistory.trackingNumber).toBeNull();

      statusHistory.estimatedDelivery = null;
      expect(statusHistory.estimatedDelivery).toBeNull();

      statusHistory.changedBy = null;
      expect(statusHistory.changedBy).toBeNull();
    });
  });

  describe('Status Transitions', () => {
    it('should handle all valid order statuses', () => {
      // Arrange
      const validStatuses = [
        'pending',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
        'returned',
      ];
      const statusHistory = new OrderStatusHistory();

      // Act & Assert
      validStatuses.forEach(status => {
        statusHistory.status = status as any;
        expect(statusHistory.status).toBe(status);
      });
    });

    it('should track status transitions correctly', () => {
      // Arrange
      const statusHistory = new OrderStatusHistory();

      // Act
      statusHistory.orderId = 'order-123';
      statusHistory.previousStatus = 'pending';
      statusHistory.status = 'processing';
      statusHistory.notes = 'Order started processing';
      statusHistory.changedBy = 1;

      // Assert
      expect(statusHistory.orderId).toBe('order-123');
      expect(statusHistory.previousStatus).toBe('pending');
      expect(statusHistory.status).toBe('processing');
      expect(statusHistory.notes).toBe('Order started processing');
      expect(statusHistory.changedBy).toBe(1);
    });

    it('should handle initial status creation without previous status', () => {
      // Arrange
      const statusHistory = new OrderStatusHistory();

      // Act
      statusHistory.orderId = 'order-456';
      statusHistory.status = 'pending';
      statusHistory.previousStatus = null;
      statusHistory.notes = 'Order created';

      // Assert
      expect(statusHistory.orderId).toBe('order-456');
      expect(statusHistory.status).toBe('pending');
      expect(statusHistory.previousStatus).toBeNull();
      expect(statusHistory.notes).toBe('Order created');
    });

    it('should handle shipping status with tracking information', () => {
      // Arrange
      const statusHistory = new OrderStatusHistory();
      const estimatedDelivery = new Date('2024-12-25');

      // Act
      statusHistory.orderId = 'order-789';
      statusHistory.previousStatus = 'processing';
      statusHistory.status = 'shipped';
      statusHistory.trackingNumber = 'TRACK123456';
      statusHistory.estimatedDelivery = estimatedDelivery;
      statusHistory.notes = 'Package shipped via express delivery';

      // Assert
      expect(statusHistory.orderId).toBe('order-789');
      expect(statusHistory.previousStatus).toBe('processing');
      expect(statusHistory.status).toBe('shipped');
      expect(statusHistory.trackingNumber).toBe('TRACK123456');
      expect(statusHistory.estimatedDelivery).toBe(estimatedDelivery);
      expect(statusHistory.notes).toBe('Package shipped via express delivery');
    });

    it('should handle delivery status with completion notes', () => {
      // Arrange
      const statusHistory = new OrderStatusHistory();

      // Act
      statusHistory.orderId = 'order-101';
      statusHistory.previousStatus = 'shipped';
      statusHistory.status = 'delivered';
      statusHistory.notes = 'Package delivered to customer';
      statusHistory.changedBy = 2;

      // Assert
      expect(statusHistory.orderId).toBe('order-101');
      expect(statusHistory.previousStatus).toBe('shipped');
      expect(statusHistory.status).toBe('delivered');
      expect(statusHistory.notes).toBe('Package delivered to customer');
      expect(statusHistory.changedBy).toBe(2);
    });

    it('should handle cancellation status with reason', () => {
      // Arrange
      const statusHistory = new OrderStatusHistory();

      // Act
      statusHistory.orderId = 'order-102';
      statusHistory.previousStatus = 'pending';
      statusHistory.status = 'cancelled';
      statusHistory.notes = 'Customer requested cancellation';
      statusHistory.changedBy = 3;

      // Assert
      expect(statusHistory.orderId).toBe('order-102');
      expect(statusHistory.previousStatus).toBe('pending');
      expect(statusHistory.status).toBe('cancelled');
      expect(statusHistory.notes).toBe('Customer requested cancellation');
      expect(statusHistory.changedBy).toBe(3);
    });
  });

  describe('Data Validation', () => {
    it('should handle long tracking numbers', () => {
      // Arrange
      const statusHistory = new OrderStatusHistory();
      const longTrackingNumber = 'TRACK' + 'A'.repeat(100);

      // Act
      statusHistory.trackingNumber = longTrackingNumber;

      // Assert
      expect(statusHistory.trackingNumber).toBe(longTrackingNumber);
    });

    it('should handle long notes text', () => {
      // Arrange
      const statusHistory = new OrderStatusHistory();
      const longNotes = 'This is a very long note. ' + 'A'.repeat(1000);

      // Act
      statusHistory.notes = longNotes;

      // Assert
      expect(statusHistory.notes).toBe(longNotes);
    });

    it('should handle special characters in notes', () => {
      // Arrange
      const statusHistory = new OrderStatusHistory();
      const specialNotes = 'Notes with émojis 🚚📦 and special chars: !@#$%^&*()';

      // Act
      statusHistory.notes = specialNotes;

      // Assert
      expect(statusHistory.notes).toBe(specialNotes);
    });

    it('should handle future estimated delivery dates', () => {
      // Arrange
      const statusHistory = new OrderStatusHistory();
      const futureDate = new Date('2025-12-31');

      // Act
      statusHistory.estimatedDelivery = futureDate;

      // Assert
      expect(statusHistory.estimatedDelivery).toBe(futureDate);
    });

    it('should handle past estimated delivery dates', () => {
      // Arrange
      const statusHistory = new OrderStatusHistory();
      const pastDate = new Date('2020-01-01');

      // Act
      statusHistory.estimatedDelivery = pastDate;

      // Assert
      expect(statusHistory.estimatedDelivery).toBe(pastDate);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string values', () => {
      // Arrange
      const statusHistory = new OrderStatusHistory();

      // Act
      statusHistory.notes = '';
      statusHistory.trackingNumber = '';

      // Assert
      expect(statusHistory.notes).toBe('');
      expect(statusHistory.trackingNumber).toBe('');
    });

    it('should handle undefined values for optional fields', () => {
      // Arrange
      const statusHistory = new OrderStatusHistory();

      // Act
      statusHistory.notes = undefined as any;
      statusHistory.trackingNumber = undefined as any;
      statusHistory.estimatedDelivery = undefined as any;
      statusHistory.changedBy = undefined as any;

      // Assert
      expect(statusHistory.notes).toBeUndefined();
      expect(statusHistory.trackingNumber).toBeUndefined();
      expect(statusHistory.estimatedDelivery).toBeUndefined();
      expect(statusHistory.changedBy).toBeUndefined();
    });

    it('should handle very large user IDs for changedBy', () => {
      // Arrange
      const statusHistory = new OrderStatusHistory();
      const largeUserId = Number.MAX_SAFE_INTEGER;

      // Act
      statusHistory.changedBy = largeUserId;

      // Assert
      expect(statusHistory.changedBy).toBe(largeUserId);
    });

    it('should handle very long order IDs', () => {
      // Arrange
      const statusHistory = new OrderStatusHistory();
      const longOrderId = 'order-' + 'A'.repeat(100);

      // Act
      statusHistory.orderId = longOrderId;

      // Assert
      expect(statusHistory.orderId).toBe(longOrderId);
    });

    it('should handle Unicode characters in tracking numbers', () => {
      // Arrange
      const statusHistory = new OrderStatusHistory();
      const unicodeTrackingNumber = 'TRACK-测试-🚚-ÑUMB3R';

      // Act
      statusHistory.trackingNumber = unicodeTrackingNumber;

      // Assert
      expect(statusHistory.trackingNumber).toBe(unicodeTrackingNumber);
    });
  });

  describe('Business Logic Scenarios', () => {
    it('should track complete order lifecycle', () => {
      // Arrange
      const orderId = 'order-lifecycle-test';
      const histories: Partial<OrderStatusHistory>[] = [];

      // Act - Create status history for complete lifecycle
      const statuses = [
        { status: 'pending', previousStatus: null, notes: 'Order created' },
        {
          status: 'processing',
          previousStatus: 'pending',
          notes: 'Order confirmed and processing',
        },
        {
          status: 'shipped',
          previousStatus: 'processing',
          notes: 'Order shipped',
          trackingNumber: 'TRACK123',
        },
        { status: 'delivered', previousStatus: 'shipped', notes: 'Order delivered successfully' },
      ];

      statuses.forEach((statusData, index) => {
        const statusHistory = new OrderStatusHistory();
        statusHistory.orderId = orderId;
        statusHistory.status = statusData.status as any;
        statusHistory.previousStatus = statusData.previousStatus as any;
        statusHistory.notes = statusData.notes;
        statusHistory.trackingNumber = statusData.trackingNumber || null;
        statusHistory.changedBy = 1;
        histories.push(statusHistory);
      });

      // Assert
      expect(histories).toHaveLength(4);
      expect(histories[0].status).toBe('pending');
      expect(histories[0].previousStatus).toBeNull();
      expect(histories[1].status).toBe('processing');
      expect(histories[1].previousStatus).toBe('pending');
      expect(histories[2].status).toBe('shipped');
      expect(histories[2].trackingNumber).toBe('TRACK123');
      expect(histories[3].status).toBe('delivered');
    });

    it('should handle return scenario', () => {
      // Arrange
      const statusHistory = new OrderStatusHistory();

      // Act
      statusHistory.orderId = 'order-return-test';
      statusHistory.previousStatus = 'delivered';
      statusHistory.status = 'returned';
      statusHistory.notes = 'Customer initiated return - product defective';
      statusHistory.changedBy = 2;

      // Assert
      expect(statusHistory.orderId).toBe('order-return-test');
      expect(statusHistory.previousStatus).toBe('delivered');
      expect(statusHistory.status).toBe('returned');
      expect(statusHistory.notes).toBe('Customer initiated return - product defective');
      expect(statusHistory.changedBy).toBe(2);
    });

    it('should handle emergency cancellation', () => {
      // Arrange
      const statusHistory = new OrderStatusHistory();

      // Act
      statusHistory.orderId = 'order-emergency-cancel';
      statusHistory.previousStatus = 'processing';
      statusHistory.status = 'cancelled';
      statusHistory.notes = 'Emergency cancellation - inventory shortage';
      statusHistory.changedBy = 1; // Admin user

      // Assert
      expect(statusHistory.orderId).toBe('order-emergency-cancel');
      expect(statusHistory.previousStatus).toBe('processing');
      expect(statusHistory.status).toBe('cancelled');
      expect(statusHistory.notes).toBe('Emergency cancellation - inventory shortage');
      expect(statusHistory.changedBy).toBe(1);
    });

    it('should handle multiple status changes in sequence', () => {
      // Arrange
      const orderId = 'order-multiple-changes';
      const statusChanges = [
        { from: null, to: 'pending', by: 1 },
        { from: 'pending', to: 'processing', by: 1 },
        { from: 'processing', to: 'cancelled', by: 2 },
        { from: 'cancelled', to: 'pending', by: 1 }, // Reactivated
        { from: 'pending', to: 'processing', by: 1 },
        { from: 'processing', to: 'shipped', by: 1 },
      ];

      // Act
      const histories = statusChanges.map(change => {
        const statusHistory = new OrderStatusHistory();
        statusHistory.orderId = orderId;
        statusHistory.previousStatus = change.from as any;
        statusHistory.status = change.to as any;
        statusHistory.changedBy = change.by;
        return statusHistory;
      });

      // Assert
      expect(histories).toHaveLength(6);
      expect(histories[0].previousStatus).toBeNull();
      expect(histories[0].status).toBe('pending');
      expect(histories[2].status).toBe('cancelled');
      expect(histories[3].previousStatus).toBe('cancelled');
      expect(histories[3].status).toBe('pending'); // Reactivated
      expect(histories[5].status).toBe('shipped');
    });
  });

  describe('Timestamp Handling', () => {
    it('should handle createdAt timestamps', () => {
      // Arrange
      const statusHistory = new OrderStatusHistory();
      const testDate = new Date('2024-01-15T10:30:00Z');

      // Act
      statusHistory.createdAt = testDate;

      // Assert
      expect(statusHistory.createdAt).toBe(testDate);
    });

    it('should handle updatedAt timestamps', () => {
      // Arrange
      const statusHistory = new OrderStatusHistory();
      const testDate = new Date('2024-01-16T14:45:30Z');

      // Act
      statusHistory.updatedAt = testDate;

      // Assert
      expect(statusHistory.updatedAt).toBe(testDate);
    });

    it('should handle timezone variations in timestamps', () => {
      // Arrange
      const statusHistory = new OrderStatusHistory();
      const utcDate = new Date('2024-01-15T10:30:00Z');
      const localDate = new Date('2024-01-15T15:30:00+05:00'); // Same UTC time

      // Act
      statusHistory.createdAt = utcDate;
      statusHistory.updatedAt = localDate;

      // Assert
      expect(statusHistory.createdAt).toBe(utcDate);
      expect(statusHistory.updatedAt).toBe(localDate);
      expect(statusHistory.createdAt.getTime()).toBe(statusHistory.updatedAt.getTime());
    });
  });
});
