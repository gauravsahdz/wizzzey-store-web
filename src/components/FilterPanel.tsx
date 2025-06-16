
"use client";

import { useState, useEffect } from 'react';
import type { Category, AvailableFilters } from '@/lib/types';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, Filter as FilterIcon } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import LoadingSpinner from './LoadingSpinner';


interface FilterPanelProps {
  availableFilters: AvailableFilters | null;
  loadingFilters: boolean;
  onFilterChange: (filters: {
    priceRange?: [number, number];
    categoryIds?: string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => void;
  initialFilters: { // From URL
    priceRange?: [number, number];
    categoryIds?: string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

const FilterPanel: React.FC<FilterPanelProps> = ({ availableFilters, loadingFilters, onFilterChange, initialFilters }) => {
  // These are the default bounds for the slider track if not provided by API
  const absoluteMinPrice = 0;
  const absoluteMaxPrice = 5000; // Or a higher sensible default like 10000 or 50000

  // State for the slider's thumbs
  const [priceRange, setPriceRange] = useState<[number, number]>(() => {
    const initialMin = availableFilters?.priceRange?.min ?? absoluteMinPrice;
    const initialMax = availableFilters?.priceRange?.max ?? absoluteMaxPrice;
    return initialFilters.priceRange || [initialMin, initialMax];
  });
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialFilters.categoryIds || []);
  const [sortBy, setSortBy] = useState<string>(initialFilters.sortBy || 'name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialFilters.sortOrder || 'asc');

  useEffect(() => {
    // These are the actual min/max bounds for the slider track, determined by API or defaults.
    const trackMinBound = availableFilters?.priceRange?.min ?? absoluteMinPrice;
    const trackMaxBound = availableFilters?.priceRange?.max ?? absoluteMaxPrice;

    let targetThumbsMin = trackMinBound;
    let targetThumbsMax = trackMaxBound;

    if (initialFilters.priceRange) {
      // If URL provides a range, use it as the target for thumbs, but clamp to the track's bounds.
      targetThumbsMin = Math.max(trackMinBound, initialFilters.priceRange[0]);
      targetThumbsMax = Math.min(trackMaxBound, initialFilters.priceRange[1]);

      // If clamping resulted in min > max (e.g., URL range was completely outside track bounds),
      // then reset thumbs to the full track bounds.
      if (targetThumbsMin > targetThumbsMax) {
        targetThumbsMin = trackMinBound;
        targetThumbsMax = trackMaxBound;
      }
    }
    
    setPriceRange([targetThumbsMin, targetThumbsMax]);

    // Update other filter states based on initialFilters from URL
    setSelectedCategories(initialFilters.categoryIds || []);
    setSortBy(initialFilters.sortBy || 'name');
    setSortOrder(initialFilters.sortOrder || 'asc');

  }, [
    availableFilters?.priceRange?.min, 
    availableFilters?.priceRange?.max, 
    initialFilters.priceRange, // Direct dependency on the priceRange from URL
    initialFilters.categoryIds, // For completeness, though not directly affecting priceRange state here
    initialFilters.sortBy,
    initialFilters.sortOrder
  ]);


  const handleSliderValueChange = (value: [number, number]) => {
    setPriceRange(value);
  };
  
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
    );
  };
  
  const applyFilters = () => {
    const trackMinBound = availableFilters?.priceRange?.min ?? absoluteMinPrice;
    const trackMaxBound = availableFilters?.priceRange?.max ?? absoluteMaxPrice;
    
    // Only send priceRange to URL if it's different from the full track bounds
    const priceRangeToSend = (priceRange[0] === trackMinBound && priceRange[1] === trackMaxBound) 
        ? undefined 
        : priceRange;

    onFilterChange({
      priceRange: priceRangeToSend,
      categoryIds: selectedCategories.length > 0 ? selectedCategories : undefined,
      sortBy,
      sortOrder,
    });
  };

  const resetFilters = () => {
    const trackMinBound = availableFilters?.priceRange?.min ?? absoluteMinPrice;
    const trackMaxBound = availableFilters?.priceRange?.max ?? absoluteMaxPrice;
    setPriceRange([trackMinBound, trackMaxBound]);
    setSelectedCategories([]);
    setSortBy('name');
    setSortOrder('asc');
    onFilterChange({}); // This will trigger URL update to remove all filter params
  }

  if (loadingFilters || !availableFilters) {
    return (
      <div className="p-6 bg-card shadow-lg rounded-none space-y-6 h-full flex flex-col items-center justify-center min-h-[300px]">
        <LoadingSpinner />
        <p className="text-muted-foreground">Loading filters...</p>
      </div>
    );
  }

  // Determine the actual min/max for the Slider component track
  const sliderTrackMin = availableFilters.priceRange?.min ?? absoluteMinPrice;
  const sliderTrackMax = availableFilters.priceRange?.max ?? absoluteMaxPrice;

  return (
    <div className="p-6 bg-card shadow-lg rounded-none space-y-6 h-full">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold font-headline flex items-center"><FilterIcon size={20} className="mr-2" /> Filters</h3>
        <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs">
          <X size={14} className="mr-1"/> Reset
        </Button>
      </div>
      
      <Accordion type="multiple" defaultValue={['categories', 'price', 'sort']} className="w-full">
        {availableFilters.categories.length > 0 && (
            <AccordionItem value="categories">
            <AccordionTrigger className="text-lg font-medium">Categories</AccordionTrigger>
            <AccordionContent className="space-y-2 pt-2">
                {availableFilters.categories.map(category => (
                <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                    id={`cat-${category.id}`}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => handleCategoryChange(category.id)}
                    />
                    <Label htmlFor={`cat-${category.id}`} className="text-sm font-normal cursor-pointer hover:text-primary">
                    {category.name}
                    </Label>
                </div>
                ))}
            </AccordionContent>
            </AccordionItem>
        )}

        <AccordionItem value="price">
          <AccordionTrigger className="text-lg font-medium">Price Range</AccordionTrigger>
          <AccordionContent className="pt-4">
            <Slider
              min={sliderTrackMin}
              max={sliderTrackMax}
              step={10} // Or a more dynamic step if needed, e.g., (sliderTrackMax - sliderTrackMin) / 100
              value={priceRange} // Controlled component: value comes from priceRange state
              onValueChange={handleSliderValueChange} // Updates priceRange state
              className="mb-2"
              minStepsBetweenThumbs={1} // Ensures thumbs don't overlap if library supports
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>₹{priceRange[0]}</span>
              <span>₹{priceRange[1]}</span>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="sort">
          <AccordionTrigger className="text-lg font-medium">Sort By</AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            <div>
              <Label htmlFor="sort-by" className="text-sm mb-1 block">Field</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger id="sort-by">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="createdAt">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sort-order" className="text-sm mb-1 block">Order</Label>
              <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'asc' | 'desc')}>
                <SelectTrigger id="sort-order">
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button onClick={applyFilters} className="w-full mt-6">Apply Filters</Button>
    </div>
  );
};

export default FilterPanel;

