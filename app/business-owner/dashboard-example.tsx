"use client";

import React from "react";
import { useAuth } from "@/contexts";
import {
  DashboardLayout,
  Sidebar,
  Navbar,
  NavbarUserMenu,
  Container,
  PageHeader,
  Card,
  Button,
  Badge,
  Table,
  Alert,
  Dropdown,
  type SidebarItem,
  type Column,
} from "@/components";

// Example dashboard with new design system
export default function BusinessOwnerDashboardExample() {
  const { user, logout } = useAuth();

  // Sidebar navigation items
  const sidebarItems: SidebarItem[] = [
    {
      label: "Dashboard",
      href: "/business-owner",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: "Businesses",
      href: "/business-owner/businesses",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      badge: 3,
    },
    {
      label: "Bookings",
      href: "/business-owner/bookings",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      badge: 12,
    },
    {
      label: "Services",
      href: "/business-owner/services",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: "Team",
      href: "/business-owner/team",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      label: "Settings",
      href: "/business-owner/settings",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  // Sample data for table
  const bookings = [
    { id: 1, customer: "John Doe", service: "Haircut", date: "2024-02-15", status: "confirmed", amount: "$50" },
    { id: 2, customer: "Jane Smith", service: "Massage", date: "2024-02-16", status: "pending", amount: "$120" },
    { id: 3, customer: "Bob Johnson", service: "Consultation", date: "2024-02-17", status: "completed", amount: "$80" },
    { id: 4, customer: "Alice Brown", service: "Training", date: "2024-02-18", status: "cancelled", amount: "$200" },
  ];

  const columns: Column<typeof bookings[0]>[] = [
    { key: "customer", label: "Customer" },
    { key: "service", label: "Service" },
    { key: "date", label: "Date" },
    {
      key: "status",
      label: "Status",
      cell: (row) => {
        const variants: Record<string, "success" | "warning" | "destructive" | "default"> = {
          confirmed: "default",
          pending: "warning",
          completed: "success",
          cancelled: "destructive",
        };
        return (
          <Badge variant={variants[row.status]}>
            {row.status}
          </Badge>
        );
      },
    },
    { key: "amount", label: "Amount", className: "font-semibold" },
  ];

  return (
    <DashboardLayout
      sidebar={
        <Sidebar
          items={sidebarItems}
          logo={
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold">
                C
              </div>
              <span className="font-bold text-lg text-gray-900 dark:text-gray-50">
                Cuebites
              </span>
            </div>
          }
          footer={
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-100 dark:bg-gray-800">
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                {user?.firstName?.charAt(0) || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          }
        />
      }
      navbar={
        <Navbar
          sticky
          leftContent={
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                Dashboard
              </h2>
            </div>
          }
          rightContent={
            <>
              <Button variant="ghost" size="sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </Button>
              <NavbarUserMenu
                user={{
                  name: `${user?.firstName} ${user?.lastName}` || "User",
                  email: user?.email,
                }}
                menuItems={[
                  {
                    label: "Profile",
                    onClick: () => console.log("Profile"),
                    icon: (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    ),
                  },
                  {
                    label: "Settings",
                    onClick: () => console.log("Settings"),
                    icon: (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      </svg>
                    ),
                  },
                  {
                    label: "Logout",
                    onClick: logout,
                    icon: (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    ),
                    danger: true,
                  },
                ]}
              />
            </>
          }
        />
      }
    >
      <Container>
        <PageHeader
          title="Dashboard Overview"
          subtitle="Welcome back! Here's what's happening with your businesses today."
          actions={
            <>
              <Button variant="outline">
                Export Data
              </Button>
              <Button>
                Create Business
              </Button>
            </>
          }
        />

        {/* Alert Example */}
        <Alert variant="info" title="New Feature Available" className="mb-6">
          We've added new analytics tools to help you track your business performance.
        </Alert>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card hover padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Bookings
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-50 mt-2">
                  1,234
                </p>
                <p className="text-sm text-success-600 dark:text-success-400 mt-1">
                  +12% from last month
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card hover padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Revenue
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-50 mt-2">
                  $45,231
                </p>
                <p className="text-sm text-success-600 dark:text-success-400 mt-1">
                  +8% from last month
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card hover padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Businesses
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-50 mt-2">
                  3
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  All verified
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-warning-600 dark:text-warning-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </Card>

          <Card hover padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Team Members
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-50 mt-2">
                  12
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Across all businesses
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-danger-600 dark:text-danger-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Bookings Table */}
        <Card
          title="Recent Bookings"
          subtitle="Your latest booking activity"
          headerAction={
            <Dropdown>
              <Dropdown.Trigger>
                <Button variant="ghost" size="sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </Button>
              </Dropdown.Trigger>
              <Dropdown.Menu>
                <Dropdown.Item>View All</Dropdown.Item>
                <Dropdown.Item>Export</Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item danger>Clear</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          }
          padding="none"
        >
          <div className="p-6">
            <Table columns={columns} data={bookings} hoverable striped />
          </div>
        </Card>
      </Container>
    </DashboardLayout>
  );
}
