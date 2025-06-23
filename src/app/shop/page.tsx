"use client";

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type { Product, PaginatedResponse, Category, AvailableFilters, AppliedFilters } from '@/lib/types';
import { fetchProducts, fetchCategories } from '@/services/api'; 
import ProductCard from '@/components/ProductCard';
import FilterPanel from '@/components/FilterPanel';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List, Filter } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';


// AppliedFiltersState is what the FilterPanel outputs and what is stored in the URL
type AppliedFiltersStateFromPanel = {
  priceRange?: [number, number];
  categoryIds?: string[]; // FilterPanel can select multiple categories
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  productsIds?: string[]; // Added for products_ids
};

// AppliedFiltersForApi is what's passed to the fetchProducts service
// and reflects the API's capability (e.g. single categoryId)
type AppliedFiltersForApi = {
  page?: number;
  limit?: number;
  categoryId?: string; // API expects single categoryId
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  product_ids?: string[]; // Array of product IDs to fetch specific products
};

function ShopContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [productsResponse, setProductsResponse] = useState<PaginatedResponse<Product> | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [currentFiltersForPanel, setCurrentFiltersForPanel] = useState<AppliedFiltersStateFromPanel>({});
  
  // Default price range, can be updated by API response if available
  const [apiPriceRange, setApiPriceRange] = useState<{min: number, max: number} | null>(null);

  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const parseFiltersFromUrl = useCallback((): AppliedFiltersStateFromPanel => {
    const sortBy = searchParams.get('sortBy') || undefined;
    const sortOrder = (searchParams.get('sortOrder') || undefined) as 'asc' | 'desc' | undefined;
    const categoryIdsFromUrl = searchParams.getAll('category'); // Can be multiple from URL
    const minPriceStr = searchParams.get('minPrice');
    const maxPriceStr = searchParams.get('maxPrice');
    const productsIdsStr = searchParams.get('products_ids'); // Get products_ids from URL
    
    let priceRangeVal: [number, number] | undefined = undefined;
    if (minPriceStr && maxPriceStr) {
        priceRangeVal = [parseFloat(minPriceStr), parseFloat(maxPriceStr)];
    }
    
    let productsIds: string[] | undefined = undefined;
    if (productsIdsStr) {
      try {
        // First try to parse as JSON
        productsIds = JSON.parse(productsIdsStr);
        // Ensure it's an array
        if (!Array.isArray(productsIds)) {
          console.warn('products_ids parameter is not an array, ignoring');
          productsIds = undefined;
        }
      } catch (error) {
        console.warn('Failed to parse products_ids as JSON, trying alternative formats:', error);
        
        // Try to parse as comma-separated values within brackets
        // Handle format like: [id1, id2, id3] or [id1,id2,id3]
        const bracketMatch = productsIdsStr.match(/^\[(.*)\]$/);
        if (bracketMatch) {
          const idsString = bracketMatch[1];
          // Split by comma and clean up whitespace
          const ids = idsString.split(',').map(id => id.trim()).filter(id => id.length > 0);
          if (ids.length > 0) {
            productsIds = ids;
            console.log('Parsed products_ids from bracket format:', productsIds);
          }
        } else {
          // Try to parse as single ID
          const singleId = productsIdsStr.trim();
          if (singleId.length > 0) {
            productsIds = [singleId];
            console.log('Parsed products_ids as single ID:', productsIds);
          }
        }
        
        if (!productsIds) {
          console.warn('Could not parse products_ids parameter in any format:', productsIdsStr);
        }
      }
    }
    
    console.log('Final parsed productsIds:', productsIds);
    
    return {
      sortBy,
      sortOrder,
      categoryIds: categoryIdsFromUrl.length > 0 ? categoryIdsFromUrl : undefined,
      priceRange: priceRangeVal,
      productsIds,
    };
  }, [searchParams]);

  useEffect(() => {
    setLoadingCategories(true);
    fetchCategories()
      .then(data => {
        setCategories(data);
      })
      .catch(error => {
        console.error("Failed to fetch categories:", error);
        toast({ title: "Error Loading Categories", description: error.message || "Could not fetch category options.", variant: "destructive"});
        setCategories([]); 
      })
      .finally(() => {
        setLoadingCategories(false);
      });
  }, [toast]);


  const loadProducts = useCallback(async (filtersToApply: AppliedFiltersStateFromPanel, page: number = 1) => {
    setLoadingProducts(true);
    try {
      const serviceParams: AppliedFiltersForApi = {
        page: page,
        limit: 9, 
        categoryId: filtersToApply.categoryIds?.[0], // Send first selected category, or undefined
        minPrice: filtersToApply.priceRange?.[0],
        maxPrice: filtersToApply.priceRange?.[1],
        sortBy: filtersToApply.sortBy,
        sortOrder: filtersToApply.sortOrder,
        product_ids: filtersToApply.productsIds, // Pass product IDs if available
      };
      
      console.log('Loading products with params:', serviceParams);
      console.log('Product IDs being sent:', serviceParams.product_ids);
      
      const response = await fetchProducts(serviceParams);
      console.log('API response:', response);
      
      setProductsResponse(response);
      if(response.filters?.available?.minPrice !== undefined && response.filters?.available?.maxPrice !== undefined){
        setApiPriceRange({min: response.filters.available.minPrice, max: response.filters.available.maxPrice});
      }
    } catch (error: any) {
      console.error("Failed to fetch products:", error);
      toast({ title: "Error Loading Products", description: error.message || "Could not fetch products.", variant: "destructive"});
      setProductsResponse(null); 
    } finally {
      setLoadingProducts(false);
    }
  }, [toast]);

  useEffect(() => {
    const filtersFromUrl = parseFiltersFromUrl();
    const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);
    setCurrentFiltersForPanel(filtersFromUrl); 
    
    // Load products only when categories are also loaded or if category loading fails
    // This avoids trying to filter by category before categories are available.
    if (!loadingCategories) { 
        loadProducts(filtersFromUrl, pageFromUrl);
    }
  }, [searchParams, loadProducts, loadingCategories, parseFiltersFromUrl]);


  const handleFilterChange = (newFiltersFromPanel: Partial<AppliedFiltersStateFromPanel>) => {
    const queryParams = new URLSearchParams();

    if (newFiltersFromPanel.priceRange) {
      queryParams.set('minPrice', newFiltersFromPanel.priceRange[0].toString());
      queryParams.set('maxPrice', newFiltersFromPanel.priceRange[1].toString());
    }
    // If categoryIds is an empty array, it means "all categories" (no specific category filter)
    // So we don't append 'category' if newFiltersFromPanel.categoryIds is empty or undefined.
    if (newFiltersFromPanel.categoryIds && newFiltersFromPanel.categoryIds.length > 0) {
        newFiltersFromPanel.categoryIds.forEach(catId => queryParams.append('category', catId));
    }

    if (newFiltersFromPanel.sortBy) queryParams.set('sortBy', newFiltersFromPanel.sortBy);
    if (newFiltersFromPanel.sortOrder) queryParams.set('sortOrder', newFiltersFromPanel.sortOrder);
    
    queryParams.set('page', '1'); 

    router.push(`${pathname}?${queryParams.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const queryParams = new URLSearchParams(searchParams.toString());
    queryParams.set('page', newPage.toString());
    router.push(`${pathname}?${queryParams.toString()}`);
  };
  
  const constructedAvailableFilters: AvailableFilters | null = loadingCategories 
    ? null 
    : {
        categories: categories,
        priceRange: apiPriceRange || { min: 0, max: 5000 } // Use API provided range or default
      };

  const isLoading = loadingProducts || loadingCategories;
  const currentCategoryName = currentFiltersForPanel.categoryIds?.[0] && categories.find(c => c.id === currentFiltersForPanel.categoryIds![0])?.name;
  const isViewingSpecificProducts = currentFiltersForPanel.productsIds && currentFiltersForPanel.productsIds.length > 0;


  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Mobile filter button and sidebar */}
      <div className="block md:hidden mb-4">
        <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full flex items-center gap-2" onClick={() => setFilterSheetOpen(true)}>
              <Filter size={18} />
              <span>Filter</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 max-w-xs w-full">
            <div className="p-6">
              <FilterPanel
                availableFilters={constructedAvailableFilters}
                loadingFilters={loadingCategories}
                onFilterChange={(filters) => {
                  handleFilterChange(filters);
                  setFilterSheetOpen(false);
                }}
                initialFilters={currentFiltersForPanel}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
      {/* Desktop sidebar */}
      {!isViewingSpecificProducts && (
        <aside className="hidden md:block w-full md:w-1/4 lg:w-1/5">
          <FilterPanel 
            availableFilters={constructedAvailableFilters} 
            loadingFilters={loadingCategories} 
            onFilterChange={handleFilterChange}
            initialFilters={currentFiltersForPanel} 
          />
        </aside>
      )}
      <main className={`w-full ${!isViewingSpecificProducts ? 'md:w-3/4 lg:w-4/5' : ''}`}>
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold font-headline">
            {isViewingSpecificProducts ? 'Selected Products' : (currentCategoryName || 'All Products')}
          </h1>
          <div className="flex items-center gap-2">
             <span className="text-sm text-muted-foreground">
                {isViewingSpecificProducts ? 
                  `${productsResponse?.data.items.length || 0} selected products` :
                  (productsResponse?.pagination && productsResponse.pagination.total > 0 ? 
                    `Showing ${((productsResponse.pagination.page - 1) * productsResponse.pagination.limit) + 1}-${Math.min(productsResponse.pagination.page * productsResponse.pagination.limit, productsResponse.pagination.total)} of ${productsResponse.pagination.total} products` 
                    : productsResponse?.pagination?.total === 0 ? '0 products found' : '')
                }
             </span>
            <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('grid')} aria-label="Grid view">
              <LayoutGrid size={20} />
            </Button>
            <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')} aria-label="List view">
              <List size={20} />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <LoadingSpinner size={48} />
          </div>
        ) : productsResponse && productsResponse.data.items.length > 0 ? (
          <>
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
              {productsResponse.data.items.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {!isViewingSpecificProducts && productsResponse.pagination && productsResponse.pagination.totalPages > 1 && (
              <Pagination className="mt-12">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); if(productsResponse.pagination!.hasPrevPage) handlePageChange(productsResponse.pagination!.page - 1)}}
                      aria-disabled={!productsResponse.pagination.hasPrevPage}
                      className={!productsResponse.pagination.hasPrevPage ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  {[...Array(productsResponse.pagination.totalPages)].map((_, i) => {
                     const pageNum = i + 1;
                     if (productsResponse.pagination!.totalPages <= 5 || 
                         pageNum === 1 || pageNum === productsResponse.pagination!.totalPages ||
                         (pageNum >= productsResponse.pagination!.page -1 && pageNum <= productsResponse.pagination!.page + 1)
                        ) {
                          return (
                            <PaginationItem key={i}>
                              <PaginationLink 
                                href="#" 
                                onClick={(e) => { e.preventDefault(); handlePageChange(pageNum)}}
                                isActive={productsResponse.pagination!.page === pageNum}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                     } else if (pageNum === productsResponse.pagination!.page - 2 || pageNum === productsResponse.pagination!.page + 2) {
                        return <PaginationEllipsis key={`ellipsis-${i}`} />;
                     }
                     return null;
                  })}
                  <PaginationItem>
                    <PaginationNext 
                       href="#" 
                       onClick={(e) => { e.preventDefault(); if(productsResponse.pagination!.hasNextPage) handlePageChange(productsResponse.pagination!.page + 1)}}
                       aria-disabled={!productsResponse.pagination.hasNextPage}
                       className={!productsResponse.pagination.hasNextPage ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-2">No Products Found</h2>
            <p className="text-muted-foreground">Try adjusting your filters or check back later.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-1/4 lg:w-1/5">
          <div className="p-6 bg-card shadow-lg rounded-none space-y-6 h-full flex flex-col items-center justify-center min-h-[300px]">
            <LoadingSpinner />
            <p className="text-muted-foreground">Loading filters...</p>
          </div>
        </aside>
        <main className="w-full md:w-3/4 lg:w-4/5">
          <div className="flex justify-center items-center min-h-[60vh]">
            <LoadingSpinner size={64} />
          </div>
        </main>
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
