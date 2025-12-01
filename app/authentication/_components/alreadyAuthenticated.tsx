'use client';
import { use } from 'react';
import AuthenticationContext from '@/app/_context/authentication';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/app/_components/ui/alert';
import { AlertCircleIcon } from 'lucide-react';
import { Button } from '@/app/_components/ui/button';
import Link from 'next/link';
export default function AlreadyAuthenticated() {
  const { data, isValidating } = use(AuthenticationContext);
  return data?.isAuthenticated ? (
    <Alert
      variant="default"
      className={`${isValidating ? 'animate-pulse' : ''} mb-4`}
    >
      <AlertCircleIcon />
      <AlertTitle>You are already authenticated.</AlertTitle>
      <AlertDescription>
        You are already logged into Hye Ararat and do not need to authenticate
        again.
        <Link href="/">
          <Button size="sm">Go to Dashboard</Button>
        </Link>
      </AlertDescription>
    </Alert>
  ) : null;
}
