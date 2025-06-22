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
    console.log('Log: product in handleAddToCart:', product);
    e.stopPropagation(); // Prevent link navigation if card itself is a link
    e.preventDefault();
    addToCart(product);
    toast({
      title: "Added to cart!",
      description: `${product.name} has been added to your cart.`,
    });
  };
  
  // Image logic
  const imageUrl = (product.images && product.images[0]) || "https://placehold.co/600x800.png";

  // Discount logic
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discount = hasDiscount
    ? product.discountPercentage || Math.round(100 - (product.price / product.compareAtPrice) * 100)
    : 0;

  // Stock logic
  const isLowStock = typeof product.lowStockThreshold === 'number' && product.stock > 0 && product.stock <= product.lowStockThreshold;

  // Ratings
  const ratings = product.ratings || { average: 0, count: 0 };

  console.log('Log: product', product);

  return (
    <div className="bg-card text-card-foreground shadow-lg hover:shadow-xl transition-shadow duration-300 group overflow-hidden relative">
      {product.isFeatured && (
        <span className="absolute top-2 left-2 bg-yellow-400 text-xs font-bold px-2 py-1 rounded z-10">Featured</span>
      )}
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
        <div className="flex items-center justify-between mb-1">
          <Link href={`/shop/product/${product.id}`}>
            <h3 className="text-lg font-semibold truncate font-headline hover:text-primary transition-colors" title={product.name}>{product.name}</h3>
          </Link>
          {product.sku && <span className="text-xs text-muted-foreground ml-2">SKU: {product.sku}</span>}
        </div>
        {product.categoryName && <p className="text-sm text-muted-foreground mb-1">{product.categoryName}</p>}
        <div className="flex items-center gap-2 mb-2">
          {hasDiscount && (
            <>
              <span className="text-xl font-bold text-primary">₹{product.price.toFixed(2)}</span>
              <span className="text-sm line-through text-muted-foreground">₹{product.compareAtPrice?.toFixed(2)}</span>
              <span className="text-xs text-green-600 font-semibold">{discount}% OFF</span>
            </>
          )}
          {!hasDiscount && (
            <span className="text-xl font-bold text-primary">₹{product.price.toFixed(2)}</span>
          )}
        </div>
        {typeof product.costPrice === 'number' && (
          <div className="text-xs text-muted-foreground mb-1">Cost: ₹{product.costPrice.toFixed(2)}</div>
        )}
        <div className="flex items-center gap-1 mb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={i < ratings.average ? 'text-yellow-400' : 'text-gray-300'}>★</span>
          ))}
          <span className="text-xs text-muted-foreground ml-1">({ratings.count})</span>
        </div>
        <div className="flex flex-wrap gap-1 mb-2">
          {product.availableSizes && product.availableSizes.map(size => (
            <span key={size} className="px-2 py-0.5 text-xs border rounded bg-muted-foreground/10">{size}</span>
          ))}
        </div>
        <div className="flex flex-wrap gap-1 mb-2">
          {product.colors && product.colors.map(color => (
            <span key={color.id || color._id || color.name} className="w-5 h-5 rounded-full border border-gray-300 inline-block" style={{ backgroundColor: color.code }} title={color.name}></span>
          ))}
        </div>
        <div className="flex flex-wrap gap-1 mb-2">
          {product.tags && product.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 text-xs bg-accent rounded">{tag}</span>
          ))}
        </div>
        <div className="flex items-center justify-between mt-2">
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleAddToCart}
            aria-label={`Add ${product.name} to cart`}
            className="transition-transform transform hover:scale-105"
            disabled={product.stock === 0 || product.status === 'out_of_stock'}
          >
            {product.stock === 0 || product.status === 'out_of_stock' ? 'Out of Stock' : <ShoppingCart size={18} />}
          </Button>
          {isLowStock && <span className="text-xs text-orange-600 ml-2">Low stock</span>}
        </div>
        {product.stock === 0 || product.status === 'out_of_stock' ? (
          <p className="text-xs text-destructive mt-1">Currently unavailable</p>
        ) : (
          <p className="text-xs text-muted-foreground mt-1">In stock: {product.stock}</p>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
