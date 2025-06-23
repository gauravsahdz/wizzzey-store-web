"use client";

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Product, Category, PaginatedResponse } from '@/lib/types';
import { getMockCategories } from '@/lib/mock-data'; // Keep getMockCategories for now
import { fetchProducts } from '@/services/api'; // Use the new API service
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ChevronRight, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast'; // Import useToast

// Component that handles the search params logic
function HomePageContent() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [featuredCategories, setFeaturedCategories] = useState<Category[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const { toast } = useToast(); // Initialize toast
  const searchParams = useSearchParams();
  const router = useRouter();

  // Check for products_ids parameter and redirect to shop page
  useEffect(() => {
    const productsIds = searchParams.get('products_ids');
    if (productsIds) {
      // Redirect to shop page with the products_ids parameter
      router.push(`/shop?products_ids=${encodeURIComponent(productsIds)}`);
    }
  }, [searchParams, router]);

  useEffect(() => {
    setLoadingProducts(true);
    fetchProducts({ page: 1, limit: 4 }) // Fetch 4 featured products using the new service
      .then((response: PaginatedResponse<Product>) => {
        if (response && response.data && Array.isArray(response.data.items)) {
          console.log('Log: response.data.items', response.data.items);
          setFeaturedProducts(response.data.items);
        } else {
          console.warn("Featured products API response is not in the expected format or items are missing:", response);
          setFeaturedProducts([]);
        }
      })
      .catch(error => {
        console.error("Failed to fetch featured products:", error);
        toast({ // Display toast on error
          title: "Error Loading Products",
          description: error.message || "Could not fetch products. Please try again later.",
          variant: "destructive",
        });
        setFeaturedProducts([]);
      })
      .finally(() => {
        setLoadingProducts(false);
      });

    setLoadingCategories(true);
    getMockCategories() // Categories still from mock as per current scope
      .then(data => {
        setFeaturedCategories(data.slice(0, 3)); // Show 3 featured categories
      })
      .catch(error => {
        console.error("Failed to fetch featured categories:", error);
        toast({ // Display toast on error
            title: "Error Loading Categories",
            description: error.message || "Could not fetch categories.",
            variant: "destructive",
        });
        setFeaturedCategories([]);
      })
      .finally(() => {
        setLoadingCategories(false);
      });
  }, [toast]); // Add toast to dependency array

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary/10 via-background to-accent/10 py-20 md:py-32 rounded-none overflow-hidden">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-primary-foreground mix-blend-overlay font-headline animate-fade-in-down">
             Discover Your Style
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in-up">
            Explore the latest trends and timeless classics. Quality clothing for every occasion.
          </p>
          <Link href="/shop">
            <Button size="lg" className="animate-bounce-subtle group">
              Shop Now <ChevronRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
         <div className="absolute inset-0 z-[-1] overflow-hidden">
            <Image src="/hero.jpg" alt="Fashion background" layout="fill" objectFit="cover" className="opacity-80" data-ai-hint="fashion runway model"/>
        </div>
      </section>

      {/* Featured Products Section */}
      <section>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold font-headline">Featured Collection</h2>
          <Link href="/shop">
            <Button variant="outline" className="group">
              View All <ChevronRight size={18} className="ml-1 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </Link>
        </div>
        {loadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <div key={i} className="bg-card p-4 shadow-md rounded-none h-[400px] flex items-center justify-center"><LoadingSpinner/></div>)}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p>No featured products available at the moment. Try refreshing the page or check back later.</p>
        )}
      </section>

      {/* Featured Categories Section */}
      <section>
         <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold font-headline">Shop by Category</h2>
         </div>
        {loadingCategories ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {[...Array(3)].map((_, i) => <div key={i} className="bg-card p-4 shadow-md rounded-none h-[200px] flex items-center justify-center"><LoadingSpinner/></div>)}
          </div>
        ) : featuredCategories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCategories.map(category => (
              <Link href={`/shop?category=${category.id}`} key={category.id} className="group block">
                <div className="relative aspect-video overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-none">
                  <Image
                    src={category.imageUrl || `https://placehold.co/400x300.png`}
                    alt={category.name}
                    layout="fill"
                    objectFit="cover"
                    className="group-hover:scale-105 transition-transform duration-500 ease-in-out"
                    data-ai-hint="fashion category apparel"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center p-4">
                    <h3 className="text-2xl font-semibold text-white text-center font-headline">{category.name}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p>No categories to display.</p>
        )}
      </section>

      {/* New Arrivals / Call to Action */}
      <section className="bg-accent text-accent-foreground py-16 rounded-none">
        <div className="container mx-auto text-center">
          <Zap size={48} className="mx-auto mb-4 text-primary"/>
          <h2 className="text-3xl font-bold mb-4 font-headline">Fresh Styles Just In!</h2>
          <p className="text-lg mb-8 max-w-xl mx-auto">
            Don't miss out on our newest arrivals. Update your wardrobe with the latest looks.
          </p>
          <Link href="/shop?sortBy=createdAt&sortOrder=desc">
            <Button size="lg" variant="secondary" className="bg-background text-primary hover:bg-primary/10">
              Explore New Arrivals
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="space-y-16">
        <section className="relative bg-gradient-to-r from-primary/10 via-background to-accent/10 py-20 md:py-32 rounded-none overflow-hidden">
          <div className="container mx-auto text-center">
            <div className="animate-pulse">
              <div className="h-16 bg-gray-300 rounded mb-6"></div>
              <div className="h-8 bg-gray-300 rounded mb-10 max-w-2xl mx-auto"></div>
              <div className="h-12 bg-gray-300 rounded w-32 mx-auto"></div>
            </div>
          </div>
        </section>
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner size={64} />
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
