"use client";

import DataTable from "@/components/ui/data-table";
import CreateInstance from "./createInstance";
import { Input } from "@/components/ui/input";
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const data = [
  {
    name: "test",
    type: "container",
    status: "Stopped",
  },
  {
    name: "ubuntu",
    type: "virtual-machine",
    status: "Running",
  },
];

const columns = [
  {
    header: "Name",
    accessorKey: "name",
  },
  {
    header: "Description",
    accessorKey: "description",
    enableSorting: true,
  },
  {
    header: "Status",
    accessorKey: "status",
    enableSorting: true,
  },

  {
    header: "Memory",
    accessorKey: "memory",
    enableSorting: true,
  },
  {
    header: "Root Filesystem",
    accessorKey: "rootfs",
    enableSorting: true,
  },
  {
    header: "Type",
    accessorKey: "type",
    enableSorting: true,
  },
];
export default function Instances() {
  const [search, setSearch] = React.useState("");
  const isValidating = false;
  const isLoading = false;
  return (
    <>
      <div className="flex mb-4">
        <p className="text-2xl font-semibold my-auto">Instances</p>
        {!isLoading ? (
          <Input
            placeholder="Search instances..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ml-auto hidden sm:block sm:w-1/3 lg:w-1/4 xl:w-1/5 mr-4"
          />
        ) : (
          <Skeleton className="ml-auto hidden sm:block sm:w-1/3 lg:w-1/4 xl:w-1/5 mr-4 h-10" />
        )}
        <CreateInstance className="ml-auto sm:ml-0" />
      </div>
      {!isLoading ? (
        <DataTable
          enableSelection={true}
          data={data}
          cols={columns}
          className={`${isValidating ? "animate-pulse" : ""}`}
          stringFilter={search}
        />
      ) : (
        <>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full mt-1" />
          <Skeleton className="h-10 w-full mt-1" />
        </>
      )}
    </>
  );
}
