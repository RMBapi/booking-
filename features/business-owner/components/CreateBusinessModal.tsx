"use client";

import React, { useState } from "react";
import {
  X,
  Upload,
  Link as LinkIcon,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { CreateBusinessPayload } from "@/types";

interface CreateBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBusinessPayload) => void;
  isSubmitting?: boolean;
}

type LogoUploadMode = "none" | "url" | "file";

type FormErrors = Partial<Record<keyof CreateBusinessPayload, string>>;

export const CreateBusinessModal: React.FC<CreateBusinessModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<CreateBusinessPayload>({
    name: "",
    description: "",
    logoUrl: "",
    email: "",
    phone: "",
    address: "",
  });

  const [logoMode, setLogoMode] = useState<LogoUploadMode>("none");
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [errors, setErrors] = useState<FormErrors>({});

  const handleInputChange = (
    field: keyof CreateBusinessPayload,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        logoUrl: "File size must be less than 5MB",
      }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setLogoPreview(result);
      setFormData((prev) => ({ ...prev, logoUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleUrlChange = (url: string) => {
    setFormData((prev) => ({ ...prev, logoUrl: url }));
    setLogoPreview(url);
    if (errors.logoUrl) {
      setErrors((prev) => ({ ...prev, logoUrl: "" }));
    }
  };

  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!formData.name?.trim()) {
      nextErrors.name = "Business name is required";
    }

    if (!formData.description?.trim()) {
      nextErrors.description = "Description is required";
    }

    if (!formData.email?.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = "Please enter a valid email";
    }

    if (!formData.phone?.trim()) {
      nextErrors.phone = "Phone number is required";
    }

    if (!formData.address?.trim()) {
      nextErrors.address = "Address is required";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      logoUrl: "",
      email: "",
      phone: "",
      address: "",
    });
    setLogoMode("none");
    setLogoPreview("");
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-8 py-6 border-b border-stone-200/50 bg-stone-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D4A574] to-[#C4956A] flex items-center justify-center shadow-lg">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-stone-900">
                    Create New Business
                  </h2>
                  <p className="text-sm text-stone-500 font-medium mt-0.5">
                    Set up your business profile
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-2 hover:bg-stone-200/50 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-6">
            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-stone-700 mb-2">
                  <Building2 className="w-4 h-4 text-stone-400" />
                  Business Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., Acme Corporation"
                  className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 transition-all ${
                    errors.name
                      ? "border-red-300 focus:ring-red-200"
                      : "border-stone-200 focus:ring-[#D4A574]/20 focus:border-[#D4A574]"
                  }`}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium">
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-stone-700 mb-2">
                  <FileText className="w-4 h-4 text-stone-400" />
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Describe what your business does..."
                  rows={3}
                  className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 transition-all resize-none ${
                    errors.description
                      ? "border-red-300 focus:ring-red-200"
                      : "border-stone-200 focus:ring-[#D4A574]/20 focus:border-[#D4A574]"
                  }`}
                />
                {errors.description && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium">
                    {errors.description}
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-stone-700 mb-2">
                  <ImageIcon className="w-4 h-4 text-stone-400" />
                  Business Logo (Optional)
                </label>

                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setLogoMode("file");
                      setLogoPreview("");
                      setFormData((prev) => ({ ...prev, logoUrl: "" }));
                    }}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      logoMode === "file"
                        ? "bg-stone-900 text-white"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    <Upload className="w-4 h-4 inline mr-2" />
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLogoMode("url");
                      setLogoPreview("");
                      setFormData((prev) => ({ ...prev, logoUrl: "" }));
                    }}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      logoMode === "url"
                        ? "bg-stone-900 text-white"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    <LinkIcon className="w-4 h-4 inline mr-2" />
                    From URL
                  </button>
                </div>

                {logoMode === "file" && (
                  <div className="border-2 border-dashed border-stone-200 rounded-2xl p-6 text-center hover:border-stone-300 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      {logoPreview ? (
                        <div className="flex flex-col items-center gap-3">
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="w-24 h-24 rounded-2xl object-cover border border-stone-200"
                          />
                          <p className="text-sm text-stone-600 font-medium">
                            Click to change image
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center">
                            <Upload className="w-8 h-8 text-stone-400" />
                          </div>
                          <p className="text-sm font-bold text-stone-700">
                            Click to upload logo
                          </p>
                          <p className="text-xs text-stone-400">
                            PNG, JPG up to 5MB
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                )}

                {logoMode === "url" && (
                  <div>
                    <input
                      type="url"
                      value={formData.logoUrl}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="w-full px-4 py-3 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D4A574]/20 focus:border-[#D4A574] transition-all"
                    />
                    {logoPreview && (
                      <div className="mt-3 flex justify-center">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="w-24 h-24 rounded-2xl object-cover border border-stone-200"
                          onError={() => {
                            setLogoPreview("");
                            setErrors((prev) => ({
                              ...prev,
                              logoUrl: "Failed to load image from URL",
                            }));
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {errors.logoUrl && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium">
                    {errors.logoUrl}
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-stone-700 mb-2">
                  <Mail className="w-4 h-4 text-stone-400" />
                  Business Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="contact@business.com"
                  className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 transition-all ${
                    errors.email
                      ? "border-red-300 focus:ring-red-200"
                      : "border-stone-200 focus:ring-[#D4A574]/20 focus:border-[#D4A574]"
                  }`}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-stone-700 mb-2">
                  <Phone className="w-4 h-4 text-stone-400" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 transition-all ${
                    errors.phone
                      ? "border-red-300 focus:ring-red-200"
                      : "border-stone-200 focus:ring-[#D4A574]/20 focus:border-[#D4A574]"
                  }`}
                />
                {errors.phone && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium">
                    {errors.phone}
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-stone-700 mb-2">
                  <MapPin className="w-4 h-4 text-stone-400" />
                  Business Address *
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="123 Main St, City, State 12345"
                  rows={2}
                  className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 transition-all resize-none ${
                    errors.address
                      ? "border-red-300 focus:ring-red-200"
                      : "border-stone-200 focus:ring-[#D4A574]/20 focus:border-[#D4A574]"
                  }`}
                />
                {errors.address && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium">
                    {errors.address}
                  </p>
                )}
              </div>
            </div>
          </form>

          <div className="px-8 py-6 border-t border-stone-200/50 bg-stone-50/50 flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-3 bg-white border border-stone-200 text-stone-700 font-bold rounded-2xl hover:bg-stone-50 transition-all active:scale-[0.97]"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-stone-900 text-white font-bold rounded-2xl hover:bg-stone-800 transition-all shadow-lg shadow-stone-900/10 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Business"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
