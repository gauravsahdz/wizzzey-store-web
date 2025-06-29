import Link from 'next/link';
import { Facebook, Twitter, Instagram } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-card text-card-foreground border-t mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-2 font-headline">Wizzzey Store</h3>
            <p className="text-sm text-muted-foreground">Your fashion destination for the latest trends.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 font-headline">Quick Links</h3>
            <ul className="space-y-1">
              <li><Link href="/shop" className="text-sm hover:text-primary transition-colors">Shop</Link></li>
              <li><Link href="/cart" className="text-sm hover:text-primary transition-colors">Cart</Link></li>
              <li><Link href="/profile" className="text-sm hover:text-primary transition-colors">My Account</Link></li>
              <li><Link href="/orders" className="text-sm hover:text-primary transition-colors">Order History</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 font-headline">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/share/1FnjQMVcaB/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Facebook size={20} /></a>
              <a href="https://www.instagram.com/wizzzey.official?igsh=MWlvYWNzaDV6NDh3OQ%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Instagram size={20} /></a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t border-border text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Wizzzey Store. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
