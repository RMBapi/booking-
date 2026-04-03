"use client";

import React, { useState } from "react";
import { ChevronDown, Plus, Building2, Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Business } from "@/types";

interface BusinessSwitcherProps {
  businesses: Business[];
  currentBusiness: Business;
  onBusinessChange: (business: Business) => void;
  onCreateBusiness: () => void;
}

export const BusinessSwitcher: React.FC<BusinessSwitcherProps> = ({
  businesses,
  currentBusiness,
  onBusinessChange,
  onCreateBusiness,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (business: Business) => {
    onBusinessChange(business);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-3 px-4 py-2.5 bg-white border border-stone-200 rounded-2xl hover:bg-stone-50 hover:border-stone-300 transition-all group min-w-[240px] shadow-sm"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {currentBusiness.logoUrl ? (
            <img
              src={currentBusiness.logoUrl}
              alt={currentBusiness.name}
              className="w-8 h-8 rounded-xl object-cover border border-stone-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#D4A574] to-[#C4956A] flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-white font-bold text-sm">
                {currentBusiness.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="text-left flex-1 min-w-0">
            <p className="text-sm font-bold text-stone-900 truncate">
              {currentBusiness.name}
            </p>
            <p className="text-xs text-stone-400 font-medium">
              Switch business
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-stone-400 transition-transform flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-2 w-full min-w-[320px] bg-white border border-stone-200 rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-stone-200/50 bg-stone-50/50">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]">
                  Your Businesses
                </p>
              </div>

              <div className="max-h-[320px] overflow-y-auto py-2">
                {businesses.map((business) => {
                  const isSelected = business.id === currentBusiness.id;
                  return (
                    <button
                      key={business.id}
                      type="button"
                      onClick={() => handleSelect(business)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors group
                        ${isSelected ? "bg-[#D4A574]/5" : ""}
                      `}
                    >
                      {business.logoUrl ? (
                        <img
                          src={business.logoUrl}
                          alt={business.name}
                          className="w-10 h-10 rounded-xl object-cover border border-stone-200 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-stone-600" />
                        </div>
                      )}
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-bold text-stone-900 truncate">
                          {business.name}
                        </p>
                        <p className="text-xs text-stone-400 font-medium truncate">
                          {business.email || "No email on file"}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-[#D4A574] flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-stone-200/50 p-2">
                <button
                  type="button"
                  onClick={() => {
                    onCreateBusiness();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-all group shadow-lg shadow-stone-900/10 active:scale-[0.97]"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-bold">Create New Business</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

