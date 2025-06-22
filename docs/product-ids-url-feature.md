# Product IDs URL Feature

This feature allows you to fetch and display specific products by their IDs using URL parameters.

## Usage

### URL Format
Both homepage and shop page URLs support the `products_ids` parameter:

```
/?products_ids=["id1","id2","id3"]
/shop?products_ids=["id1","id2","id3"]
```

### Examples
```
http://localhost:9002/?products_ids=["68542f3a46dad8cf7896f3dd","68542f3a46dad8cf7896f3ee"]
http://localhost:9002/shop?products_ids=["68542f3a46dad8cf7896f3dd","68542f3a46dad8cf7896f3ee"]
```

## How it Works

1. **URL Parameter**: The `products_ids` parameter accepts a JSON string array of product IDs
2. **Routing**: If accessed from the homepage (`/`), it automatically redirects to the shop page (`/shop`) with the same parameter
3. **API Call**: The frontend parses the URL parameter and calls the `/api/products` endpoint with the `product_ids` parameter
4. **Display**: The shop page displays only the specified products with a "Selected Products" title
5. **UI Changes**: When viewing specific products:
   - Filter panel is hidden (since filtering doesn't make sense for a fixed set)
   - Pagination is hidden (since we're showing a specific set)
   - Page title shows "Selected Products"
   - Product count shows "X selected products"

## API Endpoint

The feature uses the existing `/api/products` endpoint with a new parameter:

- **Method**: GET
- **Parameter**: `product_ids` (JSON string array)
- **Example**: `/api/products?product_ids=["68542f3a46dad8cf7896f3dd","68542f3a46dad8cf7896f3ee"]`

## Response Format

The API returns the same response format as regular product listing, but with only the requested products:

```json
{
  "type": "OK",
  "message": "Products retrieved successfully",
  "data": {
    "products": [
      {
        "_id": "68542f3a46dad8cf7896f3dd",
        "name": "Silk Saree",
        "description": "This is silk saree",
        "price": 2500,
        // ... other product fields
      }
    ],
    "requestedIds": ["68542f3a46dad8cf7896f3dd"],
    "foundIds": ["68542f3a46dad8cf7896f3dd"],
    "missingIds": []
  }
}
```

## Error Handling

- If the `products_ids` parameter is malformed JSON, it will be ignored and the page will show all products
- If some product IDs are not found, they will be listed in the `missingIds` array in the response
- The page gracefully handles cases where no products are found

## Implementation Details

### Frontend Changes
- Updated `FetchProductsParams` interface to include `product_ids` field
- Modified `fetchProducts` function to handle the new parameter
- Updated shop page to parse URL parameters and detect when viewing specific products
- Added conditional UI rendering for specific product views

### Backend Requirements
The backend API should support the `product_ids` parameter and return products matching the provided IDs. 