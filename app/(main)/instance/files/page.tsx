"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { useInstance } from "../_hooks/useInstance";
import { Files } from "../_components/Files";
import { Spinner } from "@/app/_components/ui/spinner";

export default function FilesPage() {
    const searchParams = useSearchParams();
    const name = searchParams.get("name");
    const { instance, isLoading } = useInstance(name);

    if (isLoading) {
        return <Spinner />;
    }

    if (!instance) {
        return null;
    }

    return <Files instance={instance} />;
}
