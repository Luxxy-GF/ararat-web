"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useInstance } from "./_hooks/useInstance";
import { InstanceHeader } from "./_components/InstanceHeader";
import { InstanceTabs } from "./_components/InstanceTabs";
import { Spinner } from "@/app/_components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/app/_components/ui/alert";

function InstanceLayoutContent({ children }: { children: React.ReactNode }) {
    const searchParams = useSearchParams();
    const name = searchParams.get("name");

    const { instance, isLoading, isError, mutate } = useInstance(name, {
        refreshInterval: 3000,
    });

    if (!name) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Missing Parameter</AlertTitle>
                <AlertDescription>
                    The "name" query parameter is required.
                </AlertDescription>
            </Alert>
        );
    }

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <Spinner className="size-8" />
            </div>
        );
    }

    if (isError || !instance) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    {isError?.message || "Instance not found."}
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <InstanceHeader instance={instance} onMutate={mutate} />

            <div className="flex flex-col gap-4">
                <InstanceTabs />
                <div className="mt-4">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default function InstanceLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<Spinner />}>
            <InstanceLayoutContent>{children}</InstanceLayoutContent>
        </Suspense>
    );
}
