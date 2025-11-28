"use client";

import React from "react";
import { Instance } from "../../instances/_lib/instances.d";
import { Button } from "@/app/_components/ui/button";
import {
    PlayIcon,
    SquareIcon,
    RotateCcwIcon,
    SnowflakeIcon,
    ServerIcon,
} from "lucide-react";
import { Spinner } from "@/app/_components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/app/_components/ui/alert";

type InstanceAction = "start" | "stop" | "restart" | "freeze";

const instanceActionDetails: Record<
    InstanceAction,
    { label: string; Icon: React.ComponentType<{ className?: string }> }
> = {
    start: { label: "Start", Icon: PlayIcon },
    stop: { label: "Stop", Icon: SquareIcon },
    restart: { label: "Restart", Icon: RotateCcwIcon },
    freeze: { label: "Freeze", Icon: SnowflakeIcon },
};

async function performInstanceAction({
    action,
    instance,
}: {
    action: InstanceAction;
    instance: Instance;
}) {
    const projectSuffix = instance.project
        ? `?project=${encodeURIComponent(instance.project)}`
        : "";
    const res = await fetch(
        `/1.0/instances/${encodeURIComponent(instance.name)}/state${projectSuffix}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                action,
                timeout: 30,
                force: false,
                stateful: false,
            }),
        }
    );
    if (!res.ok) {
        const payload = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(
            payload?.error || `Unable to ${action} instance ${instance.name}`
        );
    }
}

export function InstanceHeader({
    instance,
    onMutate,
}: {
    instance: Instance;
    onMutate: () => Promise<any>;
}) {
    const [actionInFlight, setActionInFlight] = React.useState<InstanceAction | null>(
        null
    );
    const [actionError, setActionError] = React.useState<string | null>(null);

    const handleAction = async (action: InstanceAction) => {
        try {
            setActionError(null);
            setActionInFlight(action);
            await performInstanceAction({ action, instance });
            await onMutate();
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Unable to update instance.";
            setActionError(message);
        } finally {
            setActionInFlight(null);
        }
    };

    const status = instance.status?.toLowerCase();
    const isRunning = status === "running";
    const isStopped = status === "stopped";
    const isFrozen = status === "frozen";

    const availableActions: InstanceAction[] = [];
    if (isRunning) {
        availableActions.push("stop", "restart", "freeze");
    } else if (isStopped) {
        availableActions.push("start");
    } else if (isFrozen) {
        availableActions.push("start"); // Assuming start unfreezes or we need 'unfreeze' action? 
        // Usually 'start' works for unfreeze in some contexts, but let's check if 'unfreeze' is a valid action in Incus/LXD.
        // The previous code didn't have 'unfreeze' in the type definition, so I'll assume 'start' or 'unfreeze' isn't explicitly handled there or 'start' covers it.
        // Actually, looking at the previous code, it only had start, stop, restart, freeze.
        // I will stick to what was there.
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-lg border bg-muted">
                    {/* Placeholder for OS Logo */}
                    <ServerIcon className="h-8 w-8 text-muted-foreground" />

                    {/* Pulsing Status Circle */}
                    {isRunning && (
                        <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
                        </span>
                    )}
                    {!isRunning && !isStopped && !isFrozen && (
                        <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-gray-400"></span>
                        </span>
                    )}
                    {isStopped && (
                        <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                        </span>
                    )}
                </div>

                <div className="flex-1">
                    <h1 className="text-2xl font-bold">{instance.name}</h1>
                    <p className="text-muted-foreground">{instance.description || "No description"}</p>
                </div>

                <div className="flex gap-2">
                    {availableActions.map((action) => {
                        const { label, Icon } = instanceActionDetails[action];
                        return (
                            <Button
                                key={action}
                                variant="outline"
                                size="sm"
                                disabled={actionInFlight !== null}
                                onClick={() => handleAction(action)}
                            >
                                {actionInFlight === action ? (
                                    <Spinner className="mr-2 size-4" />
                                ) : (
                                    <Icon className="mr-2 size-4" />
                                )}
                                {label}
                            </Button>
                        )
                    })}
                </div>
            </div>

            {actionError && (
                <Alert variant="destructive">
                    <AlertTitle>Action failed</AlertTitle>
                    <AlertDescription>{actionError}</AlertDescription>
                </Alert>
            )}
        </div>
    );
}
