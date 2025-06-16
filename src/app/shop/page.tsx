
"use client";

import { useEffect, useState, useCallback }  from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type { Product, PaginatedResponse, Category, AvailableFilters as AppAvailableFilters, AppliedFilters } from '@/lib/types';
import { fetchProducts, fetchCategories } from '@/services/api'; 
import ProductCard from '@/components/ProductCard';
import FilterPanel from '@/components/FilterPanel';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List } from 'lucide-react';
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


// AppliedFiltersState is what the FilterPanel outputs and what is stored in the URL
type AppliedFiltersStateFromPanel = {
  priceRange?: [number, number];
  categoryIds?: string[]; // FilterPanel can select multiple categories
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

// AppliedFiltersForApi is what's passed to the fetchProducts service
// and reflects the API's capability (e.g. single categoryId)
type AppliedFiltersForApi = {
  page?: number;
  categoryId?: string; // API expects single categoryId
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};


export default function ShopPage() {
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


  const parseFiltersFromUrl = useCallback((): AppliedFiltersStateFromPanel => {
    const sortBy = searchParams.get('sortBy') || undefined;
    const sortOrder = (searchParams.get('sortOrder') || undefined) as 'asc' | 'desc' | undefined;
    const categoryIdsFromUrl = searchParams.getAll('category'); // Can be multiple from URL
    const minPriceStr = searchParams.get('minPrice');
    const maxPriceStr = searchParams.get('maxPrice');
    
    let priceRangeVal: [number, number] | undefined = undefined;
    if (minPriceStr && maxPriceStr) {
        priceRangeVal = [parseFloat(minPriceStr), parseFloat(maxPriceStr)];
    }
    
    return {
      sortBy,
      sortOrder,
      categoryIds: categoryIdsFromUrl.length > 0 ? categoryIdsFromUrl : undefined,
      priceRange: priceRangeVal,
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
      };
      const response = await fetchProducts(serviceParams);
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
  
  const constructedAvailableFilters: AppAvailableFilters | null = loadingCategories 
    ? null 
    : {
        categories: categories,
        priceRange: apiPriceRange || { min: 0, max: 5000 } // Use API provided range or default
      };

  const isLoading = loadingProducts || loadingCategories;
  const currentCategoryName = currentFiltersForPanel.categoryIds?.[0] && categories.find(c => c.id === currentFiltersForPanel.categoryIds![0])?.name;


  return (
    <div className="flex flex-col md:flex-row gap-8">
      <aside className="w-full md:w-1/4 lg:w-1/5">
        <FilterPanel 
          availableFilters={constructedAvailableFilters} 
          loadingFilters={loadingCategories} 
          onFilterChange={handleFilterChange}
          initialFilters={currentFiltersForPanel} 
        />
      </aside>
      <main className="w-full md:w-3/4 lg:w-4/5">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold font-headline">
            {currentCategoryName || 'All Products'}
          </h1>
          <div className="flex items-center gap-2">
             <span className="text-sm text-muted-foreground">
                {productsResponse?.pagination && productsResponse.pagination.total > 0 ? 
                  `Showing ${((productsResponse.pagination.page - 1) * productsResponse.pagination.limit) + 1}-${Math.min(productsResponse.pagination.page * productsResponse.pagination.limit, productsResponse.pagination.total)} of ${productsResponse.pagination.total} products` 
                  : productsResponse?.pagination?.total === 0 ? '0 products found' : ''
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
            {productsResponse.pagination && productsResponse.pagination.totalPages > 1 && (
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
