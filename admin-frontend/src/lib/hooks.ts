import useSWR from 'swr';
import { api } from './api';

export function useDataFetch<T>(endpoint: string | null, deps: any[] = []) {
  const { data, error, isLoading } = useSWR<T>(
    endpoint, 
    api.fetcher,
    { revalidateOnFocus: false }
  );

  return { 
    data, 
    loading: isLoading, 
    error 
  };
}
