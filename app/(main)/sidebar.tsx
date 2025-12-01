'use client';

import * as React from 'react';
import {
  IconAlertTriangle,
  IconCertificate,
  IconDotsVertical,
  IconLogout,
  IconSettings,
  type Icon,
} from '@tabler/icons-react';

import {
  Sidebar as RawSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/app/_components/ui/sidebar';
import {
  BoxesIcon,
  ChevronDownIcon,
  ChevronsLeftRightEllipsisIcon,
  CircleDotDashedIcon,
  HardDriveIcon,
  PackageIcon,
  SquaresIntersectIcon,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../_components/ui/collapsible';
import Link from 'next/link';
import AuthenticationContext from '../_context/authentication';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../_components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../_components/ui/avatar';
import UserContext from './_context/user';
import { Skeleton } from '../_components/ui/skeleton';

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
      title: 'Instances',
      url: '/instances',
      icon: BoxesIcon,
    },
    {
      title: 'Networking',
      url: '#',
      subItems: [
        {
          title: 'Networks',
          url: '/networks',
        },
        {
          title: 'IPAM',
          url: '/networks/ipam',
        },
        {
          title: 'ACLs',
          url: '/networks/acls',
        },
      ],
      icon: ChevronsLeftRightEllipsisIcon,
    },
    {
      title: 'Storage',
      url: '#',
      subItems: [
        {
          title: 'Pools',
          url: '/storage/pools',
        },
        {
          title: 'Volumes',
          url: '/storage/volumes',
        },
        {
          title: 'ISOs',
          url: '/storage/isos',
        },
        {
          title: 'Buckets',
          url: '/storage/buckets',
        },
      ],
      icon: HardDriveIcon,
    },
    {
      title: 'Images',
      url: '/images',
      icon: PackageIcon,
    },
    {
      title: 'Profiles',
      url: '/profiles',
      icon: SquaresIntersectIcon,
    },
    {
      title: 'Operations',
      url: '/operations',
      icon: CircleDotDashedIcon,
    },
  ],
  navSecondary: [
    {
      title: 'Configuration',
      url: '#',
      icon: IconSettings,
    },
    {
      title: 'Warnings',
      url: '#',
      icon: IconAlertTriangle,
    },
  ],
};

export default function Sidebar({
  ...props
}: React.ComponentProps<typeof RawSidebar>) {
  return (
    <RawSidebar collapsible="icon" {...props}>
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
    </RawSidebar>
  );
}
function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
    subItems?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const pathname = usePathname();
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              {item.subItems ? (
                <Collapsible className="group/collapsible">
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <div className="[&>svg]:size-4 ml-auto">
                        <ChevronDownIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180 " />
                      </div>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {item.subItems.map((subItem) => (
                      <SidebarMenuSub key={subItem.title}>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton>
                            <span>{subItem.title}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <Link href={item.url}>
                  <SidebarMenuButton
                    isActive={pathname.startsWith(item.url)}
                    tooltip={item.title}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </Link>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string;
    url: string;
    icon: Icon;
  }[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <a href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function NavUser() {
  const { isMobile } = useSidebar();
  const {
    data: authData,
    isValidating: authIsValidating,
    isLoading: authIsLoading,
  } = React.use(AuthenticationContext);
  const {
    data: userData,
    isValidating: userIsValidating,
    isLoading: userIsLoading,
  } = React.use(UserContext);
  return (
    <SidebarMenu className={authIsValidating ? 'animate-pulse' : ''}>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            asChild
            disabled={authIsLoading ? true : authData?.method == 'tls'}
          >
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                {!authIsLoading ? (
                  authData?.method == 'oidc' ? (
                    <>
                      <AvatarImage src={'user.avatar'} alt={'user.name'} />
                      <AvatarFallback className="rounded-lg">JM</AvatarFallback>
                    </>
                  ) : (
                    <>
                      <IconCertificate className="m-auto" />
                    </>
                  )
                ) : (
                  <>
                    <Skeleton />
                  </>
                )}
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span
                  className={`truncate font-medium ${userIsValidating ? 'animate-pulse' : ''}`}
                >
                  {!userIsLoading
                    ? authData?.method == 'tls'
                      ? userData?.name
                      : 'First Last'
                    : 'ppp'}
                </span>
                <span className="text-muted-foreground truncate text-xs">
                  {!authIsLoading
                    ? authData?.method == 'tls'
                      ? authData?.identifier?.slice(0, 12)
                      : 'email@hyecompany.com'
                    : 'Loading...'}
                </span>
              </div>
              {authData?.method == 'oidc' ? (
                <IconDotsVertical className="ml-auto size-4" />
              ) : null}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {authData?.method == 'tls' ? (
                    <IconCertificate className="m-auto" />
                  ) : (
                    <>
                      <AvatarImage src={'user.avatar'} alt={'user.name'} />
                      <AvatarFallback className="rounded-lg">JM</AvatarFallback>
                    </>
                  )}
                </Avatar>
                <div
                  className={`grid flex-1 text-left text-sm leading-tight ${
                    authIsValidating ? 'animate-pulse' : ''
                  }`}
                >
                  {authData?.method == 'tls' ? (
                    <>
                      <span
                        className={`truncate font-medium ${
                          userIsValidating ? 'animate-pulse' : ''
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
                        {'user.email'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            {authData?.method == 'oidc' ? (
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
