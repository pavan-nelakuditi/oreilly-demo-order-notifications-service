import inject from 'light-my-request';
import { beforeEach, describe, expect, it } from 'vitest';

import { app } from '../src/app.js';
import { resetStore } from '../src/data/store.js';

describe('order-notifications-service', () => {
  beforeEach(() => {
    resetStore();
  });

  const snapshot = {
    invoiceNumber: 'INV-1001',
    legacyId: 'LEG-8821',
    enactorId: 'EN-4411',
    counterNumber: 4,
    customerInfo: {
      customerNumber: 90001234,
      customerName: 'OReilly Test Garage'
    },
    delivery: true,
    items: [
      { line: 'IGN', item: 'PLUG-001', quantity: 2 }
    ],
    invoiceTotal: 33.48,
    createdAt: '2026-04-10T12:00:00.000Z',
    sourceSystem: 'remote-pos'
  } as const;

  it('stores and retrieves an invoice snapshot', async () => {
    const createResponse = await inject(app, {
      method: 'POST',
      url: '/stock-transfer-orders/notifications',
      payload: snapshot
    });
    const createBody = createResponse.json();

    expect(createResponse.statusCode).toBe(202);
    expect(createBody.status).toBe('accepted');

    const getResponse = await inject(app, {
      method: 'GET',
      url: '/invoices/INV-1001'
    });
    const getBody = getResponse.json();
    expect(getResponse.statusCode).toBe(200);
    expect(getBody.invoiceNumber).toBe('INV-1001');
    expect(getBody.customerInfo.customerNumber).toBe(90001234);
  });

  it('returns duplicate for a repeated invoice notification', async () => {
    await inject(app, {
      method: 'POST',
      url: '/stock-transfer-orders/notifications',
      payload: snapshot
    });

    const duplicateResponse = await inject(app, {
      method: 'POST',
      url: '/stock-transfer-orders/notifications',
      payload: snapshot
    });
    const duplicateBody = duplicateResponse.json();

    expect(duplicateResponse.statusCode).toBe(202);
    expect(duplicateBody.status).toBe('duplicate');
  });

  it('returns a contract-shaped error when invoice snapshots are missing', async () => {
    const response = await inject(app, {
      method: 'GET',
      url: '/invoices/INV-9999'
    });
    const body = response.json();

    expect(response.statusCode).toBe(404);
    expect(body.code).toBe('NOT_FOUND');
    expect(typeof body.correlationId).toBe('string');
  });
});
