import { executeBatchCheckout } from "../../firebase/repositories/transactionRepository";
import { processCheckout } from "../transactionService";

jest.mock("../../firebase/repositories/transactionRepository", () => ({
  executeBatchCheckout: jest.fn()
}));

describe('Transaction Service - processCheckout (Unit Test)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  })

  it('must send cart content to repository if valid', async () => {
    executeBatchCheckout.mockResolvedValue(); 

    const dummyCart = [
      { barcode: '89910011', name: 'Buku Sidu', qty: 3 },
      { barcode: '89910022', name: 'Pulpen Pilot', qty: 5 },
    ];

    await expect(processCheckout(dummyCart)).resolves.not.toThrow();
    expect(executeBatchCheckout).toHaveBeenCalledWith(dummyCart);
    expect(executeBatchCheckout).toHaveBeenCalledTimes(1);
  })

  it('must throw error if cart content empty', async () => {
    const dummyCart = [];

    await expect(processCheckout(dummyCart)).rejects.toThrow("Keranjang Kosong");
  })
}) 