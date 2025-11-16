"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useUser } from "@/lib/user-context";
import { getNavItemsForRole, type UserRole } from "@/lib/navigation";

export type NavbarState = {
  user: ReturnType<typeof useUser>;
  router: ReturnType<typeof useRouter>;
  navLinks: ReturnType<typeof getNavItemsForRole>;
  scrolled: boolean;
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  isActive: (href: string) => boolean;
};

export function useNavbarState(): NavbarState {
  const user = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isMobileMenuOpen) {
      document.body.style.overflow = "";
      return;
    }
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobileMenuOpen]);

  const navLinks = useMemo(() => {
    if (!user?.role) return [];
    return getNavItemsForRole(user.role as UserRole);
  }, [user?.role]);

  const isActive = useCallback(
    (href: string) => {
      if (href === "/dashboard") {
        return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
      }
      if (href.startsWith("/dashboard/")) {
        return pathname === href || pathname.startsWith(`${href}/`);
      }
      if (href === "/leaves") {
        return pathname === "/leaves" || pathname.startsWith("/leaves/");
      }
      if (href === "/reports") {
        return pathname === "/reports";
      }
      return pathname === href || pathname.startsWith(`${href}/`);
    },
    [pathname],
  );

  const toggleMobileMenu = useCallback(
    () => setIsMobileMenuOpen((open) => !open),
    [],
  );

  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);

  return {
    user,
    router,
    navLinks,
    scrolled,
    isMobileMenuOpen,
    toggleMobileMenu,
    closeMobileMenu,
    isActive,
  };
}
