"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { useInstance } from "./_hooks/useInstance";
import { Dashboard } from "./_components/Dashboard";
import { Spinner } from "@/app/_components/ui/spinner";

export default function InstancePage() {
    const searchParams = useSearchParams();
    const name = searchParams.get("name");

    // Data is already fetched in layout, but we fetch here to get the data for the component
    // SWR will dedupe the request
    const { instance, isLoading } = useInstance(name);

    if (isLoading) {
        return <Spinner />;
    }

    if (!instance) {
        return null; // Layout handles error display
    }

    return <Dashboard instance={instance} />;
}
