import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Joins class names and resolves Tailwind conflicts (last wins), so a component's
 * `className` can override its defaults, e.g. `w-32` over the input's `w-full`.
 */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
