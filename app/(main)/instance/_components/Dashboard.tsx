"use client";

import React from "react";
import { Instance } from "../../instances/_lib/instances.d";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/app/_components/ui/card";
import { Progress } from "@/app/_components/ui/progress";
import { Badge } from "@/app/_components/ui/badge";
import {
    formatBytes,
    formatDate,
    getRootDiskUsage,
    getNetworkDetails,
    getBaseImage,
    getRootDiskPool,
    calcUsagePercent,
} from "../_lib/utils";

export function Dashboard({ instance }: { instance: Instance }) {
    const memoryUsage = instance.state?.memory?.usage ?? 0;
    const memoryTotal =
        instance.state?.memory?.total ?? instance.state?.memory?.usage_peak;
    const memoryPercent = calcUsagePercent(memoryUsage, memoryTotal);

    const diskUsage = getRootDiskUsage(instance.state) ?? 0;
    const diskTotal = instance.state?.disk?.root?.total;
    const diskPercent = calcUsagePercent(diskUsage, diskTotal);

    const networkDetails = getNetworkDetails(instance);
    const baseImage = getBaseImage(instance);
    const rootDiskPool = getRootDiskPool(instance);

    const [cpuPercent, setCpuPercent] = React.useState<number>(0);
    const lastCpuUsage = React.useRef<number | null>(null);
    const lastTime = React.useRef<number | null>(null);

    React.useEffect(() => {
        const currentUsage = instance.state?.cpu?.usage;
        const currentTime = Date.now();

        if (currentUsage !== undefined && lastCpuUsage.current !== null && lastTime.current !== null) {
            const usageDelta = currentUsage - lastCpuUsage.current;
            const timeDelta = (currentTime - lastTime.current) * 1000000; // ms to ns

            if (timeDelta > 0) {
                const percent = (usageDelta / timeDelta) * 100;
                setCpuPercent(Math.max(0, percent));
            }
        }

        if (currentUsage !== undefined) {
            lastCpuUsage.current = currentUsage;
            lastTime.current = currentTime;
        }
    }, [instance.state?.cpu?.usage]);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader>
                    <CardTitle>Resources</CardTitle>
                    <CardDescription>Current resource usage</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Memory</span>
                            <span>
                                {formatBytes(memoryUsage)}
                                {memoryTotal ? ` / ${formatBytes(memoryTotal)}` : ""}
                            </span>
                        </div>
                        <Progress value={memoryPercent} className="h-2" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Root Disk</span>
                            <span>
                                {formatBytes(diskUsage)}
                                {diskTotal ? ` / ${formatBytes(diskTotal)}` : ""}
                            </span>
                        </div>
                        <Progress value={diskPercent} className="h-2" />
                    </div>
                    {instance.state?.cpu?.usage !== undefined && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">CPU Usage</span>
                                <span>{cpuPercent.toFixed(2)}%</span>
                            </div>
                            <Progress value={cpuPercent} className="h-2" />
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Networking</CardTitle>
                    <CardDescription>Network interfaces and addresses</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <span className="text-sm font-medium text-muted-foreground">IPv4</span>
                        <div className="flex flex-wrap gap-2">
                            {networkDetails.ipv4.length > 0 ? (
                                networkDetails.ipv4.map((ip) => (
                                    <Badge key={ip} variant="secondary" className="font-mono">
                                        {ip}
                                    </Badge>
                                ))
                            ) : (
                                <span className="text-sm text-muted-foreground">—</span>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <span className="text-sm font-medium text-muted-foreground">IPv6</span>
                        <div className="flex flex-wrap gap-2">
                            {networkDetails.ipv6.length > 0 ? (
                                networkDetails.ipv6.map((ip) => (
                                    <Badge key={ip} variant="secondary" className="font-mono">
                                        {ip}
                                    </Badge>
                                ))
                            ) : (
                                <span className="text-sm text-muted-foreground">—</span>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <span className="text-sm font-medium text-muted-foreground">MAC</span>
                        <div className="flex flex-wrap gap-2">
                            {networkDetails.macs.length > 0 ? (
                                networkDetails.macs.map((mac) => (
                                    <Badge key={mac} variant="outline" className="font-mono">
                                        {mac}
                                    </Badge>
                                ))
                            ) : (
                                <span className="text-sm text-muted-foreground">—</span>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Metadata</CardTitle>
                    <CardDescription>Instance details and configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Project</span>
                        <span>{instance.project ?? "default"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Base Image</span>
                        <span className="truncate max-w-[150px]" title={baseImage ?? ""}>{baseImage ?? "—"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Architecture</span>
                        <span>{instance.architecture ?? "—"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Location</span>
                        <span>{instance.location ?? "—"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Storage Pool</span>
                        <span>{rootDiskPool ?? "—"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">PID</span>
                        <span>{instance.state?.pid ?? "—"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Created</span>
                        <span>{formatDate(instance.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Used</span>
                        <span>{formatDate(instance.last_used_at)}</span>
                    </div>
                </CardContent>
            </Card>

            <Card className="md:col-span-2 lg:col-span-3">
                <CardHeader>
                    <CardTitle>Profiles</CardTitle>
                    <CardDescription>Applied configuration profiles</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {instance.profiles?.length ? (
                            instance.profiles.map((profile) => (
                                <Badge key={profile} variant="outline">
                                    {profile}
                                </Badge>
                            ))
                        ) : (
                            <span className="text-sm text-muted-foreground">No profiles applied</span>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
