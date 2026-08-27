import axios, { type AxiosInstance } from 'axios';
import { beforeEach, describe, expect, it } from 'vitest';
import { demoAdapter } from '../adapter';
import { resetState } from '../store';

const client = (): AxiosInstance => {
  const instance = axios.create({ baseURL: '/api/v1' });
  instance.defaults.adapter = demoAdapter;
  return instance;
};

const withToken = async (): Promise<AxiosInstance> => {
  const api = client();
  const { data } = await api.post('/auth/login-email', {
    email: 'admin@crescebr.com',
    password: 'admin123',
  });
  api.defaults.headers.common.Authorization = `Bearer ${data.data.token}`;
  return api;
};

beforeEach(() => {
  window.localStorage.clear();
  resetState();
});

describe('demo adapter', () => {
  it('strips the API prefix and resolves a route', async () => {
    const { status, data } = await client().get('/products/categories');

    expect(status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('folds axios `params` into the query string', async () => {
    const { data } = await client().get('/products', { params: { category: 'Machinery' } });

    expect(data.data.products.length).toBeGreaterThan(0);
    expect(data.data.products.every((p: { category: string }) => p.category === 'Machinery')).toBe(
      true
    );
  });

  it('serializes dates to ISO strings the way a real response does', async () => {
    // Regression: pages call `createdAt.split('T')`, which throws on a live Date.
    const api = await withToken();
    const { data } = await api.get('/admin/transactions');

    expect(data.data.orders.length).toBeGreaterThan(0);
    for (const order of data.data.orders) {
      expect(typeof order.createdAt).toBe('string');
      expect(() => order.createdAt.split('T')).not.toThrow();
    }

    const quotations = (await api.get('/quotations/admin/all')).data.data;
    expect(typeof quotations[0].createdAt).toBe('string');
  });

  it('rejects a non-2xx response as an AxiosError carrying the status', async () => {
    await expect(client().get('/products/9999')).rejects.toMatchObject({
      response: { status: 404, data: { success: false } },
    });
  });

  it('rejects an unauthenticated call with 401 so the interceptor can log out', async () => {
    await expect(client().get('/auth/me')).rejects.toMatchObject({
      response: { status: 401 },
    });
  });

  it('sends a JSON body through to the handler', async () => {
    const api = client();
    const { data } = await api.post('/auth/login', {
      cnpj: '33.333.333/0001-33',
      password: 'buyer123',
    });

    expect(data.data.user.email).toBe('buyer@example.com');
  });
});
