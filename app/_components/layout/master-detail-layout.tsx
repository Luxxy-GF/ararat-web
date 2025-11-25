"use client";

import * as React from "react";
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from "@/app/_components/ui/resizable";
import { useMobile } from "@/app/_components/ui/hooks/use-mobile";

interface MasterDetailLayoutProps {
    // Desktop Props
    sidebar: React.ReactNode;
    content: React.ReactNode;
    detail?: React.ReactNode;

    // Mobile Props
    mobileMaster: React.ReactNode;
    mobileDetail: React.ReactNode;
    showMobileDetail: boolean;

    // Sizing Props
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

export function MasterDetailLayout({
    sidebar,
    content,
    detail,
    mobileMaster,
    mobileDetail,
    showMobileDetail,
    sidebarSize = 20,
    sidebarMinSize = 15,
    sidebarMaxSize = 30,
    contentSize = 50,
    contentMinSize = 30,
    detailSize = 30,
    detailMinSize = 25,
    detailMaxSize = 40,
    className = "",
}: MasterDetailLayoutProps) {
    const { isMobile, containerRef } = useMobile();

    return (
        <div ref={containerRef} className={`h-full w-full border rounded-lg overflow-hidden ${className}`}>
            {isMobile ? (
                <div className="flex flex-col h-full overflow-hidden">
                    {showMobileDetail ? mobileDetail : mobileMaster}
                </div>
            ) : (
                <ResizablePanelGroup direction="horizontal" className="flex h-full">
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
            )}
        </div>
    );
}
