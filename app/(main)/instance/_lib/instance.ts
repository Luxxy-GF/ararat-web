import { Instance } from '../../instances/_lib/instances.d';

const OPERATION_EVENT_TIMEOUT_MS = 30000;

type OperationEvent = {
  type: 'operation';
  metadata?: {
    id?: string;
    status?: string;
    err?: string;
  };
};

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
  if (typeof window === 'undefined') {
    throw new Error('Operation status requires a browser context');
  }

  const operationId = operationUrl.split('/').pop() ?? operationUrl;
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const socketUrl = `${protocol}://${window.location.host}/1.0/events?type=operation&operation=${encodeURIComponent(
    operationId,
  )}`;

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const socket = new WebSocket(socketUrl);
    const timeoutId = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      socket.close();
      reject(new Error('Operation timed out'));
    }, OPERATION_EVENT_TIMEOUT_MS);

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
    };

    socket.onerror = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Failed to check operation status'));
    };

    socket.onclose = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Operation socket closed before completion'));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as OperationEvent;
        if (data.type !== 'operation') {
          return;
        }

        const metadata = data.metadata;
        if (!metadata?.status) {
          return;
        }

        if (metadata.id && metadata.id !== operationId) {
          return;
        }

        if (metadata.status === 'Success') {
          if (settled) return;
          settled = true;
          cleanup();
          socket.close();
          resolve();
        }

        if (metadata.status === 'Failure') {
          if (settled) return;
          settled = true;
          cleanup();
          socket.close();
          reject(new Error(metadata.err || 'Operation failed'));
        }

        if (metadata.status === 'Cancelled') {
          if (settled) return;
          settled = true;
          cleanup();
          socket.close();
          reject(new Error('Operation cancelled'));
        }
      } catch (error) {
        if (settled) return;
        settled = true;
        cleanup();
        socket.close();
        reject(
          error instanceof Error
            ? error
            : new Error('Failed to parse operation status'),
        );
      }
    };
  });
}
