"use client";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { GlobeIcon, Grid2X2PlusIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />

        <h1 className="text-base font-medium">Instances</h1>
        <Select defaultValue="all">
          <SelectTrigger size="sm" className="ml-auto">
            <SelectValue placeholder="Select Project" />
          </SelectTrigger>
          <SelectContent className="max-h-[9000px]">
            <SelectItem value="all">
              <GlobeIcon />
              All Projects
            </SelectItem>
            <SelectGroup>
              <SelectLabel>Projects</SelectLabel>
              <SelectItem value="project-1">Project 1</SelectItem>
              <SelectItem value="project-2">Project 2</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectItem value="new">
              <Grid2X2PlusIcon />
              New Project
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </header>
  );
}
