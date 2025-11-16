"use client";

import { AuthenticationContext } from "@/components/context/authentication";
import { usePathname, useRouter } from "next/navigation";
import { use, useEffect, useRef } from "react";

export default function Router({ children }: { children: React.ReactNode }) {
  const runRef = useRef(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data } = use(AuthenticationContext);
  useEffect(() => {
    if (!runRef.current && pathname != "/") {
      runRef.current = true;
      router.push(pathname);
    }
    console.log(pathname, data);
    if (pathname === "/" && data?.isAuthenticated) {
      router.replace("/instances");
    }
  }, [pathname, data, router]);

  return <>{children}</>;
}
