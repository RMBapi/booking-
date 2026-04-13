"use client";

import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  trend: string;
  trendType: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  data: { value: number }[];
  color?: string;
  strokeColor: string;
  fillColor?: string;
}

export const StatCard = ({ 
  title, 
  value, 
  trend, 
  icon: Icon, 
  data, 
  color, 
  strokeColor, 
  fillColor 
}: StatCardProps) => {
  const areaColor = fillColor || strokeColor;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="group rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm transition-all hover:shadow-md"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className={`rounded-xl p-3 transition-transform duration-500 group-hover:scale-105 ${color || "bg-stone-50"}`}>
          <Icon className="h-5 w-5 text-stone-600" />
        </div>
        {trend && (
          <div className="rounded-full border border-stone-100 bg-stone-50 px-2.5 py-0.5 text-xs font-medium text-stone-400">
            {trend}
          </div>
        )}
      </div>

      <div className="space-y-0.5">
        <h3 className="text-xs font-medium text-stone-500">{title}</h3>
        <p className="text-2xl font-semibold tracking-tight text-stone-900">{value}</p>
      </div>

      <div className="-mx-2 mt-4 h-12">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={areaColor} stopOpacity={0.15}/>
                <stop offset="100%" stopColor={areaColor} stopOpacity={0.02}/>
              </linearGradient>
            </defs>
            <Area 
              type="monotone"
              dataKey="value" 
              stroke={strokeColor} 
              fillOpacity={1} 
              fill={`url(#gradient-${title})`} 
              strokeWidth={2}
              className="transition-all duration-1000"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};
