"use client";

import { Car, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function AppHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-primary text-primary-foreground">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
            <Car className="h-5 w-5 text-accent-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-lg font-bold leading-tight tracking-tight">
              Redmond
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary-foreground/70">
              Chauffeur Drive
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/"
            className="rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/90 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            Bookings
          </Link>
          <Link
            href="/"
            className="rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/60 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            Drivers
          </Link>
          <Link
            href="/"
            className="rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/60 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            Fleet
          </Link>
        </nav>

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-md text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <nav className="border-t border-primary-foreground/10 px-4 pb-4 pt-2 md:hidden">
          <Link
            href="/"
            className="block rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/90 transition-colors hover:bg-primary-foreground/10"
            onClick={() => setMobileOpen(false)}
          >
            Bookings
          </Link>
          <Link
            href="/"
            className="block rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/60 transition-colors hover:bg-primary-foreground/10"
            onClick={() => setMobileOpen(false)}
          >
            Drivers
          </Link>
          <Link
            href="/"
            className="block rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/60 transition-colors hover:bg-primary-foreground/10"
            onClick={() => setMobileOpen(false)}
          >
            Fleet
          </Link>
        </nav>
      )}
    </header>
  );
}
