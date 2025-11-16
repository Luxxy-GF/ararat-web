"use client";

import {
  IconCertificate,
  IconDotsVertical,
  IconLogout,
} from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { use } from "react";
import { AuthenticationContext } from "./context/authentication";
import { UserContext } from "./context/user";

export function NavUser() {
  const { isMobile } = useSidebar();
  const { data: authData, isValidating: authIsValidating } = use(
    AuthenticationContext
  );
  const { data: userData, isValidating: userIsValidating } = use(UserContext);
  return (
    <SidebarMenu className={authIsValidating ? "animate-pulse" : ""}>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={authData?.method == "tls"}>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                {authData?.method == "oidc" ? (
                  <>
                    <AvatarImage src={"user.avatar"} alt={"user.name"} />
                    <AvatarFallback className="rounded-lg">JM</AvatarFallback>
                  </>
                ) : (
                  <>
                    <IconCertificate className="m-auto" />
                  </>
                )}
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span
                  className={`truncate font-medium ${
                    userIsValidating ? "animate-pulse" : ""
                  }`}
                >
                  {authData?.method == "tls" ? userData?.name : "First Last"}
                </span>
                <span className="text-muted-foreground truncate text-xs">
                  {authData?.method == "tls"
                    ? authData?.identifier?.slice(0, 12)
                    : "email@hyecompany.com"}
                </span>
              </div>
              {authData?.method == "oidc" ? (
                <IconDotsVertical className="ml-auto size-4" />
              ) : null}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {authData?.method == "tls" ? (
                    <IconCertificate className="m-auto" />
                  ) : (
                    <>
                      <AvatarImage src={"user.avatar"} alt={"user.name"} />
                      <AvatarFallback className="rounded-lg">JM</AvatarFallback>
                    </>
                  )}
                </Avatar>
                <div
                  className={`grid flex-1 text-left text-sm leading-tight ${
                    authIsValidating ? "animate-pulse" : ""
                  }`}
                >
                  {authData?.method == "tls" ? (
                    <>
                      <span
                        className={`truncate font-medium ${
                          userIsValidating ? "animate-pulse" : ""
                        }`}
                      >
                        {userData?.name}
                      </span>
                      <span className="text-muted-foreground truncate text-xs">
                        {authData?.identifier?.slice(0, 12)}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="truncate font-medium">First Last</span>
                      <span className="text-muted-foreground truncate text-xs">
                        {"user.email"}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            {authData?.method == "oidc" ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <IconLogout />
                  Log out
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
