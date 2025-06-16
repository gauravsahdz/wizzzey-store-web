"use client";

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { Order } from '@/lib/types';
import { fetchMyOrders } from '@/services/api'; 
import OrderHistoryItem from '@/components/OrderHistoryItem';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { History, ShoppingBag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast'; 

function OrdersContent() {
  const { user, loading: authLoading, token } = useAuth(); 
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const router = useRouter();
  const { toast } = useToast(); 

  useEffect(() => {
    if (authLoading) return; 

    if (!user || !token) { 
      router.push('/login?redirect=/orders');
    } else {
      setLoadingOrders(true);
      fetchMyOrders() // Fetches page 1, limit 10, sorted by createdAt desc by default
        .then(data => { // fetchMyOrders returns Order[] from the first page
          setOrders(data);
        })
        .catch(error => {
          console.error("Failed to fetch orders:", error);
          toast({ 
            title: "Error Loading Orders",
            description: error.message || "Could not fetch your orders. Please try again later.",
            variant: "destructive",
          });
          setOrders([]); 
        })
        .finally(() => {
          setLoadingOrders(false);
        });
    }
  }, [user, authLoading, token, router, toast]); 

  if (authLoading || loadingOrders) {
    return <div className="flex justify-center items-center min-h-[60vh]"><LoadingSpinner size={64} /></div>;
  }

  if (!user) {
    // This case should ideally be handled by the redirect, but as a fallback:
    return <div className="text-center py-10">Please login to view your orders.</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold font-headline flex items-center"><History size={28} className="mr-3 text-primary"/>My Orders</h1>
      </div>

      {orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map(order => (
            <OrderHistoryItem key={order.id} order={order} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-card shadow-md rounded-none p-10">
          <ShoppingBag size={64} className="mx-auto text-muted-foreground mb-6" />
          <h2 className="text-2xl font-semibold mb-3 font-headline">No Orders Yet</h2>
          <p className="text-muted-foreground mb-8">You haven't placed any orders with us. Time to find something you love!</p>
          <Link href="/shop">
            <Button size="lg">Start Shopping</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size={64} />
      </div>
    }>
      <OrdersContent />
    </Suspense>
  );
}
