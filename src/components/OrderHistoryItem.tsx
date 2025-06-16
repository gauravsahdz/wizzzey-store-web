
"use client";

import type { Order } from '@/lib/types';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Truck, Package, CheckCircle, XCircle, Clock } from 'lucide-react';

interface OrderHistoryItemProps {
  order: Order;
}

const getStatusStyles = (status: Order['status']) => {
  switch (status) {
    case 'Pending':
      return { icon: <Clock size={16} className="mr-1.5" />, color: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/50', label: 'Pending' };
    case 'Processing':
      return { icon: <Package size={16} className="mr-1.5" />, color: 'bg-blue-500/20 text-blue-700 border-blue-500/50', label: 'Processing' };
    case 'Shipped':
      return { icon: <Truck size={16} className="mr-1.5" />, color: 'bg-purple-500/20 text-purple-700 border-purple-500/50', label: 'Shipped' };
    case 'Delivered':
      return { icon: <CheckCircle size={16} className="mr-1.5" />, color: 'bg-green-500/20 text-green-700 border-green-500/50', label: 'Delivered' };
    case 'Cancelled':
      return { icon: <XCircle size={16} className="mr-1.5" />, color: 'bg-red-500/20 text-red-700 border-red-500/50', label: 'Cancelled' };
    default:
      return { icon: <Clock size={16} className="mr-1.5" />, color: 'bg-gray-500/20 text-gray-700 border-gray-500/50', label: 'Unknown' };
  }
};

const OrderHistoryItem: React.FC<OrderHistoryItemProps> = ({ order }) => {
  const statusStyle = getStatusStyles(order.status);

  const shippingAddressString = order.shippingAddress
    ? `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}, ${order.shippingAddress.country}`
    : 'Shipping address not available';

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 rounded-none">
      <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center pb-3">
        <div>
          <CardTitle className="text-xl font-headline">Order #{order.id.substring(0,8)}</CardTitle>
          <CardDescription>
            Placed on: {new Date(order.createdAt).toLocaleDateString()}
          </CardDescription>
        </div>
        <Badge variant="outline" className={`px-3 py-1 text-sm ${statusStyle.color} flex items-center mt-2 sm:mt-0`}>
            {statusStyle.icon} {statusStyle.label}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-4">
          {order.items.map(item => (
            <div key={item.productId} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50">
              <div className="relative w-16 h-16 rounded-none overflow-hidden">
                <Image 
                  src={item.productImage || "https://placehold.co/100x100.png"} 
                  alt={item.productName || 'Product Image'} 
                  layout="fill" 
                  objectFit="cover"
                  data-ai-hint="ordered product clothing"
                />
              </div>
              <div>
                <p className="font-medium">{item.productName || 'Product Name Unavailable'}</p>
                <p className="text-sm text-muted-foreground">
                  Quantity: {item.quantity} x ₹{item.price.toFixed(2)}
                </p>
              </div>
              <p className="ml-auto font-medium">₹{(item.quantity * item.price).toFixed(2)}</p>
            </div>
          ))}
        </div>
        <Separator className="my-3"/>
         <div className="text-sm text-muted-foreground">
            <p><span className="font-medium">Shipping Address:</span> {shippingAddressString}</p>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/30 p-4 flex justify-end items-center">
        <p className="text-lg font-semibold">Total: <span className="text-primary">₹{order.totalAmount.toFixed(2)}</span></p>
      </CardFooter>
    </Card>
  );
};

export default OrderHistoryItem;

