export interface LineItemQuantity {
  line: string;
  item: string;
  quantity: number;
}

export interface InvoiceCustomerSnapshot {
  customerNumber: number;
  customerName: string;
  customerAddress1?: string;
  customerCity?: string;
  customerState?: string;
  customerZipCode?: string;
  customerPhone?: string;
  customerType?: string;
}

export interface OReillyInvoiceSnapshot {
  invoiceNumber: string;
  legacyId?: string;
  enactorId?: string;
  counterNumber: number;
  customerInfo: InvoiceCustomerSnapshot;
  delivery: boolean;
  items: LineItemQuantity[];
  invoiceTotal: number;
  createdAt: string;
  sourceSystem: 'remote-pos' | 'posrest' | 'electronicordering';
}

export interface NotificationReceipt {
  status: 'accepted' | 'duplicate';
  receivedAt: string;
  invoiceNumber: string;
}

const invoices = new Map<string, OReillyInvoiceSnapshot>();

export function storeInvoiceSnapshot(
  snapshot: OReillyInvoiceSnapshot
): NotificationReceipt {
  const alreadyExists = invoices.has(snapshot.invoiceNumber);
  if (!alreadyExists) {
    invoices.set(snapshot.invoiceNumber, snapshot);
  }

  return {
    status: alreadyExists ? 'duplicate' : 'accepted',
    receivedAt: new Date().toISOString(),
    invoiceNumber: snapshot.invoiceNumber
  };
}

export function getInvoiceSnapshot(
  invoiceNumber: string
): OReillyInvoiceSnapshot | undefined {
  return invoices.get(invoiceNumber);
}

export function resetStore(): void {
  invoices.clear();
}

