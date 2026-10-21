"use client";

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { transformAPRows } from '../utils';
import type { APRecord, RawAPRow } from '../types';

interface UseAPResult {
  loading: boolean;
  error:   string | null;
  records: APRecord[];
  refetch: () => void;
}

export function useAccountsPayable(groupId?: string | number): UseAPResult {
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [records, setRecords] = useState<APRecord[]>([]);

  const cleanGroupId = groupId != null ? String(groupId) : "8";

  const fetchData = useCallback(async () => {
    setLoading(true);
    const toastId = toast.loading('Loading accounts payable data...');

    try {
      const params = new URLSearchParams({
        startDate: '2020-01-01',
        endDate:   new Date().toISOString().split('T')[0],
      });

      const res = await fetch(
        `/api/holdings/executive-dashboard/sales/${cleanGroupId}/accounts-payable?${params}`,
        { credentials: 'include' }
      );
      if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);

      const contentType = res.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Backend did not return JSON');
      }

      const result = await res.json();
      const rows: RawAPRow[] = Array.isArray(result)
        ? result
        : (result.rows ?? result.data ?? result.content ?? result.transactions ?? []);

      setRecords(transformAPRows(rows));
      setError(null);
      toast.success('Accounts payable data loaded', { id: toastId });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
      toast.error(`Failed to load data: ${msg}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  }, [cleanGroupId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { loading, error, records, refetch: fetchData };
}
