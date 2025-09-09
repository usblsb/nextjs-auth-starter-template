"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { useUser, useAuth } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ThemeToggle } from "@/app/components/theme-toggle";

export default function Header() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSignOut = () => {
    signOut({ redirectUrl: "/" });
  };

  const closeSheet = () => {
    setIsOpen(false);
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
                      <Link href="/sign-up" onClick={closeSheet}>
                        <Button variant="ghost" className="w-full justify-start">
                          Registrarse
                        </Button>
                      </Link>
                      <Link href="/sign-in" onClick={closeSheet}>
                        <Button className="w-full justify-start">
                          Iniciar Sesión
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/web-dashboard" onClick={closeSheet}>
                        <Button variant="ghost" className="w-full justify-start">
                          Mi Cuenta
                        </Button>
                      </Link>
                      <Button 
                        onClick={() => {
                          handleSignOut();
                          closeSheet();
                        }} 
                        variant="outline" 
                        className="w-full justify-start"
                      >
                        Cerrar Sesión
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Desktop Navigation */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/"
              className="hidden text-foreground/60 transition-colors hover:text-foreground md:block"
            >
              Inicio
            </Link>
          </nav>
          
          {/* Desktop Auth Buttons and Theme Toggle */}
          <div className="flex items-center space-x-2">
            {!user ? (
              <>
                <Link href="/sign-up">
                  <Button variant="ghost" size="sm">
                    Registrarse
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button size="sm">
                    Iniciar Sesión
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/web-dashboard">
                  <Button variant="ghost" size="sm">
                    Mi Cuenta
                  </Button>
                </Link>
                <Button onClick={handleSignOut} variant="outline" size="sm">
                  Cerrar Sesión
                </Button>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
