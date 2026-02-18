"use client";

import React, { useState } from 'react';
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
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Business } from '@/types';
import { Modal } from '@/components';
import { Button } from '@/components/buttons';
import { AddOwnerForm } from './AddOwnerForm';
import { BusinessOwnersList } from './BusinessOwnersList';

interface EnhancedBusinessCardProps {
  business: Business;
}

const UNSPLASH_IMAGES = [
  "https://images.unsplash.com/photo-1759092913072-2aace4336d16?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1080",
  "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1080",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1080",
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1080"
];

export const EnhancedBusinessCard = ({ business }: EnhancedBusinessCardProps) => {
  const [imageError, setImageError] = useState(false);
  
  // Get a consistent placeholder image based on business ID
  const getPlaceholderImage = () => {
    const index = parseInt(business.id.slice(-1), 16) % UNSPLASH_IMAGES.length;
    return UNSPLASH_IMAGES[index];
  };

  const imageUrl = business.logoUrl && !imageError ? business.logoUrl : getPlaceholderImage();

  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className="self-start overflow-hidden rounded-3xl border border-stone-100 bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] transition-all duration-500 hover:shadow-[0_15px_35px_rgba(0,0,0,0.06)]"
    >
      <div className="relative h-40 w-full overflow-hidden">
        <img 
          src={imageUrl} 
          alt={business.name} 
          className="w-full h-full object-cover saturate-[0.85] contrast-[0.95]"
          onError={() => setImageError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/55 via-stone-900/15 to-transparent" />
        <div className="absolute bottom-5 left-6 right-6">
          <h3 className="text-xl font-semibold leading-none tracking-tight text-white">
            {business.name}
          </h3>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-white/90">
            <AtSign className="w-3 h-3 opacity-70" />
            <span>{business.slug}</span>
          </div>
        </div>
      </div>

      <div className="px-7 pt-6 pb-7">
        <div className="mb-7 space-y-4">
          {business.email && (
            <div className="flex items-center gap-3.5 text-stone-500">
              <div className="rounded-xl bg-stone-50 p-2.5">
                <Mail className="w-4 h-4 text-stone-600" />
              </div>
              <span className="truncate text-[13px] tracking-tight">{business.email}</span>
            </div>
          )}
          {business.phone && (
            <div className="flex items-center gap-3.5 text-stone-500">
              <div className="rounded-xl bg-stone-50 p-2.5">
                <Phone className="w-4 h-4 text-stone-600" />
              </div>
              <span className="text-[13px] tracking-tight">{business.phone}</span>
            </div>
          )}
          {business.address && (
            <div className="flex items-center gap-3.5 text-stone-500">
              <div className="rounded-xl bg-stone-50 p-2.5">
                <MapPin className="w-4 h-4 text-stone-600" />
              </div>
              <span className="truncate text-[13px] tracking-tight">{business.address}</span>
            </div>
          )}
        </div>

        <div className="mt-1 grid grid-cols-2 gap-3.5">
          <a
            href={`/business/slug/${business.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-2xl bg-teal-900/10 px-4 py-[10px] text-[13px] font-semibold leading-none text-teal-800 transition-all duration-300 hover:bg-teal-900/15"
          >
            <Eye className="w-4 h-4" />
            View Detail
          </a>

          <a
            href={`/business-owner/${business.id}/services`}
            className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-2xl bg-stone-50 px-4 py-[10px] text-[13px] font-semibold leading-none text-stone-600 transition-all duration-300 hover:bg-stone-100"
          >
            <Settings className="w-4 h-4" />
            Services
          </a>

          <a
            href={`/business-owner/${business.id}/requests`}
            className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-2xl bg-stone-50 px-4 py-[10px] text-[13px] font-semibold leading-none text-stone-600 transition-all duration-300 hover:bg-stone-100"
          >
            <Calendar className="w-4 h-4" />
            Bookings
          </a>

          <Modal>
            <Modal.Open opens={`team-${business.id}`}>
              <button className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-2xl bg-stone-50 px-4 py-[10px] text-[13px] font-semibold leading-none text-stone-600 transition-all duration-300 hover:bg-stone-100">
                <Users className="w-4 h-4" />
                Team
              </button>
            </Modal.Open>

            <Modal.Body name={`team-${business.id}`} className="w-full max-w-4xl p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-8">
                Manage Co-Owners - {business.name}
              </h2>

              <div className="mb-10">
                <h3 className="text-xl font-medium text-gray-900 mb-6">
                  Add Co-Owner
                </h3>
                <AddOwnerForm businessId={business.id} />
              </div>

              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-6">
                  Current Owners
                </h3>
                <BusinessOwnersList businessId={business.id} />
              </div>

              <Modal.Close>
                <Button variant="outline" className="mt-8 w-full" size="lg">
                  Close
                </Button>
              </Modal.Close>
            </Modal.Body>
          </Modal>
        </div>

        
        <div className="mt-7 flex items-center justify-between border-t border-stone-100 pb-1 pt-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
            <span className="text-[11px] font-bold text-stone-600 uppercase tracking-widest">Active Now</span>
          </div>
          <button className="p-2 text-stone-300 hover:text-stone-500 rounded-full hover:bg-stone-50 transition-all">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
