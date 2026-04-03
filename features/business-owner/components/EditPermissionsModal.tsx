"use client";

import React from "react";
import { X, Shield } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface Permission {
  id: string;
  label: string;
  description: string;
  category: string;
}

interface EditPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { permissions: string[] }) => void;
  roleName?: string;
  currentPermissions?: string[];
}

const PERMISSIONS: Permission[] = [
  {
    id: "services.view",
    label: "View Services",
    description: "Can view all services",
    category: "Services",
  },
  {
    id: "services.create",
    label: "Create Services",
    description: "Can create new services",
    category: "Services",
  },
  {
    id: "services.edit",
    label: "Edit Services",
    description: "Can modify existing services",
    category: "Services",
  },
  {
    id: "services.delete",
    label: "Delete Services",
    description: "Can delete services",
    category: "Services",
  },
  {
    id: "bookings.view",
    label: "View Bookings",
    description: "Can view all bookings",
    category: "Bookings",
  },
  {
    id: "bookings.create",
    label: "Create Bookings",
    description: "Can create new bookings",
    category: "Bookings",
  },
  {
    id: "bookings.edit",
    label: "Edit Bookings",
    description: "Can modify bookings",
    category: "Bookings",
  },
  {
    id: "bookings.cancel",
    label: "Cancel Bookings",
    description: "Can cancel bookings",
    category: "Bookings",
  },
  {
    id: "providers.view",
    label: "View Providers",
    description: "Can view all providers",
    category: "Providers",
  },
  {
    id: "providers.create",
    label: "Create Providers",
    description: "Can add new providers",
    category: "Providers",
  },
  {
    id: "providers.edit",
    label: "Edit Providers",
    description: "Can modify provider details",
    category: "Providers",
  },
  {
    id: "providers.delete",
    label: "Delete Providers",
    description: "Can remove providers",
    category: "Providers",
  },
  {
    id: "team.view",
    label: "View Team",
    description: "Can view team members",
    category: "Team",
  },
  {
    id: "team.create",
    label: "Create Users",
    description: "Can add team members",
    category: "Team",
  },
  {
    id: "team.edit",
    label: "Edit Users",
    description: "Can modify user details",
    category: "Team",
  },
  {
    id: "team.delete",
    label: "Delete Users",
    description: "Can remove team members",
    category: "Team",
  },
  {
    id: "analytics.view",
    label: "View Analytics",
    description: "Can access analytics dashboard",
    category: "Analytics",
  },
  {
    id: "analytics.export",
    label: "Export Reports",
    description: "Can export data and reports",
    category: "Analytics",
  },
  {
    id: "settings.view",
    label: "View Settings",
    description: "Can view system settings",
    category: "Settings",
  },
  {
    id: "settings.edit",
    label: "Edit Settings",
    description: "Can modify system settings",
    category: "Settings",
  },
  {
    id: "roles.manage",
    label: "Manage Roles",
    description: "Can create and edit roles",
    category: "Settings",
  },
];

export const EditPermissionsModal = ({
  isOpen,
  onClose,
  onSubmit,
  roleName = "Role",
  currentPermissions = [],
}: EditPermissionsModalProps) => {
  const [selectedPermissions, setSelectedPermissions] =
    React.useState<string[]>(currentPermissions);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedPermissions(currentPermissions);
    }
  }, [isOpen, currentPermissions]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit({ permissions: selectedPermissions });
    onClose();
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId],
    );
  };

  const toggleCategory = (category: string) => {
    const categoryPermissions = PERMISSIONS.filter(
      (p) => p.category === category,
    ).map((p) => p.id);
    const allSelected = categoryPermissions.every((id) =>
      selectedPermissions.includes(id),
    );

    if (allSelected) {
      setSelectedPermissions((prev) =>
        prev.filter((id) => !categoryPermissions.includes(id)),
      );
    } else {
      setSelectedPermissions((prev) =>
        Array.from(new Set([...prev, ...categoryPermissions])),
      );
    }
  };

  const categories = Array.from(new Set(PERMISSIONS.map((p) => p.category)));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-900/30 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="px-8 py-6 border-b border-stone-200/50 bg-stone-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-stone-900">
                    Edit Permissions
                  </h2>
                  <p className="text-sm text-stone-500 font-medium mt-0.5">
                    Configure permissions for{" "}
                    <span className="text-[#D4A574] font-bold">{roleName}</span>
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-stone-200/50 rounded-xl text-stone-400 hover:text-stone-900 transition-colors"
                  aria-label="Close edit permissions"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form
              id="edit-permissions-form"
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto px-8 py-6"
            >
              <div className="space-y-6">
                {categories.map((category) => {
                  const categoryPermissions = PERMISSIONS.filter(
                    (p) => p.category === category,
                  );
                  const allSelected = categoryPermissions.every((p) =>
                    selectedPermissions.includes(p.id),
                  );
                  const someSelected = categoryPermissions.some((p) =>
                    selectedPermissions.includes(p.id),
                  );

                  return (
                    <div
                      key={category}
                      className="border border-stone-200 rounded-2xl overflow-hidden"
                    >
                      <div
                        className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between cursor-pointer hover:bg-stone-100 transition-colors"
                        onClick={() => toggleCategory(category)}
                      >
                        <div className="flex items-center gap-3">
                          <Shield className="w-5 h-5 text-[#D4A574]" />
                          <h3 className="text-lg font-bold text-stone-900">
                            {category}
                          </h3>
                          <span className="text-xs text-stone-400 font-medium">
                            {
                              categoryPermissions.filter((p) =>
                                selectedPermissions.includes(p.id),
                              ).length
                            }{" "}
                            / {categoryPermissions.length}
                          </span>
                        </div>
                        <div
                          className={`w-12 h-6 rounded-full transition-all relative ${
                            allSelected
                              ? "bg-stone-900"
                              : someSelected
                                ? "bg-[#D4A574]"
                                : "bg-stone-200"
                          }`}
                        >
                          <div
                            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${
                              allSelected || someSelected ? "right-1" : "left-1"
                            }`}
                          />
                        </div>
                      </div>

                      <div className="p-4 space-y-2">
                        {categoryPermissions.map((permission) => {
                          const isSelected = selectedPermissions.includes(
                            permission.id,
                          );

                          return (
                            <div
                              key={permission.id}
                              onClick={() => togglePermission(permission.id)}
                              className="flex items-center justify-between p-4 bg-white border border-stone-200 rounded-xl hover:border-stone-300 transition-all cursor-pointer group"
                            >
                              <div className="flex-1">
                                <p className="text-sm font-bold text-stone-900">
                                  {permission.label}
                                </p>
                                <p className="text-xs text-stone-400 mt-0.5">
                                  {permission.description}
                                </p>
                              </div>
                              <div
                                className={`w-10 h-6 rounded-full transition-all relative ${
                                  isSelected ? "bg-[#8BA88E]" : "bg-stone-200"
                                }`}
                              >
                                <div
                                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${
                                    isSelected ? "right-1" : "left-1"
                                  }`}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </form>

            <div className="px-8 py-6 border-t border-stone-200/50 bg-stone-50/50 flex items-center justify-between">
              <div className="text-sm text-stone-500">
                <span className="font-bold text-stone-900">
                  {selectedPermissions.length}
                </span>{" "}
                of {PERMISSIONS.length} permissions selected
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 bg-white border border-stone-200 text-stone-700 font-bold rounded-2xl hover:bg-stone-50 transition-all active:scale-[0.97]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="edit-permissions-form"
                  className="px-6 py-3 bg-stone-900 text-white font-bold rounded-2xl hover:bg-stone-800 transition-all shadow-lg shadow-stone-900/10 active:scale-[0.97]"
                >
                  Save Permissions
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
