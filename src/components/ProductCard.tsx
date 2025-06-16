
"use client";

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Eye } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation'; // Added for Quick View navigation

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const router = useRouter(); // Added for Quick View navigation

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent link navigation if card itself is a link
    e.preventDefault();
    addToCart(product);
    toast({
      title: "Added to cart!",
      description: `${product.name} has been added to your cart.`,
    });
  };
  
  // Fallback for product image if not available
  const imageUrl = product.images && product.images.length > 0 ? product.images[0] : "https://placehold.co/600x800.png";

  console.log(imageUrl);


  return (
    <div className="bg-card text-card-foreground shadow-lg hover:shadow-xl transition-shadow duration-300 group overflow-hidden">
      <Link href={`/shop/product/${product.id}`} aria-label={`View details for ${product.name}`}>
        <div className="relative w-full aspect-[3/4] overflow-hidden">
          <Image
            src={imageUrl}
            alt={product.name}
            layout="fill"
            objectFit="cover"
            className="group-hover:scale-105 transition-transform duration-500 ease-in-out"
            data-ai-hint="fashion clothing"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Button variant="outline" size="sm" className="bg-background/80 hover:bg-background text-foreground" onClick={(e) => { e.preventDefault(); router.push(`/shop/product/${product.id}`) }}>
              <Eye size={16} className="mr-2" /> Quick View
            </Button>
          </div>
        </div>
      </Link>
      <div className="p-4">
        <Link href={`/shop/product/${product.id}`}>
          <h3 className="text-lg font-semibold truncate font-headline hover:text-primary transition-colors" title={product.name}>{product.name}</h3>
        </Link>
        {product.categoryName && <p className="text-sm text-muted-foreground mb-1">{product.categoryName}</p>}
        <div className="flex items-center justify-between mt-2">
          <p className="text-xl font-bold text-primary">₹{product.price.toFixed(2)}</p>
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleAddToCart}
            aria-label={`Add ${product.name} to cart`}
            className="transition-transform transform hover:scale-105"
            disabled={!product.inStock}
          >
            {product.inStock ? <ShoppingCart size={18} /> : 'Out of Stock'}
          </Button>
        </div>
         {!product.inStock && <p className="text-xs text-destructive mt-1">Currently unavailable</p>}
      </div>
    </div>
  );
};

export default ProductCard;
