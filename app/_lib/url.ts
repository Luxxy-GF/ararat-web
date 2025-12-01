export type BuildApiPathOptions = {
  project?: string | null;
  params?: Record<string, string | number | boolean | undefined | null>;
};

// Returns a relative API path with proper query params applied.
// Example: buildApiPath('/1.0/networks', { project, params: { recursion: 1 } })
export function buildApiPath(
  path: string,
  options?: BuildApiPathOptions,
): string {
  const base = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(base, 'http://local'); // dummy origin to use URL utils

  // Preserve existing params in path and add new ones
  if (options?.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
  }

  // Only set project/all-projects if neither already present
  const hasProject = url.searchParams.has('project');
  const hasAllProjects = url.searchParams.has('all-projects');
  if (!hasProject && !hasAllProjects && options && 'project' in options) {
    const proj = options.project;
    if (proj === null || proj === 'all') {
      url.searchParams.set('all-projects', 'true');
    } else if (proj && proj !== '') {
      url.searchParams.set('project', proj);
    }
  }

  const search = url.searchParams.toString();
  return `${url.pathname}${search ? `?${search}` : ''}`;
}
