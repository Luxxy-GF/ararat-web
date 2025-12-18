export async function createSnapshot(
  instanceName: string,
  name?: string,
  stateful?: boolean,
) {
  console.log('Creating snapshot...', { name, stateful });
  const res = await fetch(`/1.0/instances/${instanceName}/snapshots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name || undefined, stateful }),
  });

  console.log('Create snapshot response status:', res.status);
  const data = await res.json();
  console.log('Create snapshot response data:', data);

  if (!res.ok) {
    throw new Error(data.error || res.statusText);
  }
}

export async function deleteSnapshot(
  instanceName: string,
  snapshotName: string,
) {
  const shortName = snapshotName.split('/').pop() || '';
  const res = await fetch(
    `/1.0/instances/${instanceName}/snapshots/${shortName}`,
    {
      method: 'DELETE',
    },
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || res.statusText);
  }
}

export async function restoreSnapshot(
  instanceName: string,
  snapshotName: string,
) {
  const shortName = snapshotName.split('/').pop() || '';
  const res = await fetch(`/1.0/instances/${instanceName}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ restore: shortName }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || res.statusText);
  }
}

export async function renameSnapshot(
  instanceName: string,
  snapshotName: string,
  newName: string,
) {
  const shortName = snapshotName.split('/').pop() || '';
  const res = await fetch(
    `/1.0/instances/${instanceName}/snapshots/${shortName}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    },
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || res.statusText);
  }
}
