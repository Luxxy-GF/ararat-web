import type { CertificateResponse } from '../_lib/certificate.d';
import useSWR from 'swr';

const fetcher = (...args: Parameters<typeof fetch>) =>
  fetch(...args)
    .then((res) => res.json() as Promise<CertificateResponse>)
    .then((data) => data.metadata);

export function useClientCertificate(id: string | undefined) {
  const { data, error, isLoading, isValidating } = useSWR(
    id ? `/1.0/certificates/${id}` : null,
    fetcher
  );
  return {
    data,
    isLoading,
    isValidating,
    error,
  };
}
