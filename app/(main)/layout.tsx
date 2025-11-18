import AppSidebar from "@/app/(main)/sidebar";
import { ProjectsProvider } from "@/app/(main)/_context/projects";
import { UserProvider } from "@/app/(main)/_context/user";
import { SiteHeader } from "@/app/(main)/_components/header";
import { SidebarInset, SidebarProvider } from "@/app/_components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const variant = "inset";
  return (
    <UserProvider>
      <SidebarProvider
        defaultOpen={false}
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant={variant} />
        {variant != "inset" ? (
          <>
            <div className="w-full h-full">
              <div className="flex flex-1 flex-col">
                <SiteHeader />

                <div className="@container/main flex flex-1 flex-col gap-2">
                  <div className="p-4  lg:px-6">{children}</div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <SidebarInset>
            <ProjectsProvider>
              <SiteHeader />
              <div className="p-4  lg:px-6">{children}</div>
            </ProjectsProvider>
          </SidebarInset>
        )}
      </SidebarProvider>
    </UserProvider>
  );
}
