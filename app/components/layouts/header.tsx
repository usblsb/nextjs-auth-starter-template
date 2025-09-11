"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useUser, useAuth } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ThemeToggle } from "@/app/components/theme-toggle";

export default function Header() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSignOut = () => {
    signOut({ redirectUrl: "/" });
  };

  const closeSheet = () => {
    setIsOpen(false);
  };

  const isActiveRoute = (route: string) => {
    return pathname === route;
  };

  const getMenuItemClass = (route: string, isDefault = false) => {
    const isActive = isDefault || isActiveRoute(route);
    return `
      relative uppercase text-sm font-medium text-black dark:text-white
      transition-colors duration-200 hover:text-[#1177cc]
      before:absolute before:bottom-0 before:left-0 before:h-[2px] before:bg-[#1177cc]
      before:transition-all before:duration-300
      ${isActive 
        ? 'before:w-full text-[#1177cc]' 
        : 'before:w-0 hover:before:w-full'
      }
    `;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center px-6 md:px-8">
        {/* Logo */}
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">
              Electronica School
            </span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <SheetHeader>
              <SheetTitle asChild>
                <Link
                  href="/"
                  className="flex items-center"
                  onClick={closeSheet}
                >
                  <span className="font-bold">Electronica School</span>
                </Link>
              </SheetTitle>
            </SheetHeader>
            <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
              <div className="flex flex-col space-y-3">
                <Link
                  href="/"
                  className="text-foreground/60 transition-colors hover:text-foreground"
                  onClick={closeSheet}
                >
                  Inicio
                </Link>
                
                {/* Theme Toggle Mobile */}
                <div className="flex items-center justify-between pt-4 pb-2">
                  <span className="text-sm font-medium text-foreground/60">Tema</span>
                  <ThemeToggle />
                </div>

                {/* Mobile Auth Buttons */}
                <div className="flex flex-col space-y-2 pt-2">
                  {!user ? (
                    <>
                      <Link href="/sign-in" onClick={closeSheet}>
                        <Button variant="secondary" className="w-full justify-start">
                          Iniciar Sesión
                        </Button>
                      </Link>
                      <Link href="/sign-up" onClick={closeSheet}>
                        <Button variant="destructive" className="w-full justify-start">
                          Registrarse
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Button 
                        onClick={() => {
                          handleSignOut();
                          closeSheet();
                        }} 
                        variant="secondary" 
                        className="w-full justify-start"
                      >
                        Cerrar Sesión
                      </Button>
                      <Link href="/web-dashboard" onClick={closeSheet}>
                        <Button variant="destructive" className="w-full justify-start">
                          Mi Cuenta
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Desktop Navigation */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-8 text-sm font-medium">
            {!user ? (
              <>
                <Link href="/" className={getMenuItemClass('/')}>
                  Inicio
                </Link>
                <Link href="/sign-in" className={getMenuItemClass('/sign-in')}>
                  Iniciar Sesión
                </Link>
                <Link href="/sign-up" className={getMenuItemClass('/sign-up')}>
                  Registrarse
                </Link>
              </>
            ) : (
              <>
                <Link href="/" className={getMenuItemClass('/')}>
                  Inicio
                </Link>
                <button onClick={handleSignOut} className={getMenuItemClass('/sign-out')}>
                  Cerrar Sesión
                </button>
                <Link href="/web-dashboard" className={getMenuItemClass('/web-dashboard')}>
                  Mi Cuenta
                </Link>
              </>
            )}
          </nav>
          
          {/* Theme Toggle */}
          <div className="flex items-center space-x-2">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
