"use client";

import React, { useState } from "react";
import {
  Eye,
  Settings,
  Calendar,
  Users,
  MapPin,
  Phone,
  Mail,
  AtSign,
  MoreHorizontal,
} from "lucide-react";
import { motion } from "framer-motion";
import { Business } from "@/types";

interface EnhancedBusinessCardProps {
  business: Business;
}

const UNSPLASH_IMAGES = [
  "https://images.unsplash.com/photo-1759092913072-2aace4336d16?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1080",
  "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1080",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1080",
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1080",
];

export const EnhancedBusinessCard = ({
  business,
}: EnhancedBusinessCardProps) => {
  const [imageError, setImageError] = useState(false);

  const getPlaceholderImage = () => {
    const index = parseInt(business.id.slice(-1), 16) % UNSPLASH_IMAGES.length;
    return UNSPLASH_IMAGES[index];
  };

  const imageUrl =
    business.logo && !imageError ? business.logo : getPlaceholderImage();
  const email = business.email || "Not available";
  const phone = business.phone || "Not available";
  const address = business.address || "Not available";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className="group w-full overflow-hidden rounded-2xl border border-stone-200/60 bg-white shadow-sm transition-all hover:shadow-lg"
    >
      <div className="relative h-40 w-full overflow-hidden">
        <img
          src={imageUrl}
          alt={business.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 saturate-[0.85]"
          onError={() => setImageError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-stone-900/20 to-transparent" />
        <div className="absolute bottom-4 left-5 right-5">
          <h3 className="text-base font-semibold leading-tight text-white">
            {business.name}
          </h3>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-white/80">
            <AtSign className="h-3 w-3 opacity-60" />
            <span>{business.slug}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col p-5">
        <div className="mb-5 space-y-3">
          <div className="flex items-center gap-3 text-stone-600">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-50">
              <Mail className="h-3.5 w-3.5 text-stone-400" />
            </div>
            <span className="truncate text-sm text-stone-600">{email}</span>
          </div>
          <div className="flex items-center gap-3 text-stone-600">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-50">
              <Phone className="h-3.5 w-3.5 text-stone-400" />
            </div>
            <span className="truncate text-sm text-stone-600">{phone}</span>
          </div>
          <div className="flex items-center gap-3 text-stone-600">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-50">
              <MapPin className="h-3.5 w-3.5 text-stone-400" />
            </div>
            <span className="truncate text-sm text-stone-600">{address}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <a
            href={`/business/slug/${business.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-stone-900 px-3 text-sm font-medium text-white transition-all hover:bg-stone-800 active:scale-[0.97]"
          >
            <Eye className="h-3.5 w-3.5" />
            Public Site
          </a>

          <a
            href={`/business-owner/${business.id}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-stone-50 px-3 text-sm font-medium text-stone-700 transition-all hover:bg-stone-100 active:scale-[0.97]"
          >
            <Settings className="h-3.5 w-3.5 text-stone-500" />
            Dashboard
          </a>

          <a
            href={`/business-owner/${business.id}/bookings`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-stone-50 px-3 text-sm font-medium text-stone-700 transition-all hover:bg-stone-100 active:scale-[0.97]"
          >
            <Calendar className="h-3.5 w-3.5 text-stone-500" />
            Bookings
          </a>

          <a
            href={`/business-owner/${business.id}/settings`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-stone-50 px-3 text-sm font-medium text-stone-700 transition-all hover:bg-stone-100 active:scale-[0.97]"
          >
            <Users className="h-3.5 w-3.5 text-stone-500" />
            Team
          </a>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#8BA88E] animate-pulse" />
            <span className="text-xs font-medium text-stone-400">
              Active
            </span>
          </div>
          <button className="rounded-lg p-1.5 text-stone-300 transition-all hover:bg-stone-50 hover:text-stone-500">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
