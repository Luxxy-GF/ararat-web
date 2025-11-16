"use client";

import * as React from "react";
import {
  IconAlertTriangle,
  IconSettings,
  type Icon,
} from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  BoxesIcon,
  ChevronsLeftRightEllipsisIcon,
  CircleDotDashedIcon,
  HardDriveIcon,
  PackageIcon,
  SquaresIntersectIcon,
} from "lucide-react";

type NavMainItem = {
  title: string;
  url: string;
  icon?: Icon;
  subItems?: {
    title: string;
    url: string;
  }[];
};

const data = {
  navMain: [
    {
      title: "Instances",
      url: "/instances",
      icon: BoxesIcon,
    },
    {
      title: "Networking",
      url: "#",
      subItems: [
        {
          title: "Networks",
          url: "/networks",
        },
        {
          title: "IPAM",
          url: "/networks/ipam",
        },
        {
          title: "ACLs",
          url: "/networks/acls",
        },
      ],
      icon: ChevronsLeftRightEllipsisIcon,
    },
    {
      title: "Storage",
      url: "#",
      subItems: [
        {
          title: "Pools",
          url: "/storage/pools",
        },
        {
          title: "Volumes",
          url: "/storage/volumes",
        },
        {
          title: "ISOs",
          url: "/storage/isos",
        },
        {
          title: "Buckets",
          url: "/storage/buckets",
        },
      ],
      icon: HardDriveIcon,
    },
    {
      title: "Images",
      url: "/images",
      icon: PackageIcon,
    },
    {
      title: "Profiles",
      url: "/profiles",
      icon: SquaresIntersectIcon,
    },
    {
      title: "Operations",
      url: "/operations",
      icon: CircleDotDashedIcon,
    },
  ],
  navSecondary: [
    {
      title: "Configuration",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Warnings",
      url: "#",
      icon: IconAlertTriangle,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex w-full mt-4 group-data-[collapsible=icon]:mt-0">
          <img
            src="/ui/images/hyeLogo.png"
            alt="Ararat"
            className="h-full my-auto ml-auto max-h-8 group-data-[collapsible=icon]:max-h-5 group-data-[collapsible=icon]:mr-auto transition-all"
          />
          <div className="text-justify my-auto mr-auto ml-2">
            <p className="font-semibold font-[Poppins] inline-block text-[28px] leading-0 group-data-[collapsible=icon]:hidden">
              Ararat
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain as NavMainItem[]} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
