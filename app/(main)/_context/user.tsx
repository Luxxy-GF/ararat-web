'use client';

import { createContext, use } from 'react';
import AuthenticationContext, { AuthenticationContextData } from '../../_context/authentication';
import { useClientCertificate } from '@/app/_hooks/certificate';
import IsClientContext from '@/app/_context/isClient';

interface UserContextData {
  id: string;
}
interface UserContextTLSData extends UserContextData {
  name: string;
}
const UserContext = createContext({
  data: null as UserContextTLSData | null,
  isLoading: true,
  isValidating: true,
});
export default UserContext;
export function UserProvider({ children }: { children: React.ReactNode }) {
  const {
    isValidating: authIsValidating,
    isLoading: authIsLoading,
    data: authData,
  } = use(AuthenticationContext);
  const {
    data: tlsData,
    isValidating: tlsIsValidating,
    isLoading: tlsIsLoading,
  } = useClientCertificate(authData?.identifier);
  const isClient = use(IsClientContext);
  return (
    <UserContext
      value={{
        data: tlsData
          ? {
              id: (authData as AuthenticationContextData).identifier as string,
              name: tlsData.name,
            }
          : null,
        isLoading: authIsLoading || tlsIsLoading || !isClient,
        isValidating: authIsValidating || tlsIsValidating || !isClient,
      }}
    >
      {children}
    </UserContext>
  );
}
