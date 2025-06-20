"use client";

import { useState, type FormEvent } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import CartItem from '@/components/CartItem';
import { Button } from '@/components/ui/button';
import OrderConfirmationModal from '@/components/OrderConfirmationModal';
import type { Order, OrderItem, ShippingAddress, CustomerInfo } from '@/lib/types';
import { createOrderApi } from '@/services/api'; 
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, CreditCard, Trash2, Phone } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';


export default function CartPage() {
  const { cartItems, cartTotal, itemCount, clearCart } = useCart();
  const { user, token } = useAuth(); 
  const router = useRouter();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    street: '', city: '', state: '', country: '', zipCode: ''
  });
  const [phone, setPhone] = useState('');
  const [isAddressFormVisible, setIsAddressFormVisible] = useState(false);


  const handleProceedToCheckout = async () => {
    if (!user || !token) { 
      toast({ title: "Authentication Required", description: "Please login to proceed.", variant: "destructive"});
      router.push('/login?redirect=/cart');
      return;
    }
    if (!isAddressFormVisible) {
        setIsAddressFormVisible(true);
        return;
    }

    const requiredAddressFields: (keyof ShippingAddress)[] = ['street', 'city', 'state', 'country', 'zipCode'];
    const missingAddressFields = requiredAddressFields.filter(field => shippingAddress[field].trim() === '');
    
    if (missingAddressFields.length > 0 || phone.trim() === '') {
        let missing = "";
        if (missingAddressFields.length > 0) missing += `Address fields: ${missingAddressFields.join(', ')}. `;
        if (phone.trim() === '') missing += "Phone number. ";
        toast({ title: "Missing Information", description: `Please fill in all required fields. Missing: ${missing.trim()}`, variant: "destructive"});
        return;
    }

    setIsProcessingOrder(true);
    console.log("cartItems", cartItems);
    const orderItems: OrderItem[] = cartItems.map(item => ({
      productId: item.id,
      productName: item.name,
      productImage: item.images[0],
      quantity: item.quantity,
      price: item.price,
      brandId: item.brandId,
    }));

    // Format shipping address into a single string for customerInfo
    const shippingAddressString = `${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}, ${shippingAddress.country}`;

    const customerInfo: CustomerInfo = {
      name: user.name,
      email: user.email,
      phone: phone,
      shippingAddress: shippingAddressString,
      // billingAddress: shippingAddressString, // Or collect separately if needed
    };

    try {
      const newOrder = await createOrderApi({ 
        items: orderItems, 
        customerInfo: customerInfo, 
        shippingAddress: shippingAddress, 
        totalAmount: cartTotal,
        paymentMethod: "mock_stripe" 
      });
      setConfirmedOrder(newOrder);
      setIsModalOpen(true);
      clearCart(); 
    } catch (error: any) {
      console.error("Failed to create order:", error);
      const displayMessage = error.message || "An unexpected error occurred while placing your order. Please try again.";
      toast({ title: "Order Failed", description: displayMessage, variant: "destructive"});
    } finally {
      setIsProcessingOrder(false);
    }
  };

  if (itemCount === 0 && !isModalOpen) {
    return (
      <div className="text-center py-20">
        <ShoppingBag size={64} className="mx-auto text-muted-foreground mb-4" />
        <h1 className="text-3xl font-bold mb-4 font-headline">Your Cart is Empty</h1>
        <p className="text-muted-foreground mb-8">Looks like you haven't added anything to your cart yet.</p>
        <Link href="/shop">
          <Button size="lg">Start Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center font-headline">Your Shopping Cart</h1>
      
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card p-0 shadow-lg rounded-none">
            <div className="divide-y divide-border">
                {cartItems.map(item => (
                    <CartItem key={item.id} item={item} />
                ))}
            </div>
            {cartItems.length > 0 && (
                 <div className="p-4 mt-4 flex justify-end">
                    <Button variant="outline" onClick={clearCart} className="text-destructive hover:bg-destructive/10">
                        <Trash2 size={16} className="mr-2"/> Clear Cart
                    </Button>
                 </div>
            )}
        </div>

        <div className="lg:col-span-1">
          <Card className="shadow-lg rounded-none">
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal ({itemCount} items)</span>
                <span>₹{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-green-600">FREE</span>
              </div>
              <Separator />
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>₹{cartTotal.toFixed(2)}</span>
              </div>

              {isAddressFormVisible && (
                <div className="space-y-3 pt-4">
                    <h3 className="text-lg font-semibold">Shipping Details</h3>
                    <div>
                        <Label htmlFor="street">Street</Label>
                        <Input id="street" value={shippingAddress.street} onChange={e => setShippingAddress({...shippingAddress, street: e.target.value})} placeholder="Enter your street" required/>
                    </div>
                    <div>
                        <Label htmlFor="city">City</Label>
                        <Input id="city" value={shippingAddress.city} onChange={e => setShippingAddress({...shippingAddress, city: e.target.value})} placeholder="Enter your city" required/>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label htmlFor="state">State</Label>
                            <Input id="state" value={shippingAddress.state} onChange={e => setShippingAddress({...shippingAddress, state: e.target.value})} placeholder="Enter your state" required/>
                        </div>
                        <div>
                            <Label htmlFor="zip">Zip Code</Label>
                            <Input id="zip" value={shippingAddress.zipCode} onChange={e => setShippingAddress({...shippingAddress, zipCode: e.target.value})} placeholder="Enter your zip code" required/>
                        </div>
                    </div>
                     <div>
                        <Label htmlFor="country">Country</Label>
                        <Input id="country" value={shippingAddress.country} onChange={e => setShippingAddress({...shippingAddress, country: e.target.value})} placeholder="Enter your country" required/>
                    </div>
                     <div>
                        <Label htmlFor="phone">Phone</Label>
                        <div className="relative">
                            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Enter your phone number" required className="pl-10"/>
                        </div>
                    </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                size="lg" 
                className="w-full" 
                onClick={handleProceedToCheckout}
                disabled={isProcessingOrder || itemCount === 0}
              >
                {isProcessingOrder ? (
                  <LoadingSpinner size={20} color="text-primary-foreground" />
                ) : (
                  <>
                    <CreditCard size={20} className="mr-2" />
                    {isAddressFormVisible ? 'Place Order' : 'Proceed to Checkout'}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
           {!user && (
            <p className="text-sm text-center mt-4 text-muted-foreground">
              Please <Link href="/login?redirect=/cart" className="text-primary underline">Login</Link> or <Link href="/register?redirect=/cart" className="text-primary underline">Register</Link> to checkout.
            </p>
          )}
        </div>
      </div>

      {confirmedOrder && (
        <OrderConfirmationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          order={confirmedOrder}
        />
      )}
    </div>
  );
}
