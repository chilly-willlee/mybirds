"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const navItems = [
  { href: "/", label: "Birds for Me" },
  { href: "/lifelist", label: "Life List" },
];

export function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden md:flex items-center justify-between px-6 py-3 bg-surface border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2 text-forest">
          <span className="text-lg font-semibold tracking-tight">My Birds</span>
        </Link>
        <div className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors ${
                isActive(item.href) ? "text-forest" : "text-slate hover:text-charcoal"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-4">
          {session ? (
            <button
              onClick={() => signOut()}
              className="text-sm text-slate hover:text-charcoal cursor-pointer"
            >
              Sign out
            </button>
          ) : (
            <Link href="/auth/signin" className="text-sm font-medium text-forest hover:text-forest-light">
              Sign in
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-gray-100 z-50">
        <div className="flex justify-around py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center px-3 py-1 text-xs font-medium transition-colors ${
                isActive(item.href) ? "text-forest" : "text-slate"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
