"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useInstance } from "./_hooks/useInstance";
import { Spinner } from "@/app/_components/ui/spinner";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/app/_components/ui/alert";
import { Instance } from "../instances/_lib/instances.d";
import { Button } from "@/app/_components/ui/button";
import {
  PlayIcon,
  SquareIcon,
  RotateCcwIcon,
  SnowflakeIcon,
  ServerIcon,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { OSLogo } from "@/app/_components/OSLogo";
import { getBaseImage } from "./_lib/utils";

function InstanceLayoutContent({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const name = searchParams.get("name");

  const { instance, isLoading, isError, mutate } = useInstance(name);

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
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export default function InstanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<Spinner />}>
      <InstanceLayoutContent>{children}</InstanceLayoutContent>
    </Suspense>
  );
}

// --- Inlined Components ---

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

function InstanceHeader({
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
    availableActions.push("start");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-lg border bg-muted">
          <OSLogo brand={getBaseImage(instance)} className="h-8 w-8 text-muted-foreground" />

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
          {instance.description && (
            <p className="text-muted-foreground">{instance.description}</p>
          )}
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

const TABS = [
  { value: "dashboard", label: "Dashboard" },
  { value: "backups", label: "Backups" },
  { value: "console", label: "Console" },
  { value: "files", label: "Files" },
  { value: "snapshots", label: "Snapshots" },
  { value: "devices", label: "Devices" },
  { value: "configuration", label: "Configuration" },
];

function InstanceTabs() {
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
