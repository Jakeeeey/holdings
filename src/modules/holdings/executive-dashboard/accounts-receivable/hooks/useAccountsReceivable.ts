// src/modules/holdings/executive-dashboard/accounts-receivable/hooks/useAccountsReceivable.ts

"use client";

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { transformRawInvoices } from '../utils';
import type { Invoice, RawInvoiceRow } from '../types';

interface UseARResult {
  loading: boolean;
  error:   string | null;
  records: Invoice[];
  refetch: () => void;
}

export function useAccountsReceivable(groupId?: string | number): UseARResult {
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [records, setRecords] = useState<Invoice[]>([]);

  const cleanGroupId = groupId != null ? String(groupId) : "8";

  const fetchData = useCallback(async () => {
    setLoading(true);
    const toastId = toast.loading('Loading accounts receivable data...');

    try {
      const params = new URLSearchParams({
        startDate: '2020-01-01',
        endDate:   new Date().toISOString().split('T')[0],
      });

      const res = await fetch(
        `/api/holdings/executive-dashboard/sales/${cleanGroupId}/accounts-receivable?${params}`,
        { credentials: 'include' }
      );
      if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);

      const contentType = res.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Backend did not return JSON');
      }

      const result = await res.json();
      const rows: RawInvoiceRow[] = Array.isArray(result)
        ? result
        : (result.rows ?? result.data ?? result.content ?? result.invoices ?? []);

      setRecords(transformRawInvoices(rows));
      setError(null);
      toast.success('Accounts receivable data loaded', { id: toastId });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
      toast.error(`Failed to load AR data: ${msg}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  }, [cleanGroupId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { loading, error, records, refetch: fetchData };
}
