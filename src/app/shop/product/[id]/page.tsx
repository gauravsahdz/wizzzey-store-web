"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import type { Product } from '@/lib/types';
import { fetchProductById } from '@/services/api'; // Updated import
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, ArrowLeft, CheckCircle, Star } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import ProductCard from '@/components/ProductCard'; 
import { getMockProducts } from '@/lib/mock-data'; // Keep for related products for now

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { id } = params;

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined);

  const { addToCart } = useCart();

  useEffect(() => {
    if (typeof id === 'string') {
      setLoading(true);
      fetchProductById(id)
        .then(data => {
          if (data) {
            setProduct(data);
            if (data.availableSizes && data.availableSizes.length > 0) {
              setSelectedSize(data.availableSizes[0]);
            }
            if (data.colors && data.colors.length > 0) {
              setSelectedColor(data.colors[0].name);
            }
            // Fetch related products (e.g., from the same category) - still mock
            getMockProducts(1, 4, { categoryId: data.categoryId }).then(relatedData => {
              setRelatedProducts(relatedData.data.items.filter(p => p.id !== data.id));
            });
          } else {
            toast({
              title: 'Product Not Found',
              description: 'The product you are looking for does not exist or could not be loaded.',
              variant: 'destructive',
            });
            // Optionally redirect, or let the "Product not found" message render
            // router.push('/shop'); 
          }
        })
        .catch(error => {
          console.error("Failed to fetch product:", error);
          toast({
            title: 'Error Loading Product',
            description: error.message || 'There was an issue loading the product details.',
            variant: 'destructive',
          });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id, router, toast]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity, selectedSize, selectedColor);
      toast({
        title: "Added to cart!",
        description: `${product.name} (x${quantity}) has been added to your cart.`,
        action: (
          <Button variant="outline" size="sm" onClick={() => router.push('/cart')}>
            View Cart
          </Button>
        ),
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-[60vh]"><LoadingSpinner size={64} /></div>;
  }

  if (!product) {
    return <div className="text-center py-10 text-xl">Product not found. It might have been removed or the link is incorrect.</div>;
  }
  
  const mainImage = (product.images && product.images[0]) || "https://placehold.co/600x800.png";
  const allImages = [mainImage, ...(product.media || []).map((m: any) => m.url).filter(Boolean)];
  const thumbnailImages = allImages.length > 1 ? allImages.slice(1, 4) : [];
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discount = hasDiscount
    ? product.discountPercentage || Math.round(100 - (product.price / product.compareAtPrice) * 100)
    : 0;
  const ratings = product.ratings || { average: 0, count: 0 };
  const isLowStock = typeof product.lowStockThreshold === 'number' && product.stock > 0 && product.stock <= product.lowStockThreshold;

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {product.isFeatured && <span className="bg-yellow-400 text-xs font-bold px-2 py-1 rounded">Featured</span>}
        {isLowStock && <span className="text-xs text-orange-600">Low stock</span>}
      </div>
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft size={16} className="mr-2" /> Back to Shop
      </Button>
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Images */}
        <div className="flex flex-col gap-4">
            <div className="relative w-full aspect-[3/4] shadow-lg overflow-hidden rounded-none">
                 <Image
                    src={mainImage}
                    alt={product.name}
                    layout="fill"
                    objectFit="cover"
                    priority
                    data-ai-hint="fashion clothing model"
                 />
            </div>
            {thumbnailImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                    {thumbnailImages.map((img, index) => (
                        <div key={index} className="relative aspect-square shadow-md overflow-hidden rounded-none">
                             <Image src={img} alt={`${product.name} thumbnail ${index + 1}`} layout="fill" objectFit="cover" data-ai-hint="clothing detail"/>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Product Details */}
        <div className="flex flex-col justify-center">
          <h1 className="text-3xl lg:text-4xl font-bold mb-3 font-headline">{product.name}</h1>
          {product.categoryName && <p className="text-md text-muted-foreground mb-3">Category: {product.categoryName}</p>}
          <div className="flex items-center mb-4">
            <div className="flex text-yellow-400">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={20} fill={i < ratings.average ? 'currentColor' : 'none'} />)}
            </div>
            <span className="ml-2 text-muted-foreground">({ratings.count} Reviews)</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            {hasDiscount && (
              <>
                <span className="text-3xl font-semibold text-primary">₹{product.price.toFixed(2)}</span>
                <span className="text-lg line-through text-muted-foreground">₹{product.compareAtPrice?.toFixed(2)}</span>
                <span className="text-md text-green-600 font-semibold">{discount}% OFF</span>
              </>
            )}
            {!hasDiscount && (
              <span className="text-3xl font-semibold text-primary">₹{product.price.toFixed(2)}</span>
            )}
          </div>
          <p className="text-foreground leading-relaxed mb-6">{product.description}</p>

          {product.availableSizes && product.availableSizes.length > 0 && (
            <div className="mb-6">
              <label htmlFor="size-select" className="block text-sm font-medium text-foreground mb-1">Size:</label>
              {product.availableSizes.map(size => (
                <Button key={size} variant="outline" onClick={() => setSelectedSize(size)}
                className={`${selectedSize === size ? 'bg-primary text-white' : ''}`}
                >{size}</Button>
              ))}
            </div>
          )}
          {product.colors && product.colors.length > 0 && (
            <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">Color:</label>
                <div className="flex space-x-2">
                    {product.colors.map(color => (
                        <Button 
                            key={color.name} 
                            variant={selectedColor === color.name ? "default" : "outline"}
                            onClick={() => setSelectedColor(color.name)}
                            className="p-0 w-8 h-8 rounded-full border-2 flex items-center justify-center"
                            style={{ borderColor: selectedColor === color.name ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}
                            aria-label={`Select color ${color.name}`}
                        >
                           <span className="block w-6 h-6 rounded-full" style={{ backgroundColor: color.code }}></span>
                        </Button>
                    ))}
                </div>
            </div>
          )}
          <div className="flex items-center space-x-4 mb-6">
            <label htmlFor="quantity" className="text-sm font-medium text-foreground">Quantity:</label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 text-center"
            />
          </div>
          {product.stock === 0 || product.status === 'out_of_stock' ? (
            <Button size="lg" disabled className="w-full md:w-auto">
              Out of Stock
            </Button>
          ) : (
            <Button size="lg" onClick={handleAddToCart} className="w-full md:w-auto transition-transform transform hover:scale-105">
              <ShoppingCart size={20} className="mr-2" /> Add to Cart
            </Button>
          )}
          {product.stock > 0 && (
             <div className="flex items-center text-green-600 mt-4">
                <CheckCircle size={18} className="mr-2"/>
                <span>In Stock - Ships in 2-3 business days</span>
             </div>
          )}
          <div className="flex flex-wrap gap-2 mt-4">
            {product.tags && product.tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 text-xs bg-accent rounded">{tag}</span>
            ))}
          </div>
          <div className="mt-6 border-t pt-4">
            <h3 className="text-lg font-semibold mb-2">Product Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
              {product.weight && (
                <div><span className="font-medium">Weight:</span> {product.weight.value} {product.weight.unit}</div>
              )}
              {product.dimensions && (
                <div><span className="font-medium">Dimensions:</span> {product.dimensions.length} x {product.dimensions.width} x {product.dimensions.height} {product.dimensions.unit}</div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6 text-center font-headline">You Might Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

