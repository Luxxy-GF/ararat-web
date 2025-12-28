'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { InstanceProvider, useInstanceContext } from './_context/instance';
import { Spinner } from 'ui-web/components/spinner';
import { Alert, AlertDescription, AlertTitle } from 'ui-web/components/alert';
import { Instance } from '../instances/_lib/instances.d';
import { Button } from 'ui-web/components/button';
import {
  PlayIcon,
  SquareIcon,
  RotateCcwIcon,
  SnowflakeIcon,
  PencilIcon,
  CheckIcon,
  XIcon,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from 'ui-web/components/tabs';
import { OSLogo } from '@/app/_components/OSLogo';
import { getBaseImage } from './_lib/utils';
import {
  performInstanceAction,
  type InstanceAction,
  updateInstance,
  renameInstance,
} from './_lib/instance';
import { Input } from 'ui-web/components/input';
import { toast } from 'sonner';

const INPUT_WIDTH_BUFFER_CH = 4;
const MIN_VISIBLE_CHARACTERS = 1;

function InstanceLayoutContent({ children }: { children: React.ReactNode }) {
  const { name, instance, isLoading, isError, mutate } = useInstanceContext();

  const [isRenaming, setIsRenaming] = React.useState(false);

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

  if (isLoading && !instance) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Spinner className="size-8" />
      </div>
    );
  }

  if ((isError || !instance) && !isRenaming) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {isError?.message || 'Instance not found.'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <InstanceHeader
        instance={instance || ({ name } as Instance)}
        onMutate={mutate}
        onRenameStart={() => setIsRenaming(true)}
        onRenameEnd={() => setIsRenaming(false)}
      />

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
    <InstanceProvider>
      <InstanceLayoutContent>{children}</InstanceLayoutContent>
    </InstanceProvider>
  );
}

// --- Inlined Components ---

const instanceActionDetails: Record<
  InstanceAction,
  { label: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  start: { label: 'Start', Icon: PlayIcon },
  stop: { label: 'Stop', Icon: SquareIcon },
  restart: { label: 'Restart', Icon: RotateCcwIcon },
  freeze: { label: 'Freeze', Icon: SnowflakeIcon },
};

function InstanceHeader({
  instance,
  onMutate,
  onRenameStart,
  onRenameEnd,
}: {
  instance: Instance;
  onMutate: () => Promise<any>;
  onRenameStart: () => void;
  onRenameEnd: () => void;
}) {
  const [actionInFlight, setActionInFlight] =
    React.useState<InstanceAction | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const router = useRouter();

  // Editing state
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [newName, setNewName] = React.useState(instance.name);
  const [isEditingDescription, setIsEditingDescription] = React.useState(false);
  const [newDescription, setNewDescription] = React.useState(
    instance.description || '',
  );
  const [isSaving, setIsSaving] = React.useState(false);

  const handleAction = async (action: InstanceAction) => {
    try {
      setActionError(null);
      setActionInFlight(action);
      await performInstanceAction({ action, instance });
      await onMutate();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to update instance.';
      setActionError(message);
    } finally {
      setActionInFlight(null);
    }
  };

  const handleSaveName = async () => {
    if (newName === instance.name) {
      setIsEditingName(false);
      return;
    }
    try {
      setIsSaving(true);
      onRenameStart();
      await renameInstance({
        name: instance.name,
        newName,
        project: instance.project,
      });
      setIsEditingName(false);
      // Redirect to new URL
      router.push(`/instance?name=${encodeURIComponent(newName)}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to rename instance',
      );
      onRenameEnd();
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDescription = async () => {
    if (newDescription === instance.description) {
      setIsEditingDescription(false);
      return;
    }
    try {
      setIsSaving(true);
      await updateInstance({
        name: instance.name,
        description: newDescription,
        project: instance.project,
      });
      await onMutate();
      toast.success('Description updated successfully');
      setIsEditingDescription(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to update description',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const status = instance.status?.toLowerCase();
  const isRunning = status === 'running';
  const isStopped = status === 'stopped';
  const isFrozen = status === 'frozen';

  const availableActions: InstanceAction[] = [];
  if (isRunning) {
    availableActions.push('stop', 'restart', 'freeze');
  } else if (isStopped) {
    availableActions.push('start');
  } else if (isFrozen) {
    availableActions.push('start');
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-lg border bg-muted">
          <OSLogo brand={getBaseImage(instance)} className="h-8 w-8" />

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

        <div className="flex-1 space-y-1">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-8 w-auto font-bold min-w-[4ch]"
                style={{
                  width: `${Math.max(
                    newName.length,
                    MIN_VISIBLE_CHARACTERS,
                  ) + INPUT_WIDTH_BUFFER_CH}ch`,
                }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') {
                    setIsEditingName(false);
                    setNewName(instance.name);
                  }
                }}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-green-500 hover:text-green-600"
                onClick={handleSaveName}
                disabled={isSaving}
              >
                <CheckIcon className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-red-500 hover:text-red-600"
                onClick={() => {
                  setIsEditingName(false);
                  setNewName(instance.name);
                }}
                disabled={isSaving}
              >
                <XIcon className="size-4" />
              </Button>
            </div>
          ) : (
            <div
              className="group flex items-center gap-2 cursor-pointer"
              onClick={() => setIsEditingName(true)}
            >
              <h1 className="text-2xl font-bold">{instance.name}</h1>
              <PencilIcon className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          )}

          {isEditingDescription ? (
            <div className="flex items-center gap-2">
              <Input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="h-8 w-auto min-w-[10ch]"
                style={{
                  width: `${Math.max(
                    newDescription.length,
                    MIN_VISIBLE_CHARACTERS,
                  ) + INPUT_WIDTH_BUFFER_CH}ch`,
                }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveDescription();
                  if (e.key === 'Escape') {
                    setIsEditingDescription(false);
                    setNewDescription(instance.description || '');
                  }
                }}
              />
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-green-500 hover:text-green-600"
                  onClick={handleSaveDescription}
                  disabled={isSaving}
                >
                  <CheckIcon className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-red-500 hover:text-red-600"
                  onClick={() => {
                    setIsEditingDescription(false);
                    setNewDescription(instance.description || '');
                  }}
                  disabled={isSaving}
                >
                  <XIcon className="size-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="group flex items-center gap-2 cursor-pointer min-h-[24px]"
              onClick={() => setIsEditingDescription(true)}
            >
              <p className="text-muted-foreground">
                {instance.description || 'Add a description...'}
              </p>
              <PencilIcon className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
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
            );
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
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'backups', label: 'Backups' },
  { value: 'console', label: 'Console' },
  { value: 'files', label: 'Files' },
  { value: 'snapshots', label: 'Snapshots' },
  { value: 'devices', label: 'Devices' },
  { value: 'configuration', label: 'Configuration' },
];

function InstanceTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const { name: instanceName } = useInstanceContext();

  // Determine current tab based on pathname
  // /instance -> dashboard
  // /instance/backups -> backups
  // etc.
  const currentTab =
    pathname === '/instance'
      ? 'dashboard'
      : pathname.split('/').pop() || 'dashboard';

  const handleTabChange = (value: string) => {
    if (!instanceName) return;

    const targetPath =
      value === 'dashboard' ? '/instance' : `/instance/${value}`;

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
