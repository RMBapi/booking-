"use client";

import React from "react";
import { Table, Button, Column } from "@/components";
import { useGetBusinessOwners, useToggleBusinessOwnerStatus } from "../hooks";
import { BusinessOwnerWithBusinesses } from "@/types";

export const BusinessOwnerList: React.FC = () => {
  const { businessOwners, isLoading } = useGetBusinessOwners();
  const { toggleStatus, isToggling } = useToggleBusinessOwnerStatus();

  const columns: Column<BusinessOwnerWithBusinesses>[] = [
    {
      key: "firstName",
      label: "Name",
      cell: (row) => `${row.firstName} ${row.lastName}`,
    },
    {
      key: "email",
      label: "Email",
    },
    {
      key: "phone",
      label: "Phone",
    },
    {
      key: "isActive",
      label: "Status",
      cell: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            row.isActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {row.isActive ? "Active" : "Deactive"}
        </span>
      ),
    },
    {
      key: "userBusinesses",
      label: "Businesses",
      cell: (row) => row.userBusinesses?.length || 0,
    },
    {
      key: "createdAt",
      label: "Created",
      cell: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "N/A",
    },
    {
      key: "id",
      label: "Actions",
      cell: (row) => (
        <Button
          size="sm"
          variant={row.isActive ? "destructive" : "success"}
          onClick={() => toggleStatus({ id: row.id, isActive: row.isActive ?? false })}
          disabled={isToggling}
        >
          {row.isActive ? "Deactivate" : "Activate"}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Table
        columns={columns}
        data={businessOwners}
        isLoading={isLoading}
        emptyMessage="No business owners found"
      />
    </div>
  );
};
