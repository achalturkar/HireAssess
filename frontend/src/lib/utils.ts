import clsx, { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function statusColor(status: 'strong' | 'moderate' | 'low') {
  return {
    strong: 'text-status-strong',
    moderate: 'text-status-moderate',
    low: 'text-status-low',
  }[status];
}
