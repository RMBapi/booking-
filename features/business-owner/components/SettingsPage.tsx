"use client";

import React, { useState } from "react";
import {
  Users,
  Shield,
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  UserCog,
  Settings as SettingsIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "@/lib";
import { AddUserModal } from "./AddUserModal";
import { AddRoleModal } from "./AddRoleModal";
import { EditPermissionsModal } from "./EditPermissionsModal";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: "Active" | "Inactive";
  createdAt: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  usersCount: number;
  permissions: string[];
}

const mockUsers: User[] = [
  {
    id: "1",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@example.com",
    role: "Admin",
    status: "Active",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    firstName: "Michael",
    lastName: "Chen",
    email: "michael.chen@example.com",
    role: "Manager",
    status: "Active",
    createdAt: "2024-02-20",
  },
  {
    id: "3",
    firstName: "Emma",
    lastName: "Davis",
    email: "emma.davis@example.com",
    role: "Provider",
    status: "Active",
    createdAt: "2024-03-10",
  },
  {
    id: "4",
    firstName: "James",
    lastName: "Wilson",
    email: "james.wilson@example.com",
    role: "Receptionist",
    status: "Inactive",
    createdAt: "2024-01-05",
  },
];

const mockRoles: Role[] = [
  {
    id: "1",
    name: "Admin",
    description: "Full system access with all permissions",
    usersCount: 1,
    permissions: [
      "services.view",
      "services.create",
      "services.edit",
      "services.delete",
      "bookings.view",
      "team.view",
      "team.create",
    ],
  },
  {
    id: "2",
    name: "Manager",
    description: "Can manage services, bookings, and team members",
    usersCount: 1,
    permissions: [
      "services.view",
      "services.edit",
      "bookings.view",
      "bookings.create",
      "team.view",
    ],
  },
  {
    id: "3",
    name: "Provider",
    description: "Service provider with booking management access",
    usersCount: 5,
    permissions: ["bookings.view", "bookings.edit", "services.view"],
  },
  {
    id: "4",
    name: "Receptionist",
    description: "Front desk staff with booking and customer management",
    usersCount: 2,
    permissions: ["bookings.view", "bookings.create", "bookings.edit"],
  },
];

type TabType = "team" | "roles";

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>("team");
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [isEditPermissionsModalOpen, setIsEditPermissionsModalOpen] =
    useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const handleAddUser = (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => {
    const newUser: User = {
      id: Date.now().toString(),
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      role: "Unassigned",
      status: "Active",
      createdAt: new Date().toISOString().split("T")[0],
    };
    setUsers((prev) => [...prev, newUser]);
    toast.success(
      `User ${data.firstName} ${data.lastName} created successfully!`,
    );
  };

  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    toast.success("User deleted successfully!");
  };

  const handleAddRole = (data: { roleName: string; description: string }) => {
    const newRole: Role = {
      id: Date.now().toString(),
      name: data.roleName,
      description: data.description,
      usersCount: 0,
      permissions: [],
    };
    setRoles((prev) => [...prev, newRole]);
    toast.success(`Role "${data.roleName}" created successfully!`);
  };

  const handleDeleteRole = (roleId: string) => {
    setRoles((prev) => prev.filter((r) => r.id !== roleId));
    toast.success("Role deleted successfully!");
  };

  const handleEditPermissions = (role: Role) => {
    setSelectedRole(role);
    setIsEditPermissionsModalOpen(true);
  };

  const handlePermissionsSubmit = (data: { permissions: string[] }) => {
    if (selectedRole) {
      setRoles((prev) =>
        prev.map((role) =>
          role.id === selectedRole.id
            ? { ...role, permissions: data.permissions }
            : role,
        ),
      );
      toast.success(`Permissions updated for ${selectedRole.name}!`);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-stone-900 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-bold text-stone-900 mb-2">Settings</h1>
            <p className="text-lg text-stone-500 font-medium">
              Manage team members and access control
            </p>
          </motion.div>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab("team")}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
              activeTab === "team"
                ? "bg-stone-900 text-white shadow-lg shadow-stone-900/10"
                : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            <Users className="w-5 h-5" />
            Team Members
          </button>
          <button
            onClick={() => setActiveTab("roles")}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
              activeTab === "roles"
                ? "bg-stone-900 text-white shadow-lg shadow-stone-900/10"
                : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            <Shield className="w-5 h-5" />
            Roles & Access
          </button>
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[48px] border border-stone-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] overflow-hidden"
        >
          <div className="p-8 lg:p-12 border-b border-stone-50 flex flex-col md:flex-row gap-6 items-center justify-between bg-stone-50/30">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300" />
              <input
                type="text"
                placeholder={`Search ${activeTab === "team" ? "users" : "roles"}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-white border border-stone-200 rounded-2xl text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-4 focus:ring-stone-900/5 transition-all font-medium"
              />
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              {activeTab === "team" && (
                <div className="flex-1 md:flex-none">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full md:w-44 px-5 py-4 bg-white border border-stone-200 rounded-2xl text-stone-600 font-bold text-[13px] appearance-none focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Roles</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.name}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <button
                onClick={() =>
                  activeTab === "team"
                    ? setIsAddUserModalOpen(true)
                    : setIsAddRoleModalOpen(true)
                }
                className="flex items-center gap-2 px-6 py-4 bg-stone-900 text-white rounded-2xl text-sm font-bold hover:bg-stone-800 transition-all shadow-lg shadow-stone-900/10"
              >
                <Plus className="w-5 h-5" />
                {activeTab === "team" ? "Add User" : "Add Role"}
              </button>
            </div>
          </div>

          {activeTab === "team" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-50">
                    <th className="px-10 py-6 text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em]">
                      Name
                    </th>
                    <th className="px-10 py-6 text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em]">
                      Email
                    </th>
                    <th className="px-10 py-6 text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em]">
                      Role
                    </th>
                    <th className="px-10 py-6 text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em]">
                      Status
                    </th>
                    <th className="px-10 py-6 text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em]">
                      Created
                    </th>
                    <th className="px-10 py-6 text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em] text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredUsers.map((user) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="group border-b border-stone-50 hover:bg-stone-50/50 transition-colors"
                      >
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4A574] to-[#C4956A] flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {user.firstName.charAt(0)}
                                {user.lastName.charAt(0)}
                              </span>
                            </div>
                            <span className="text-[15px] font-bold text-stone-900">
                              {user.firstName} {user.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <span className="text-[14px] text-stone-500 font-medium">
                            {user.email}
                          </span>
                        </td>
                        <td className="px-10 py-8">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-100 text-stone-600 rounded-lg text-[11px] font-bold uppercase tracking-wider">
                            <Shield className="w-3 h-3" /> {user.role}
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider ${
                              user.status === "Active"
                                ? "bg-sage-50 text-[#8BA88E] border border-sage-100"
                                : "bg-stone-50 text-stone-300"
                            }`}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${
                                user.status === "Active"
                                  ? "bg-[#8BA88E] animate-pulse"
                                  : "bg-stone-300"
                              }`}
                            />
                            {user.status}
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <span className="text-[14px] text-stone-500 font-medium">
                            {user.createdAt}
                          </span>
                        </td>
                        <td className="px-10 py-8 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() =>
                                toast.success("View user details clicked")
                              }
                              className="p-2.5 bg-stone-50 text-stone-400 hover:text-stone-900 hover:bg-white border border-transparent hover:border-stone-100 rounded-xl transition-all shadow-sm"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toast.success("Edit user clicked")}
                              className="p-2.5 bg-stone-50 text-stone-400 hover:text-stone-900 hover:bg-white border border-transparent hover:border-stone-100 rounded-xl transition-all shadow-sm"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                toast.success("Assign role clicked")
                              }
                              className="p-2.5 bg-stone-50 text-stone-400 hover:text-stone-900 hover:bg-white border border-transparent hover:border-stone-100 rounded-xl transition-all shadow-sm"
                              title="Assign Role"
                            >
                              <UserCog className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2.5 bg-stone-50 text-stone-400 hover:text-red-500 hover:bg-white border border-transparent hover:border-stone-100 rounded-xl transition-all shadow-sm"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="py-32 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mb-6">
                    <Users className="w-8 h-8 text-stone-200" />
                  </div>
                  <h3 className="text-xl font-semibold text-stone-900">
                    No users found
                  </h3>
                  <p className="text-stone-400 mt-2 max-w-[300px]">
                    Try adjusting your search or filters.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "roles" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-50">
                    <th className="px-10 py-6 text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em]">
                      Role Name
                    </th>
                    <th className="px-10 py-6 text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em]">
                      Description
                    </th>
                    <th className="px-10 py-6 text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em]">
                      Users
                    </th>
                    <th className="px-10 py-6 text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em]">
                      Permissions
                    </th>
                    <th className="px-10 py-6 text-[11px] font-bold text-stone-400 uppercase tracking-[0.2em] text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="wait">
                    {filteredRoles.map((role) => (
                      <motion.tr
                        key={role.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="group border-b border-stone-50 hover:bg-stone-50/50 transition-colors"
                      >
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center">
                              <Shield className="w-5 h-5 text-stone-600" />
                            </div>
                            <span className="text-[15px] font-bold text-stone-900">
                              {role.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <span className="text-[14px] text-stone-500 font-medium max-w-xs block line-clamp-1">
                            {role.description}
                          </span>
                        </td>
                        <td className="px-10 py-8">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-100 text-stone-600 rounded-lg text-[11px] font-bold">
                            <Users className="w-3 h-3" /> {role.usersCount}{" "}
                            Users
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <span className="text-[14px] text-stone-500 font-medium">
                            {role.permissions.length} permissions
                          </span>
                        </td>
                        <td className="px-10 py-8 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => toast.success("Edit role clicked")}
                              className="p-2.5 bg-stone-50 text-stone-400 hover:text-stone-900 hover:bg-white border border-transparent hover:border-stone-100 rounded-xl transition-all shadow-sm"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditPermissions(role)}
                              className="p-2.5 bg-stone-50 text-stone-400 hover:text-stone-900 hover:bg-white border border-transparent hover:border-stone-100 rounded-xl transition-all shadow-sm"
                              title="Edit Permissions"
                            >
                              <SettingsIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRole(role.id)}
                              className="p-2.5 bg-stone-50 text-stone-400 hover:text-red-500 hover:bg-white border border-transparent hover:border-stone-100 rounded-xl transition-all shadow-sm"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>

              {filteredRoles.length === 0 && (
                <div className="py-32 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mb-6">
                    <Shield className="w-8 h-8 text-stone-200" />
                  </div>
                  <h3 className="text-xl font-semibold text-stone-900">
                    No roles found
                  </h3>
                  <p className="text-stone-400 mt-2 max-w-[300px]">
                    Try adjusting your search.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="p-10 bg-stone-50/50 border-t border-stone-100">
            <p className="text-[12px] font-bold text-stone-400 uppercase tracking-[0.2em] text-center">
              {activeTab === "team"
                ? `${filteredUsers.length} of ${users.length} Team Members`
                : `${filteredRoles.length} of ${roles.length} Roles`}
            </p>
          </div>
        </motion.div>
      </div>

      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onSubmit={handleAddUser}
      />

      <AddRoleModal
        isOpen={isAddRoleModalOpen}
        onClose={() => setIsAddRoleModalOpen(false)}
        onSubmit={handleAddRole}
      />

      <EditPermissionsModal
        isOpen={isEditPermissionsModalOpen}
        onClose={() => setIsEditPermissionsModalOpen(false)}
        onSubmit={handlePermissionsSubmit}
        roleName={selectedRole?.name}
        currentPermissions={selectedRole?.permissions}
      />
    </div>
  );
};
