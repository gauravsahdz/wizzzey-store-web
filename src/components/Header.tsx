
"use client";

import Link from 'next/link';
import { ShoppingCart, User as UserIcon, LogIn, LogOut, Shirt } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const Header = () => {
  const { itemCount, hasMounted } = useCart();
  const { user, logout } = useAuth();

  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary font-headline">
          <Image src="/wizzzey_logo.png" alt="Wizzzey Store" width={100} height={100} />
        </Link>
        <nav className="flex items-center space-x-4 md:space-x-6">
          <Link href="/" className="text-foreground hover:text-primary transition-colors">
            Home
          </Link>
          <Link href="/shop" className="text-foreground hover:text-primary transition-colors">
            Shop
          </Link>
          <Link href="/cart" className="relative flex items-center text-foreground hover:text-primary transition-colors">
            <ShoppingCart size={24} />
            <span
              className={cn(
                "absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center transition-opacity duration-200",
                (hasMounted && itemCount > 0) ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
              aria-hidden={!(hasMounted && itemCount > 0)}
            >
              {(hasMounted && itemCount > 0) ? itemCount : null}
            </span>
            <span className="ml-1 md:hidden">Cart</span> {/* This is the text "Cart" for mobile */}
          </Link>
          {user ? (
            <>
              <Link href="/profile" className="flex items-center text-foreground hover:text-primary transition-colors">
                <UserIcon size={24} />
                <span className="ml-1 hidden md:inline">Profile</span>
              </Link>
              <Button variant="ghost" size="sm" onClick={logout} className="flex items-center text-foreground hover:text-primary transition-colors">
                <LogOut size={20} className="mr-1" />
                <span className="hidden md:inline">Logout</span>
              </Button>
            </>
          ) : (
            <Link href="/login" className="flex items-center text-foreground hover:text-primary transition-colors">
              <LogIn size={24} />
              <span className="ml-1 hidden md:inline">Login</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
