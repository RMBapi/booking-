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
      className="group rounded-[32px] border border-stone-100/50 bg-white p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] transition-all duration-700 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.04)]"
    >
      <div className="mb-8 flex items-start justify-between">
        <div className={`rounded-2xl p-4 transition-transform duration-500 group-hover:scale-110 ${color || "bg-stone-50"}`}>
          <Icon className="h-6 w-6 text-stone-600" />
        </div>
        {trend && (
          <div className="rounded-full border border-stone-100 bg-stone-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-stone-400">
            {trend}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-medium uppercase tracking-widest text-stone-400">{title}</h3>
        <p className="text-3xl font-semibold tracking-tight text-stone-900">{value}</p>
      </div>

      <div className="-mx-2 mt-8 h-16">
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
