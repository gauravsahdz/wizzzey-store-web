
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import AnimatedCheckmark from './AnimatedCheckmark';
import { useRouter } from 'next/navigation';
import type { Order } from '@/lib/types';

interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({ isOpen, onClose, order }) => {
  const router = useRouter();

  const handleViewOrders = () => {
    onClose();
    router.push('/orders');
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-8 text-center animate-scale-in">
        <DialogHeader className="space-y-4">
          <div className="mx-auto mb-4">
            <AnimatedCheckmark size={100} />
          </div>
          <DialogTitle className="text-3xl font-bold font-headline">Order Placed Successfully!</DialogTitle>
          <DialogDescription className="text-muted-foreground text-lg">
            Your order <span className="font-semibold text-primary">#{order.id.substring(0,8)}</span> has been confirmed.
            You will receive an email confirmation shortly.
          </DialogDescription>
        </DialogHeader>
        <div className="my-6">
          <p className="text-lg">Total Amount: <span className="font-bold text-primary">₹{order.totalAmount.toFixed(2)}</span></p>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button onClick={handleViewOrders} size="lg" className="w-full sm:w-auto">
            View My Orders
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderConfirmationModal;
