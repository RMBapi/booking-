"use client";

import React from "react";
import { X, User, Mail, Lock } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => void;
}

export const AddUserModal = ({
  isOpen,
  onClose,
  onSubmit,
}: AddUserModalProps) => {
  const [formData, setFormData] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    });
  };

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
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="px-8 py-6 border-b border-stone-200/50 bg-stone-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-stone-900">
                    Add Team Member
                  </h2>
                  <p className="text-sm text-stone-500 font-medium mt-0.5">
                    Create a new user account
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-stone-200/50 rounded-xl text-stone-400 hover:text-stone-900 transition-colors"
                  aria-label="Close add user"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form
              id="add-user-form"
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto px-8 py-6"
            >
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-stone-700 mb-2">
                      <User className="w-4 h-4 text-stone-400" />
                      First Name *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white border border-stone-200 rounded-2xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D4A574]/20 focus:border-[#D4A574] transition-all"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-stone-700 mb-2">
                      <User className="w-4 h-4 text-stone-400" />
                      Last Name *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white border border-stone-200 rounded-2xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D4A574]/20 focus:border-[#D4A574] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-stone-700 mb-2">
                    <Mail className="w-4 h-4 text-stone-400" />
                    Email Address *
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="john.doe@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white border border-stone-200 rounded-2xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D4A574]/20 focus:border-[#D4A574] transition-all"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-stone-700 mb-2">
                    <Lock className="w-4 h-4 text-stone-400" />
                    Password *
                  </label>
                  <input
                    required
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white border border-stone-200 rounded-2xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D4A574]/20 focus:border-[#D4A574] transition-all"
                  />
                  <p className="text-xs text-stone-400 mt-2 ml-1">
                    Minimum 8 characters with uppercase, lowercase, and number
                  </p>
                </div>
              </div>
            </form>

            <div className="px-8 py-6 border-t border-stone-200/50 bg-stone-50/50 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-white border border-stone-200 text-stone-700 font-bold rounded-2xl hover:bg-stone-50 transition-all active:scale-[0.97]"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="add-user-form"
                className="flex-1 px-6 py-3 bg-stone-900 text-white font-bold rounded-2xl hover:bg-stone-800 transition-all shadow-lg shadow-stone-900/10 active:scale-[0.97]"
              >
                Create User
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
