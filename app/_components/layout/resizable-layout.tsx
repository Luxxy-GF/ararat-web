'use client';

import * as React from 'react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from 'ui-web/components/resizable';

interface ResizableLayoutProps {
  sidebar: React.ReactNode;
  content: React.ReactNode;
  detail?: React.ReactNode;
  sidebarSize?: number;
  sidebarMinSize?: number;
  sidebarMaxSize?: number;
  contentSize?: number;
  contentMinSize?: number;
  detailSize?: number;
  detailMinSize?: number;
  detailMaxSize?: number;
  className?: string;
}

export function ResizableLayout({
  sidebar,
  content,
  detail,
  sidebarSize = 20,
  sidebarMinSize = 15,
  sidebarMaxSize = 30,
  contentSize = 50,
  contentMinSize = 30,
  detailSize = 30,
  detailMinSize = 25,
  detailMaxSize = 40,
  className = '',
}: ResizableLayoutProps) {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className={`flex h-full ${className}`}
    >
      {/* Sidebar Panel */}
      <ResizablePanel
        defaultSize={sidebarSize}
        minSize={sidebarMinSize}
        maxSize={sidebarMaxSize}
      >
        {sidebar}
      </ResizablePanel>

      <ResizableHandle />

      {/* Content Panel */}
      <ResizablePanel defaultSize={contentSize} minSize={contentMinSize}>
        {content}
      </ResizablePanel>

      {/* Detail Panel (Optional) */}
      {detail && (
        <>
          <ResizableHandle />
          <ResizablePanel
            defaultSize={detailSize}
            minSize={detailMinSize}
            maxSize={detailMaxSize}
          >
            {detail}
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
}
