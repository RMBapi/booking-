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
  color: string;
  strokeColor: string;
  fillColor: string;
}

export const StatCard = ({ 
  title, 
  value, 
  trend, 
  trendType, 
  icon: Icon, 
  data, 
  color, 
  strokeColor, 
  fillColor 
}: StatCardProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-[210px] rounded-3xl border border-stone-100 bg-white p-7 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
    >
      <div className="mb-7 flex items-start justify-between">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-5 h-5 text-stone-600" />
        </div>
        {trend && (
          <div className="text-[11px] font-medium px-2 py-1 rounded-full bg-stone-50 text-stone-500 border border-stone-100 uppercase tracking-wider">
            {trend}
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-stone-600 tracking-tight">{title}</h3>
        <p className="text-2xl font-semibold text-stone-700 mt-1">{value}</p>
      </div>
      
      <div className="mt-7 h-14 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={fillColor} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={fillColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={strokeColor} 
              fillOpacity={1} 
              fill={`url(#gradient-${title})`} 
              strokeWidth={1.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};
