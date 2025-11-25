# Project Overview

This project (Hye Ararat) is a web app that allows users to manage system/app containers and VMs. It is built on Next.js and drives the Incus API.

## Folder Structure

- Files are in the nearest shared parent of all consumers.
- `_components`, `_utils`, `_lib`, `_hooks`, and `_context` are used at that level.
- Consumer-specific files remain in their respective consumer folders.
- Files shared across consumers are placed in the nearest appropriate parent folder.

### Component Organization

- **Instance-specific components**: Located in `app/(main)/instances/_components/`
  - Example: `app/(main)/instances/_components/devices.tsx` for instance device management
- **Shared components**: Located in `app/(main)/_components/`
  - Example: `app/(main)/_components/devices.tsx` for reusable device editor (used across instances and profiles)

### API Integration Pattern

When creating new API functionality, follow this structure based on the highest-level consumer:

1. **Identify the highest-level component** that uses the functionality
2. **Place files in the nearest shared parent** of all consumers
3. **Naming convention**: Name files based on their domain (e.g., `storagePools.ts` for storage pool APIs, not `server.ts`)

**Example Structure:**

- If `app/(main)/_components/devices.tsx` is the highest consumer:
  - Types: `app/(main)/_lib/storagePools.d.ts`
  - API functions: `app/(main)/_lib/storagePools.ts`
  - Hooks: `app/(main)/_hooks/storagePools.ts`

**Global APIs** (used across multiple top-level routes):

- Types: `app/_lib/server.d.ts`
- API functions: `app/_lib/server.ts`
- Hooks: `app/_hooks/server.ts`

## Libraries

- Tailwind CSS for the frontend
- shadcn/ui based components in `app/_components/ui`
- swr for data fetching
