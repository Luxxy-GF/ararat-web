'use client';

import React, { useEffect, useState } from 'react';
import { SaveIcon } from 'lucide-react';
import GeneralConfiguration from '@/app/(main)/instances/_components/general-configuration';
import { Button } from 'ui-web/components/button';
import { Spinner } from 'ui-web/components/spinner';
import { toast } from 'sonner';
import { updateInstance } from '../_lib/instance';
import { useInstanceContext } from '../_context/instance';

function hasConfigChanged(
  current: Record<string, string>,
  initial: Record<string, string>,
) {
  const keys = new Set([...Object.keys(current), ...Object.keys(initial)]);

  for (const key of keys) {
    const hasCurrent = Object.prototype.hasOwnProperty.call(current, key);
    const hasInitial = Object.prototype.hasOwnProperty.call(initial, key);

    if (hasCurrent !== hasInitial) {
      return true;
    }

    if (hasCurrent && hasInitial && current[key] !== initial[key]) {
      return true;
    }
  }

  return false;
}

function buildConfigChanges(
  current: Record<string, string>,
  initial: Record<string, string>,
) {
  const changes: Record<string, string | null> = {};
  const keys = new Set([...Object.keys(current), ...Object.keys(initial)]);

  for (const key of keys) {
    const hasCurrent = Object.prototype.hasOwnProperty.call(current, key);
    const hasInitial = Object.prototype.hasOwnProperty.call(initial, key);

    if (hasCurrent && (!hasInitial || current[key] !== initial[key])) {
      changes[key] = current[key];
      continue;
    }

    if (!hasCurrent && hasInitial) {
      changes[key] = null;
    }
  }

  return changes;
}

export default function ConfigurationPage() {
  const { instance, isLoading, isError, mutate } = useInstanceContext();
  const [config, setConfig] = useState<Record<string, string>>({});
  const [initialConfig, setInitialConfig] = useState<Record<string, string>>(
    {},
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Initialize config from instance data
  useEffect(() => {
    const nextConfig = { ...(instance?.config ?? {}) };
    setConfig(nextConfig);
    setInitialConfig({ ...nextConfig });
    setIsDirty(false);
  }, [instance]);

  const handleConfigChange = (newConfig: Record<string, string>) => {
    setConfig(newConfig);
    setIsDirty(hasConfigChanged(newConfig, initialConfig));
  };

  const handleSave = async () => {
    if (!instance) return;

    const changes = buildConfigChanges(config, initialConfig);
    if (Object.keys(changes).length === 0) {
      setIsDirty(false);
      return;
    }

    setIsSaving(true);
    try {
      await updateInstance(instance.name, changes, instance.project ?? null);
      toast.success('Instance configuration updated');
      setInitialConfig({ ...config });
      setIsDirty(false);
      // Revalidate instance data
      mutate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update configuration',
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner />
      </div>
    );
  }

  if (isError || !instance) {
    return (
      <div className="p-4 text-center text-destructive">
        Failed to load instance configuration.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!isDirty || isSaving}>
          {isSaving ? (
            <Spinner className="mr-2 h-4 w-4" />
          ) : (
            <SaveIcon className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>
      <div className="flex-1 border rounded-md overflow-hidden bg-background">
        <GeneralConfiguration
          config={config}
          expandedConfig={instance.expanded_config}
          onConfigChange={handleConfigChange}
          instanceType={instance.type as 'container' | 'virtual-machine'}
        />
      </div>
    </div>
  );
}
