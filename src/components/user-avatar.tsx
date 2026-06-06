'use client';

import { getBiggestUsernamePart } from '@/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      // fall through to email fallback
    } else if (parts.length === 1) {
      return parts[0][0].toUpperCase();
    } else {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
  }
  if (email) {
    const part = getBiggestUsernamePart(email);
    return part ? part[0].toUpperCase() : '';
  }
  return '';
}

export function UserAvatar({ name, email, image }: UserAvatarProps) {
  const initials = getInitials(name, email);

  return (
    <Avatar className="w-9 h-9 border border-[var(--color-hairline)]">
      <AvatarImage src={image ?? undefined} alt={name ?? email ?? 'Avatar'} />
      <AvatarFallback className="bg-[var(--color-surface-card)] text-xs font-semibold text-[var(--color-muted)]">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
