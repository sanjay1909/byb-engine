/**
 * catalogOnboarding.ts — Product catalog import and sample seeding.
 *
 * Provides tools for populating a new store's product catalog:
 * 1. CSV import — parse a CSV file into product records
 * 2. Sample catalogs — pre-built product sets by industry
 *
 * How it connects to the system:
 * - Called after store provisioning to seed initial products
 * - The CSV parser produces Product[] that can be written via DbAdapter
 * - Sample catalogs are in-memory data (no API calls needed)
 * - The wizard or admin dashboard triggers import/seeding
 *
 * Design decisions:
 * - CSV parsing is simple: split by comma, first row is headers
 * - Required fields: name, price. Optional: description, category, sku, imageUrl
 * - Prices in CSV are expected as numbers (e.g., 29.99)
 * - Sample catalogs are small (5-10 products) — enough to see the store in action
 * - Products have a consistent shape matching the engine's product model
 */

/**
 * A product record — matches the engine's product model shape.
 */
export interface Product {
  /** Product name */
  name: string;
  /** Price in smallest currency unit (e.g., cents) */
  price: number;
  /** Product description */
  description?: string;
  /** Category/collection name */
  category?: string;
  /** SKU (stock keeping unit) */
  sku?: string;
  /** Product image URL */
  imageUrl?: string;
  /** Product variants (e.g., sizes, colors) */
  variants?: ProductVariant[];
}

/**
 * A product variant (size, color, etc.).
 */
export interface ProductVariant {
  /** Variant label (e.g., 'Small', 'Red') */
  label: string;
  /** Variant type (e.g., 'size', 'color') */
  type: string;
  /** Price adjustment (added to base price, can be 0) */
  priceAdjustment?: number;
  /** SKU suffix for this variant */
  sku?: string;
}

/**
 * Result of parsing a CSV file.
 */
export interface CsvParseResult {
  /** Successfully parsed products */
  products: Product[];
  /** Rows that failed to parse */
  errors: Array<{
    row: number;
    message: string;
    rawLine: string;
  }>;
  /** Total rows processed (including errors) */
  totalRows: number;
}

/**
 * Parses a CSV string into product records.
 *
 * Expected CSV format (first row is headers):
 * ```
 * name,price,description,category,sku,imageUrl
 * "Summer Dress",29.99,"Light cotton dress","Dresses","SD-001","/images/sd.jpg"
 * ```
 *
 * @param csvContent - Raw CSV string content
 * @returns Parse result with products and any errors
 *
 * @example
 * const csv = 'name,price,description\nT-Shirt,19.99,Cotton tee';
 * const result = parseCsvCatalog(csv);
 * // result.products = [{ name: 'T-Shirt', price: 1999, description: 'Cotton tee' }]
 */
export function parseCsvCatalog(csvContent: string): CsvParseResult {
  const lines = csvContent.trim().split('\n');
  const products: Product[] = [];
  const errors: CsvParseResult['errors'] = [];

  if (lines.length < 2) {
    return { products: [], errors: [], totalRows: 0 };
  }

  // Parse header row
  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());

  const nameIdx = headers.indexOf('name');
  const priceIdx = headers.indexOf('price');

  if (nameIdx === -1) {
    return {
      products: [],
      errors: [
        {
          row: 0,
          message: "CSV must have a 'name' column",
          rawLine: lines[0],
        },
      ],
      totalRows: 0,
    };
  }
  if (priceIdx === -1) {
    return {
      products: [],
      errors: [
        {
          row: 0,
          message: "CSV must have a 'price' column",
          rawLine: lines[0],
        },
      ],
      totalRows: 0,
    };
  }

  const descIdx = headers.indexOf('description');
  const catIdx = headers.indexOf('category');
  const skuIdx = headers.indexOf('sku');
  const imgIdx = headers.indexOf('imageurl');

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') continue;

    try {
      const fields = parseCsvLine(line);
      const name = fields[nameIdx]?.trim();
      const priceStr = fields[priceIdx]?.trim();

      if (!name) {
        errors.push({
          row: i,
          message: 'Missing product name',
          rawLine: line,
        });
        continue;
      }

      const priceNum = parseFloat(priceStr);
      if (isNaN(priceNum) || priceNum < 0) {
        errors.push({
          row: i,
          message: `Invalid price: '${priceStr}'`,
          rawLine: line,
        });
        continue;
      }

      // Convert price to cents (smallest currency unit)
      const product: Product = {
        name,
        price: Math.round(priceNum * 100),
      };

      if (descIdx !== -1 && fields[descIdx]?.trim()) {
        product.description = fields[descIdx].trim();
      }
      if (catIdx !== -1 && fields[catIdx]?.trim()) {
        product.category = fields[catIdx].trim();
      }
      if (skuIdx !== -1 && fields[skuIdx]?.trim()) {
        product.sku = fields[skuIdx].trim();
      }
      if (imgIdx !== -1 && fields[imgIdx]?.trim()) {
        product.imageUrl = fields[imgIdx].trim();
      }

      products.push(product);
    } catch {
      errors.push({
        row: i,
        message: 'Failed to parse CSV row',
        rawLine: line,
      });
    }
  }

  return {
    products,
    errors,
    totalRows: lines.length - 1, // Exclude header
  };
}

/**
 * Parses a single CSV line, handling quoted fields with commas.
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Handle escaped quotes ("")
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);

  return fields;
}

// ─── Sample Catalogs ─────────────────────────────────────────────────────────

/**
 * Pre-built sample product catalogs by industry.
 * These seed a new store with realistic-looking products.
 */
export type SampleCatalogIndustry =
  | 'fashion'
  | 'food'
  | 'electronics'
  | 'beauty'
  | 'kids'
  | 'home'
  | 'general';

const SAMPLE_CATALOGS: Record<SampleCatalogIndustry, Product[]> = {
  fashion: [
    {
      name: 'Classic Cotton T-Shirt',
      price: 2499,
      description: 'Soft 100% cotton crew neck tee',
      category: 'Tops',
      sku: 'TSHIRT-001',
      variants: [
        { label: 'S', type: 'size' },
        { label: 'M', type: 'size' },
        { label: 'L', type: 'size' },
        { label: 'XL', type: 'size' },
      ],
    },
    {
      name: 'Slim Fit Jeans',
      price: 5999,
      description: 'Dark wash stretch denim',
      category: 'Bottoms',
      sku: 'JEANS-001',
      variants: [
        { label: '28', type: 'size' },
        { label: '30', type: 'size' },
        { label: '32', type: 'size' },
        { label: '34', type: 'size' },
      ],
    },
    {
      name: 'Wool Blend Sweater',
      price: 7999,
      description: 'Cozy ribbed knit pullover',
      category: 'Knitwear',
      sku: 'SWTR-001',
    },
    {
      name: 'Canvas Sneakers',
      price: 4499,
      description: 'Lightweight everyday sneakers',
      category: 'Shoes',
      sku: 'SNKR-001',
    },
    {
      name: 'Leather Crossbody Bag',
      price: 8999,
      description: 'Genuine leather with adjustable strap',
      category: 'Accessories',
      sku: 'BAG-001',
    },
  ],

  kids: [
    {
      name: 'Floral Print Dress',
      price: 3499,
      description: 'Adorable cotton dress with floral pattern',
      category: 'Dresses',
      sku: 'KDRESS-001',
      variants: [
        { label: '2T', type: 'size' },
        { label: '3T', type: 'size' },
        { label: '4T', type: 'size' },
        { label: '5T', type: 'size' },
      ],
    },
    {
      name: 'Organic Cotton Onesie',
      price: 1999,
      description: 'Super soft organic cotton bodysuit',
      category: 'Baby',
      sku: 'ONESIE-001',
    },
    {
      name: 'Rainbow Tutu Skirt',
      price: 2499,
      description: 'Layered tulle skirt in rainbow colors',
      category: 'Skirts',
      sku: 'TUTU-001',
    },
    {
      name: 'Denim Overalls',
      price: 3999,
      description: 'Adjustable shoulder straps, front pocket',
      category: 'Overalls',
      sku: 'OVER-001',
    },
    {
      name: 'Knit Cardigan',
      price: 2999,
      description: 'Soft button-up cardigan with heart pattern',
      category: 'Tops',
      sku: 'CARD-001',
    },
  ],

  food: [
    {
      name: 'Artisan Sourdough Loaf',
      price: 899,
      description: 'Traditional slow-fermented sourdough bread',
      category: 'Bread',
      sku: 'BREAD-001',
    },
    {
      name: 'Organic Honey Jar',
      price: 1499,
      description: 'Raw wildflower honey, 12oz',
      category: 'Pantry',
      sku: 'HONEY-001',
    },
    {
      name: 'Handmade Pasta Bundle',
      price: 2499,
      description: 'Fresh fettuccine, pappardelle, and tagliatelle',
      category: 'Pasta',
      sku: 'PASTA-001',
    },
    {
      name: 'Assorted Cookie Box',
      price: 1999,
      description: 'Dozen mixed cookies — chocolate chip, oatmeal, snickerdoodle',
      category: 'Baked Goods',
      sku: 'COOKIE-001',
    },
    {
      name: 'Cold Press Olive Oil',
      price: 1899,
      description: 'Extra virgin, single-origin, 500ml',
      category: 'Pantry',
      sku: 'OIL-001',
    },
  ],

  electronics: [
    {
      name: 'Wireless Bluetooth Earbuds',
      price: 4999,
      description: 'Active noise cancelling, 8hr battery',
      category: 'Audio',
      sku: 'EARB-001',
    },
    {
      name: 'USB-C Hub Adapter',
      price: 3499,
      description: '7-in-1: HDMI, USB-A, SD card, Ethernet',
      category: 'Accessories',
      sku: 'HUB-001',
    },
    {
      name: 'Mechanical Keyboard',
      price: 7999,
      description: 'Hot-swappable switches, RGB backlight',
      category: 'Peripherals',
      sku: 'KB-001',
    },
    {
      name: 'Portable Charger 10000mAh',
      price: 2999,
      description: 'Slim power bank with dual USB output',
      category: 'Power',
      sku: 'PWR-001',
    },
    {
      name: 'Webcam HD 1080p',
      price: 5999,
      description: 'Auto-focus, built-in microphone, privacy cover',
      category: 'Video',
      sku: 'CAM-001',
    },
  ],

  beauty: [
    {
      name: 'Vitamin C Serum',
      price: 3499,
      description: '20% Vitamin C with hyaluronic acid, 1oz',
      category: 'Skincare',
      sku: 'SERUM-001',
    },
    {
      name: 'Hydrating Face Cream',
      price: 2899,
      description: 'Daily moisturizer with ceramides',
      category: 'Skincare',
      sku: 'CREAM-001',
    },
    {
      name: 'Matte Lipstick Set',
      price: 1999,
      description: '4 nude shades, long-lasting formula',
      category: 'Makeup',
      sku: 'LIP-001',
    },
    {
      name: 'Hair Repair Mask',
      price: 2499,
      description: 'Deep conditioning treatment with argan oil',
      category: 'Haircare',
      sku: 'HAIR-001',
    },
    {
      name: 'Natural Deodorant',
      price: 1299,
      description: 'Aluminum-free, lavender scent',
      category: 'Body',
      sku: 'DEO-001',
    },
  ],

  home: [
    {
      name: 'Linen Throw Pillow',
      price: 3999,
      description: 'Hand-woven linen cover, 18x18"',
      category: 'Decor',
      sku: 'PLW-001',
    },
    {
      name: 'Ceramic Planter Set',
      price: 4499,
      description: 'Set of 3 minimalist planters',
      category: 'Garden',
      sku: 'PLNT-001',
    },
    {
      name: 'Scented Candle',
      price: 2499,
      description: 'Soy wax, cedarwood and vanilla, 8oz',
      category: 'Fragrance',
      sku: 'CNDL-001',
    },
    {
      name: 'Woven Storage Basket',
      price: 3499,
      description: 'Handcrafted seagrass basket, large',
      category: 'Storage',
      sku: 'BSKT-001',
    },
    {
      name: 'Cotton Table Runner',
      price: 2999,
      description: 'Natural cotton with tassel fringe',
      category: 'Table',
      sku: 'TBLR-001',
    },
  ],

  general: [
    {
      name: 'Sample Product 1',
      price: 1999,
      description: 'A great product for your store',
      category: 'Featured',
      sku: 'SAMPLE-001',
    },
    {
      name: 'Sample Product 2',
      price: 2999,
      description: 'Another excellent product',
      category: 'Featured',
      sku: 'SAMPLE-002',
    },
    {
      name: 'Sample Product 3',
      price: 3999,
      description: 'Premium quality item',
      category: 'Premium',
      sku: 'SAMPLE-003',
    },
    {
      name: 'Sample Product 4',
      price: 4999,
      description: 'Best-selling product',
      category: 'Premium',
      sku: 'SAMPLE-004',
    },
    {
      name: 'Sample Product 5',
      price: 999,
      description: 'Budget-friendly option',
      category: 'Essentials',
      sku: 'SAMPLE-005',
    },
  ],
};

/**
 * Returns a sample product catalog for the given industry.
 *
 * @param industry - The industry to get samples for
 * @returns An array of sample products (copies, safe to modify)
 */
export function getSampleCatalog(industry: SampleCatalogIndustry): Product[] {
  const catalog = SAMPLE_CATALOGS[industry];
  if (!catalog) {
    return [...SAMPLE_CATALOGS.general];
  }
  // Return deep copies so the caller can modify without affecting the originals
  return catalog.map((p) => ({
    ...p,
    variants: p.variants?.map((v) => ({ ...v })),
  }));
}

/**
 * Returns all available sample catalog industries.
 */
export function getSampleCatalogIndustries(): SampleCatalogIndustry[] {
  return Object.keys(SAMPLE_CATALOGS) as SampleCatalogIndustry[];
}
