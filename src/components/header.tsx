"use client";

import Image from "next/image";

import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="flex items-center justify-between w-full p-4 space-x-4">
      <Image
        priority
        width={100}
        height={24}
        src="/logo.png"
        alt="Easy Shop Logo"
        className="dark:invert"
      />

      <Button
        variant="secondary"
        className="text-sm text-muted-foreground transition-colors hover:text-primary "
      >
        Adicionar produto
      </Button>
    </header>
  );
}
