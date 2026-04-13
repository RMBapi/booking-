"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { CreateBusinessPayload } from "@/types";
import { uploadImage } from "@/services";

interface CreateBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBusinessPayload) => void;
  isSubmitting?: boolean;
}

type FormErrors = Partial<Record<keyof CreateBusinessPayload | "logoFile" | "imageFile", string>>;

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const CreateBusinessModal: React.FC<CreateBusinessModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<CreateBusinessPayload>({
    name: "",
    description: "",
    logo: "",
    image: "",
    email: "",
    phone: "",
    address: "",
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isUploading, setIsUploading] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (
    field: keyof CreateBusinessPayload,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateFile = (file: File, fieldName: string): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `Invalid file type. Accepted: JPEG, PNG, WebP, GIF, SVG`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than 5MB`;
    }
    return null;
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file, "logoFile");
    if (error) {
      setErrors((prev) => ({ ...prev, logoFile: error }));
      return;
    }

    setErrors((prev) => ({ ...prev, logoFile: "" }));
    setLogoFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file, "imageFile");
    if (error) {
      setErrors((prev) => ({ ...prev, imageFile: error }));
      return;
    }

    setErrors((prev) => ({ ...prev, imageFile: "" }));
    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview("");
    setFormData((prev) => ({ ...prev, logo: "" }));
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    setFormData((prev) => ({ ...prev, image: "" }));
    if (imageInputRef.current) imageInputRef.current.value = "";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting || isUploading) return;
    if (!validateForm()) return;

    setIsUploading(true);

    try {
      let logoUrl = formData.logo || "";
      let imageUrl = formData.image || "";

      // Upload logo file if selected
      if (logoFile) {
        logoUrl = await uploadImage(logoFile);
      }

      // Upload image file if selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      onSubmit({
        ...formData,
        logo: logoUrl || undefined,
        image: imageUrl || undefined,
      });
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to upload image. Please try again.";
      setErrors((prev) => ({ ...prev, logoFile: logoFile ? message : "", imageFile: imageFile ? message : "" }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      logo: "",
      image: "",
      email: "",
      phone: "",
      address: "",
    });
    setLogoFile(null);
    setLogoPreview("");
    setImageFile(null);
    setImagePreview("");
    setErrors({});
    setIsUploading(false);
    onClose();
  };

  if (!isOpen) return null;

  const isBusy = isSubmitting || isUploading;

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
              {/* Business Name */}
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

              {/* Description */}
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

              {/* Logo Upload */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-stone-700 mb-2">
                  <ImageIcon className="w-4 h-4 text-stone-400" />
                  Logo (Optional)
                </label>

                <div className="border-2 border-dashed border-stone-200 rounded-2xl p-6 text-center hover:border-stone-300 transition-colors">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  {logoPreview ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="w-24 h-24 rounded-2xl object-cover border border-stone-200"
                        />
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <label htmlFor="logo-upload" className="cursor-pointer text-sm text-stone-600 font-medium hover:text-stone-800">
                        Click to change logo
                      </label>
                    </div>
                  ) : (
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center">
                          <Upload className="w-8 h-8 text-stone-400" />
                        </div>
                        <p className="text-sm font-bold text-stone-700">
                          Click to upload logo
                        </p>
                        <p className="text-xs text-stone-400">
                          JPEG, PNG, WebP, GIF, SVG up to 5MB
                        </p>
                      </div>
                    </label>
                  )}
                </div>

                {errors.logoFile && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium">
                    {errors.logoFile}
                  </p>
                )}
              </div>

              {/* Image Upload */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-stone-700 mb-2">
                  <ImageIcon className="w-4 h-4 text-stone-400" />
                  Image (Optional)
                </label>

                <div className="border-2 border-dashed border-stone-200 rounded-2xl p-6 text-center hover:border-stone-300 transition-colors">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  {imagePreview ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Image preview"
                          className="w-full max-w-xs h-40 rounded-2xl object-cover border border-stone-200"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <label htmlFor="image-upload" className="cursor-pointer text-sm text-stone-600 font-medium hover:text-stone-800">
                        Click to change image
                      </label>
                    </div>
                  ) : (
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center">
                          <Upload className="w-8 h-8 text-stone-400" />
                        </div>
                        <p className="text-sm font-bold text-stone-700">
                          Click to upload image
                        </p>
                        <p className="text-xs text-stone-400">
                          JPEG, PNG, WebP, GIF, SVG up to 5MB
                        </p>
                      </div>
                    </label>
                  )}
                </div>

                {errors.imageFile && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium">
                    {errors.imageFile}
                  </p>
                )}
              </div>

              {/* Email */}
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

              {/* Phone */}
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

              {/* Address */}
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
              disabled={isBusy}
              className="flex-1 px-6 py-3 bg-stone-900 text-white font-bold rounded-2xl hover:bg-stone-800 transition-all shadow-lg shadow-stone-900/10 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isUploading ? "Uploading..." : isSubmitting ? "Creating..." : "Create Business"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
