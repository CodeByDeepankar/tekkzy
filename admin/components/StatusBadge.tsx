import React from 'react';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; className: string }> = {
    'pending': { label: 'Pending', className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
    'reviewed': { label: 'Reviewed', className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
    'in-progress': { label: 'In Progress', className: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
    'completed': { label: 'Completed', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    'rejected': { label: 'Rejected', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
    'on-hold': { label: 'On Hold', className: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
    'low': { label: 'Low', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    'medium': { label: 'Medium', className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
    'high': { label: 'High', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
};

interface BadgeProps {
    value: string;
    type?: 'status' | 'priority';
    className?: string;
}

export default function StatusBadge({ value, type = 'status', className }: BadgeProps) {
    const config = type === 'status' ? statusConfig : priorityConfig;
    const item = config[value] || { label: value, className: 'bg-gray-500/15 text-gray-400 border-gray-500/30' };

    return (
        <span
            className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize',
                item.className,
                className
            )}
        >
            {item.label}
        </span>
    );
}
