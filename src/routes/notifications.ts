import { Router, type Request, type Response } from 'express';

import {
  getInvoiceSnapshot,
  storeInvoiceSnapshot,
  type OReillyInvoiceSnapshot
} from '../data/store.js';

const router = Router();

function buildErrorResponse(code: string, message: string, correlationId: string) {
  return { code, message, correlationId };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isLineItem(item: unknown): item is { line: string; item: string; quantity: number } {
  return (
    isObject(item) &&
    typeof item.line === 'string' &&
    typeof item.item === 'string' &&
    isPositiveInteger(item.quantity)
  );
}

function isInvoiceSnapshot(payload: unknown): payload is OReillyInvoiceSnapshot {
  return (
    isObject(payload) &&
    typeof payload.invoiceNumber === 'string' &&
    typeof payload.counterNumber === 'number' &&
    isObject(payload.customerInfo) &&
    isPositiveInteger(payload.customerInfo.customerNumber) &&
    typeof payload.customerInfo.customerName === 'string' &&
    typeof payload.delivery === 'boolean' &&
    Array.isArray(payload.items) &&
    payload.items.every(isLineItem) &&
    isNonNegativeNumber(payload.invoiceTotal) &&
    typeof payload.createdAt === 'string' &&
    ['remote-pos', 'posrest', 'electronicordering'].includes(String(payload.sourceSystem))
  );
}

function correlationIdFrom(response: Response): string {
  return String(response.locals.correlationId);
}

function readRouteParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

router.post('/stock-transfer-orders/notifications', (request: Request, response: Response) => {
  if (!isInvoiceSnapshot(request.body)) {
    return response.status(400).json(
      buildErrorResponse(
        'INVALID_REQUEST',
        'Invoice snapshot body did not match the expected contract.',
        correlationIdFrom(response)
      )
    );
  }

  const receipt = storeInvoiceSnapshot(request.body);
  return response.status(202).json(receipt);
});

router.get('/invoices/:invoiceNumber', (request: Request, response: Response) => {
  const invoice = getInvoiceSnapshot(readRouteParam(request.params.invoiceNumber));
  if (!invoice) {
    return response.status(404).json(
      buildErrorResponse(
        'NOT_FOUND',
        `Invoice snapshot ${readRouteParam(request.params.invoiceNumber)} was not found.`,
        correlationIdFrom(response)
      )
    );
  }

  return response.json(invoice);
});

export { router as notificationsRouter };
