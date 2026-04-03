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

  // Get a consistent placeholder image based on business ID
  const getPlaceholderImage = () => {
    const index = parseInt(business.id.slice(-1), 16) % UNSPLASH_IMAGES.length;
    return UNSPLASH_IMAGES[index];
  };

  const imageUrl =
    business.logoUrl && !imageError ? business.logoUrl : getPlaceholderImage();
  const email = business.email || "Not available";
  const phone = business.phone || "Not available";
  const address = business.address || "Not available";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -6 }}
      className="group w-full overflow-hidden rounded-[40px] border border-stone-100/80 bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] transition-all duration-700 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)]"
    >
      <div className="relative h-[192px] w-full overflow-hidden">
        <img
          src={imageUrl}
          alt={business.name}
          className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105 saturate-[0.85]"
          onError={() => setImageError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-stone-900/20 to-transparent" />
        <div className="absolute bottom-[24px] left-[32px] right-[32px]">
          <h3 className="text-2xl font-semibold leading-none tracking-tight text-white">
            {business.name}
          </h3>
          <div className="mt-[10px] flex items-center gap-2 text-sm font-medium text-white/80">
            <AtSign className="h-3.5 w-3.5 opacity-60" />
            <span>{business.slug}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col p-[32px]">
        <div>
          <div className="mb-[40px] space-y-[14px]">
            <div className="flex cursor-default items-center gap-[14px] text-stone-600">
              <div className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-stone-50">
                <Mail className="h-4 w-4 text-stone-400" />
              </div>
              <span className="truncate text-[14px] font-medium tracking-tight text-stone-600">
                {email}
              </span>
            </div>
            <div className="flex cursor-default items-center gap-[14px] text-stone-600">
              <div className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-stone-50">
                <Phone className="h-4 w-4 text-stone-400" />
              </div>
              <span className="truncate text-[14px] font-medium tracking-tight text-stone-600">
                {phone}
              </span>
            </div>
            <div className="flex cursor-default items-center gap-[14px] text-stone-600">
              <div className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-stone-50">
                <MapPin className="h-4 w-4 text-stone-400" />
              </div>
              <span className="truncate text-[14px] font-medium tracking-tight text-stone-600">
                {address}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-[16px]">
            <a
              href={`/business/slug/${business.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-[46px] items-center justify-center gap-3 rounded-[20px] bg-stone-900 px-4 text-[13px] leading-none font-bold text-stone-50 shadow-lg shadow-stone-900/10 transition-all duration-300 hover:bg-stone-800 hover:text-stone-50 active:scale-95"
            >
              <Eye className="h-4 w-4 text-stone-50" />
              <span className="text-stone-50">Public Site</span>
            </a>

            <a
              href={`/business-owner/${business.id}`}
              className="inline-flex h-[46px] items-center justify-center gap-3 rounded-[20px] bg-stone-50 px-4 text-[13px] leading-none font-bold text-stone-700 transition-all duration-300 hover:bg-stone-100 hover:text-stone-700 active:scale-95"
            >
              <Settings className="h-4 w-4 text-stone-600" />
              <span className="text-stone-700">Dashboard</span>
            </a>

            <a
              href={`/business-owner/${business.id}/bookings`}
              className="inline-flex h-[46px] items-center justify-center gap-3 rounded-[20px] bg-stone-50 px-4 text-[13px] leading-none font-bold text-stone-700 transition-all duration-300 hover:bg-stone-100 hover:text-stone-700 active:scale-95"
            >
              <Calendar className="h-4 w-4 text-stone-600" />
              <span className="text-stone-700">Bookings</span>
            </a>

            <a
              href={`/business-owner/${business.id}/settings`}
              className="inline-flex h-[46px] items-center justify-center gap-3 rounded-[20px] bg-stone-50 px-4 text-[13px] leading-none font-bold text-stone-700 transition-all duration-300 hover:bg-stone-100 active:scale-95"
            >
              <Users className="h-4 w-4 text-stone-600" />
              <span className="text-stone-700">Team</span>
            </a>
          </div>
        </div>

        <div className="mt-7 flex items-center justify-between border-t border-stone-100 pt-4 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full bg-[#8BA88E] shadow-[0_0_8px_rgba(139,168,142,0.6)] animate-pulse" />
            <span className="text-xs leading-tight font-bold uppercase tracking-widest text-stone-400">
              Active Now
            </span>
          </div>
          <button className="rounded-full p-2.5 text-stone-300 transition-all hover:bg-stone-50 hover:text-stone-500">
            <MoreHorizontal className="h-6 w-6" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
