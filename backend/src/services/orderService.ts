import Order from '../models/Order';
import Quotation from '../models/Quotation';
import User from '../models/User';
import { QuoteService } from './quoteService';
import { OrderStatusService } from './orderStatusService';
import { assertOrderAccess } from './orderAuthorization';

export const orderService = {
  async createFromQuotation(quotationId: number, companyId: number): Promise<Order> {
    const quotation = await Quotation.findOne({ where: { id: quotationId, companyId } });

    if (!quotation) {
      throw new Error('Quotation not found or does not belong to the user');
    }

    if (quotation.status !== 'processed') {
      throw new Error('Only processed quotations can be converted to orders');
    }

    if (quotation.validUntil) {
      const expirationDate = new Date(quotation.validUntil);
      if (new Date() > expirationDate) {
        throw new Error(
          `This quotation expired on ${expirationDate.toLocaleDateString()}. Please request a new quotation.`
        );
      }
    }

    const { calculations } = await QuoteService.getQuotationWithCalculations(quotationId);

    const order = await Order.create({
      companyId,
      quotationId,
      totalAmount: calculations.grandTotal,
      status: 'pending',
    });

    await quotation.update({ status: 'completed' });

    const fullOrder = await Order.findByPk(order.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'role'] },
        { model: Quotation, as: 'quotation' },
      ],
    });

    return fullOrder!;
  },

  async getHistory(
    orderId: string,
    companyId: number,
    userRole: string
  ): Promise<ReturnType<typeof OrderStatusService.getOrderHistory>> {
    const result = await OrderStatusService.getOrderHistory(orderId);

    // Every non-admin role is scoped here. Checking only `customer` used to let
    // any authenticated supplier read any order's history — including the
    // buyer's email and company details on unrelated orders.
    await assertOrderAccess(result.order, companyId, userRole);

    return result;
  },
};
