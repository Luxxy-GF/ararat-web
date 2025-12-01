import type { ErrorResponse, StandardResponse } from './response.d';
import type { AddCertificateBody, AddCertificateBodyPublic } from './certificate.d';

export async function addCertificate(
  token: string,
  publicRequest: boolean
): Promise<StandardResponse<undefined>> {
  publicRequest = false;
  const url = `/1.0/certificates${publicRequest ? '?public=true' : ''}`;
  const body: AddCertificateBody | AddCertificateBodyPublic = {
    type: 'client',
    trust_token: token,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    throw Error((data as ErrorResponse<undefined>).error);
  }
  return data as StandardResponse<undefined>;
}
