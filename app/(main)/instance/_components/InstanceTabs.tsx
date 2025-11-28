"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";

const TABS = [
    { value: "dashboard", label: "Dashboard" },
    { value: "backups", label: "Backups" },
    { value: "console", label: "Console" },
    { value: "files", label: "Files" },
    { value: "snapshots", label: "Snapshots" },
    { value: "devices", label: "Devices" },
    { value: "configuration", label: "Configuration" },
];

export function InstanceTabs() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const instanceName = searchParams.get("name");

    // Determine current tab based on pathname
    // /instance -> dashboard
    // /instance/backups -> backups
    // etc.
    const currentTab = pathname === "/instance"
        ? "dashboard"
        : pathname.split("/").pop() || "dashboard";

    const handleTabChange = (value: string) => {
        if (!instanceName) return;

        const targetPath = value === "dashboard"
            ? "/instance"
            : `/instance/${value}`;

        router.push(`${targetPath}?name=${instanceName}`);
    };

    return (
        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                {TABS.map((tab) => (
                    <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                    >
                        {tab.label}
                    </TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
    );
}
