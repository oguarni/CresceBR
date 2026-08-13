import {
  assertOrderAccess,
  supplierSuppliesQuotation,
  OrderAccessDeniedError,
} from '../orderAuthorization';
import QuotationItem from '../../models/QuotationItem';

jest.mock('../../models/QuotationItem');
jest.mock('../../models/Product');

const MockQuotationItem = QuotationItem as jest.Mocked<typeof QuotationItem>;

const BUYER_ID = 1;
const SUPPLIER_ID = 2;
const OTHER_SUPPLIER_ID = 99;
const ORDER = { companyId: BUYER_ID, quotationId: 10 };

describe('orderAuthorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('supplierSuppliesQuotation', () => {
    it('returns true when the quotation contains one of the supplier products', async () => {
      (MockQuotationItem.findOne as jest.Mock).mockResolvedValue({ id: 7 });

      await expect(supplierSuppliesQuotation(10, SUPPLIER_ID)).resolves.toBe(true);
      expect(MockQuotationItem.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { quotationId: 10 } })
      );
    });

    it('returns false when no item in the quotation belongs to the supplier', async () => {
      (MockQuotationItem.findOne as jest.Mock).mockResolvedValue(null);

      await expect(supplierSuppliesQuotation(10, OTHER_SUPPLIER_ID)).resolves.toBe(false);
    });

    it('filters by supplierId inside the joined product, not client input', async () => {
      (MockQuotationItem.findOne as jest.Mock).mockResolvedValue(null);

      await supplierSuppliesQuotation(10, SUPPLIER_ID);

      const options = (MockQuotationItem.findOne as jest.Mock).mock.calls[0][0];
      expect(options.include[0]).toMatchObject({
        as: 'product',
        where: { supplierId: SUPPLIER_ID },
        required: true,
      });
    });
  });

  describe('assertOrderAccess', () => {
    it('allows an admin on any order without querying quotation items', async () => {
      await expect(assertOrderAccess(ORDER, 12345, 'admin')).resolves.toBeUndefined();
      expect(MockQuotationItem.findOne).not.toHaveBeenCalled();
    });

    it('allows the customer that placed the order', async () => {
      await expect(assertOrderAccess(ORDER, BUYER_ID, 'customer')).resolves.toBeUndefined();
    });

    it("denies a customer reaching another buyer's order", async () => {
      await expect(assertOrderAccess(ORDER, 777, 'customer')).rejects.toThrow('Access denied');
    });

    it('allows a supplier whose product is in the quotation', async () => {
      (MockQuotationItem.findOne as jest.Mock).mockResolvedValue({ id: 7 });

      await expect(assertOrderAccess(ORDER, SUPPLIER_ID, 'supplier')).resolves.toBeUndefined();
    });

    it('denies a supplier with no product in the quotation', async () => {
      (MockQuotationItem.findOne as jest.Mock).mockResolvedValue(null);

      await expect(assertOrderAccess(ORDER, OTHER_SUPPLIER_ID, 'supplier')).rejects.toThrow(
        OrderAccessDeniedError
      );
    });

    it('fails closed on an unknown or missing role', async () => {
      await expect(assertOrderAccess(ORDER, BUYER_ID, 'auditor')).rejects.toThrow('Access denied');
      await expect(
        assertOrderAccess(ORDER, BUYER_ID, undefined as unknown as string)
      ).rejects.toThrow('Access denied');
    });
  });
});
