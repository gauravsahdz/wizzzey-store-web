"use client";

import { Suspense } from 'react';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon, Mail, LogOut, ShoppingBag, Edit3, Shield, Phone, Home, Building } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';
import type { ShippingAddress } from '@/lib/types'; // Ensure ShippingAddress is imported if used standalone

const formatAddress = (address?: ShippingAddress) => {
  if (!address) return 'Not set';
  return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}, ${address.country}`;
};

function ProfileContent() {
  const { user, logout, loading, token } = useAuth(); 
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/profile');
    }
  }, [user, loading, token, router]); 

  if (loading) {
    return <div className="flex justify-center items-center min-h-[60vh]"><LoadingSpinner size={64} /></div>;
  }

  if (!user) {
    return null; 
  }

  const getInitials = (name: string) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="container mx-auto py-12 max-w-3xl">
      <Card className="shadow-xl rounded-none overflow-hidden">
        <CardHeader className="bg-muted/50 p-8 text-center">
          <Avatar className="w-28 h-28 mx-auto mb-4 border-4 border-primary shadow-lg">
            <AvatarImage src={user.avatarUrl || `https://placehold.co/100x100.png?text=${getInitials(user.name)}`} alt={user.name} />
            <AvatarFallback className="text-3xl bg-primary text-primary-foreground">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl font-bold font-headline">{user.name}</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">{user.email}</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <div>
            <h3 className="text-xl font-semibold mb-4 font-headline">Account Details</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <UserIcon size={20} className="mr-3 text-primary" />
                <span className="text-muted-foreground">Name:</span>
                <span className="ml-2 font-medium">{user.name}</span>
              </div>
              <div className="flex items-center">
                <Mail size={20} className="mr-3 text-primary" />
                <span className="text-muted-foreground">Email:</span>
                <span className="ml-2 font-medium">{user.email}</span>
              </div>
               <div className="flex items-center">
                <Phone size={20} className="mr-3 text-primary" />
                <span className="text-muted-foreground">Phone:</span>
                <span className="ml-2 font-medium">{user.phone || 'Not set'}</span>
              </div>
              <div className="flex items-center">
                <Shield size={20} className="mr-3 text-primary" />
                <span className="text-muted-foreground">Role:</span>
                <span className="ml-2 font-medium">{user.role}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4 font-headline">Addresses</h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <Home size={20} className="mr-3 text-primary mt-1" />
                <div>
                  <span className="text-muted-foreground">Shipping Address:</span>
                  <p className="font-medium">{formatAddress(user.shippingAddress)}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Building size={20} className="mr-3 text-primary mt-1" />
                 <div>
                  <span className="text-muted-foreground">Billing Address:</span>
                  <p className="font-medium">{formatAddress(user.billingAddress)}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div>
             <h3 className="text-xl font-semibold mb-4 font-headline">Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button variant="outline" asChild>
                <Link href="/orders">
                  <ShoppingBag size={18} className="mr-2" /> View Order History
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/profile/edit">
                  <Edit3 size={18} className="mr-2" /> Edit Profile
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-6 text-center flex justify-center">
            <Button variant="destructive" onClick={logout} size="lg">
              <LogOut size={20} className="mr-2" /> Logout
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size={64} />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
