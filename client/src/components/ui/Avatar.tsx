'use client';

import React from 'react';
import { cn, getInitials } from '@/lib/utils';
import Image from 'next/image';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

const imageSizes = { sm: 32, md: 40, lg: 48, xl: 64 };

export default function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const initials = getInitials(name);

  if (src) {
    return (
      <div className={cn('relative rounded-full overflow-hidden flex-shrink-0', sizeClasses[size], className)}>
        <Image
          src={src}
          alt={name}
          width={imageSizes[size]}
          height={imageSizes[size]}
          className="object-cover w-full h-full"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex-shrink-0 bg-gradient-to-br from-cyan/20 to-purple/20 border border-cyan/30 flex items-center justify-center font-semibold text-cyan',
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
