'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useInstance } from '../_hooks/instance';
import GeneralConfiguration from '@/app/(main)/instances/_components/general-configuration';
import { Button } from 'ui-web/components/button';
import { Spinner } from 'ui-web/components/spinner';
import { toast } from 'sonner';
import { updateInstance } from '../_lib/instance';
import { mutate } from 'swr';
import { SaveIcon } from 'lucide-react';

export default function ConfigurationPage() {
  const searchParams = useSearchParams();
  const instanceName = searchParams.get('name');
  const { instance, isLoading, isError } = useInstance(instanceName);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Initialize config from instance data
  useEffect(() => {
    if (instance?.config) {
      // Filter out volatile keys if necessary, but GeneralConfiguration handles display filtering
      setConfig(instance.config);
    }
  }, [instance]);

  const handleConfigChange = (newConfig: Record<string, string>) => {
    setConfig(newConfig);
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!instanceName) return;

    setIsSaving(true);
    try {
      await updateInstance(instanceName, config, instance?.project);
      toast.success('Instance configuration updated');
      setIsDirty(false);
      // Revalidate instance data
      mutate(`/1.0/instances/${instanceName}?recursion=1`);
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
