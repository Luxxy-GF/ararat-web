import { Instance } from '../../instances/_lib/instances.d';

const OPERATION_POLL_MAX_ATTEMPTS = 20;
const OPERATION_POLL_DELAY_MS = 500;

export type InstanceAction = 'start' | 'stop' | 'restart' | 'freeze';

export async function performInstanceAction({
  action,
  instance,
}: {
  action: InstanceAction;
  instance: Instance;
}) {
  const projectSuffix = instance.project
    ? `?project=${encodeURIComponent(instance.project)}`
    : '';
  const res = await fetch(
    `/1.0/instances/${encodeURIComponent(instance.name)}/state${projectSuffix}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        timeout: 30,
        force: false,
        stateful: false,
      }),
    },
  );
  if (!res.ok) {
    const payload = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(
      payload?.error || `Unable to ${action} instance ${instance.name}`,
    );
  }
}

export async function updateInstance({
  name,
  description,
  project,
}: {
  name: string;
  description: string;
  project?: string;
}) {
  const projectSuffix = project
    ? `?project=${encodeURIComponent(project)}`
    : '';
  const res = await fetch(
    `/1.0/instances/${encodeURIComponent(name)}${projectSuffix}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description,
      }),
    },
  );
  if (!res.ok) {
    const payload = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(payload?.error || `Unable to update instance ${name}`);
  }
}

export async function renameInstance({
  name,
  newName,
  project,
}: {
  name: string;
  newName: string;
  project?: string;
}) {
  const projectSuffix = project
    ? `?project=${encodeURIComponent(project)}`
    : '';
  const res = await fetch(
    `/1.0/instances/${encodeURIComponent(name)}${projectSuffix}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: newName,
      }),
    },
  );
  if (!res.ok) {
    const payload = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(payload?.error || `Unable to rename instance ${name}`);
  }

  const data = await res.json();
  if (data.type === 'async' && data.operation) {
    await waitForOperation(data.operation);
  }
}

async function waitForOperation(operationUrl: string) {
  // Poll the operation URL until it's done
  for (let i = 0; i < OPERATION_POLL_MAX_ATTEMPTS; i++) {
    const res = await fetch(operationUrl);
    if (!res.ok) {
      // If we can't check the operation, assume it failed or network issue
      throw new Error('Failed to check operation status');
    }
    const data = await res.json();
    // Operation status: Running, Pending, Success, Failure, Cancelled
    if (data.metadata?.status === 'Success') {
      return;
    }
    if (data.metadata?.status === 'Failure') {
      throw new Error(data.metadata.err || 'Operation failed');
    }
    if (data.metadata?.status === 'Cancelled') {
      throw new Error('Operation cancelled');
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, OPERATION_POLL_DELAY_MS));
  }
  throw new Error('Operation timed out');
}
