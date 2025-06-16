import type { Product, Category, Order, User, PaginatedResponse, AvailableFilters, OrderItem, ShippingAddress } from './types';

export const mockCategories: Category[] = [
  { id: 'cat1', name: 'T-Shirts', imageUrl: 'https://placehold.co/300x200.png', description: 'Comfortable and stylish t-shirts' },
  { id: 'cat2', name: 'Jeans', imageUrl: 'https://placehold.co/300x200.png', description: 'Durable and fashionable jeans' },
  { id: 'cat3', name: 'Dresses', imageUrl: 'https://placehold.co/300x200.png', description: 'Elegant dresses for all occasions' },
  { id: 'cat4', name: 'Outerwear', imageUrl: 'https://placehold.co/300x200.png', description: 'Jackets and coats for all seasons' },
  { id: 'cat5', name: 'Shoes', imageUrl: 'https://placehold.co/300x200.png', description: 'Stylish footwear for every step' },
];

export const mockProducts: Product[] = [
  { id: 'prod1', name: 'Classic Crew Neck Tee', description: 'A timeless classic, perfect for everyday wear.', price: 25.99, categoryId: 'cat1', images: ['https://placehold.co/600x800.png', 'https://placehold.co/600x800.png'], inStock: true, categoryName: 'T-Shirts', colors: [{name: 'Red', code: '#FF0000'}, {name: 'Blue', code: '#0000FF'}], availableSizes: ['S', 'M', 'L'] },
  { id: 'prod2', name: 'Slim Fit Denim Jeans', description: 'Modern slim fit jeans with a comfortable stretch.', price: 59.99, categoryId: 'cat2', images: ['https://placehold.co/600x800.png'], inStock: true, categoryName: 'Jeans', availableSizes: ['30', '32', '34'] },
  { id: 'prod3', name: 'Floral Sundress', description: 'Light and airy sundress with a beautiful floral pattern.', price: 45.00, categoryId: 'cat3', images: ['https://placehold.co/600x800.png'], inStock: true, categoryName: 'Dresses' },
  { id: 'prod4', name: 'Vintage Leather Jacket', description: 'A stylish vintage leather jacket for a rugged look.', price: 120.50, categoryId: 'cat4', images: ['https://placehold.co/600x800.png'], inStock: false, categoryName: 'Outerwear' },
  { id: 'prod5', name: 'Running Sneakers', description: 'High-performance sneakers for your daily run.', price: 75.00, categoryId: 'cat5', images: ['https://placehold.co/600x800.png'], inStock: true, categoryName: 'Shoes' },
  { id: 'prod6', name: 'Graphic Print T-Shirt', description: 'Cool graphic print t-shirt for a bold statement.', price: 29.99, categoryId: 'cat1', images: ['https://placehold.co/600x800.png'], inStock: true, categoryName: 'T-Shirts' },
  { id: 'prod7', name: 'Distressed Boyfriend Jeans', description: 'Comfortable and trendy distressed boyfriend jeans.', price: 65.00, categoryId: 'cat2', images: ['https://placehold.co/600x800.png'], inStock: true, categoryName: 'Jeans' },
  { id: 'prod8', name: 'Evening Gown', description: 'Elegant evening gown for special occasions.', price: 150.00, categoryId: 'cat3', images: ['https://placehold.co/600x800.png'], inStock: true, categoryName: 'Dresses' },
  { id: 'prod9', name: 'Hooded Parka', description: 'Warm and waterproof hooded parka for cold weather.', price: 99.99, categoryId: 'cat4', images: ['https://placehold.co/600x800.png'], inStock: true, categoryName: 'Outerwear' },
  { id: 'prod10', name: 'Leather Ankle Boots', description: 'Chic leather ankle boots for a stylish look.', price: 89.50, categoryId: 'cat5', images: ['https://placehold.co/600x800.png'], inStock: true, categoryName: 'Shoes' },
];

export const mockUsers: User[] = [
  { id: 'user1', name: 'Alice Wonderland', email: 'alice@example.com', role: 'User', avatarUrl: 'https://placehold.co/100x100.png' },
];

let mockOrders: Order[] = [
  { 
    id: 'order1', 
    customerId: 'user1', 
    items: [
      { productId: 'prod1', productName: mockProducts.find(p=>p.id === 'prod1')?.name, productImage: mockProducts.find(p=>p.id === 'prod1')?.images[0], quantity: 1, price: 25.99 },
      { productId: 'prod2', productName: mockProducts.find(p=>p.id === 'prod2')?.name, productImage: mockProducts.find(p=>p.id === 'prod2')?.images[0], quantity: 1, price: 59.99 }
    ], 
    status: 'Delivered', 
    totalAmount: 85.98, 
    shippingAddress: { street: '123 Main St', city: 'Anytown', state: 'CA', country: 'USA', zipCode: '90210' },
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString() 
  },
  { 
    id: 'order2', 
    customerId: 'user1', 
    items: [
      { productId: 'prod3', productName: mockProducts.find(p=>p.id === 'prod3')?.name, productImage: mockProducts.find(p=>p.id === 'prod3')?.images[0], quantity: 2, price: 45.00 }
    ], 
    status: 'Shipped', 
    totalAmount: 90.00, 
    shippingAddress: { street: '456 Oak Ave', city: 'Otherville', state: 'NY', country: 'USA', zipCode: '10001' },
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
];

export const getMockProducts = async (
  page: number = 1,
  limit: number = 6,
  filters?: { categoryId?: string; minPrice?: number; maxPrice?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }
): Promise<PaginatedResponse<Product>> => {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

  let filteredProducts = [...mockProducts];

  if (filters?.categoryId) {
    filteredProducts = filteredProducts.filter(p => p.categoryId === filters.categoryId);
  }
  if (filters?.minPrice !== undefined) {
    filteredProducts = filteredProducts.filter(p => p.price >= filters.minPrice!);
  }
  if (filters?.maxPrice !== undefined) {
    filteredProducts = filteredProducts.filter(p => p.price <= filters.maxPrice!);
  }

  if (filters?.sortBy) {
    filteredProducts.sort((a, b) => {
      let valA = (a as any)[filters.sortBy!];
      let valB = (b as any)[filters.sortBy!];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return filters.sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }


  const total = filteredProducts.length;
  const totalPages = Math.ceil(total / limit);
  const paginatedProducts = filteredProducts.slice((page - 1) * limit, page * limit);

  return {
    type: "OK",
    data: { items: paginatedProducts, products: paginatedProducts },
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    filters: {
      applied: filters || {},
      available: { /* Populate with actual available filter options if needed */ },
    },
    sort: {
      by: filters?.sortBy || 'name',
      order: filters?.sortOrder || 'asc',
    },
  };
};

export const getMockProductById = async (id: string): Promise<Product | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockProducts.find(p => p.id === id);
};

export const getMockCategories = async (): Promise<Category[]> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return [...mockCategories];
};

export const getMockAvailableFilters = async (): Promise<AvailableFilters> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  const prices = mockProducts.map(p => p.price);
  return {
    categories: [...mockCategories],
    priceRange: {
      min: Math.min(...prices, 0),
      max: Math.max(...prices, 200), // Set a reasonable max if products are empty
    },
  };
};

export const getMockUserById = async (id: string): Promise<User | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockUsers.find(u => u.id === id);
}

export const getMockOrdersByUserId = async (userId: string): Promise<Order[]> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return mockOrders.filter(o => o.customerId === userId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export const createMockOrder = async (
  customerId: string, 
  items: OrderItem[], 
  shippingAddress: ShippingAddress,
  totalAmount: number
): Promise<Order> => {
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
  const newOrder: Order = {
    id: `order${mockOrders.length + 1}`,
    customerId,
    items: items.map(item => {
      const product = mockProducts.find(p => p.id === item.productId);
      return {
        ...item,
        productName: product?.name,
        productImage: product?.images[0],
      }
    }),
    status: 'Pending',
    totalAmount,
    shippingAddress,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockOrders.push(newOrder);
  return newOrder;
};
