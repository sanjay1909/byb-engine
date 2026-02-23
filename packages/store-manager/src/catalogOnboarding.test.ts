/**
 * Tests for catalogOnboarding.ts
 *
 * Covers:
 * - CSV parsing: valid CSV, quoted fields, missing headers, invalid prices
 * - Price conversion to cents
 * - Optional fields (description, category, sku, imageUrl)
 * - Error reporting for bad rows
 * - Sample catalogs: all industries present, 5 products each
 * - Sample catalog returns copies (not internal references)
 */
import { describe, it, expect } from 'vitest';
import {
  parseCsvCatalog,
  getSampleCatalog,
  getSampleCatalogIndustries,
} from './catalogOnboarding.js';

describe('parseCsvCatalog', () => {
  it('parses simple CSV with name and price', () => {
    const csv = 'name,price\nT-Shirt,19.99\nJeans,49.99';
    const result = parseCsvCatalog(csv);

    expect(result.products).toHaveLength(2);
    expect(result.products[0].name).toBe('T-Shirt');
    expect(result.products[0].price).toBe(1999); // cents
    expect(result.products[1].name).toBe('Jeans');
    expect(result.products[1].price).toBe(4999);
    expect(result.errors).toHaveLength(0);
  });

  it('parses CSV with all optional fields', () => {
    const csv =
      'name,price,description,category,sku,imageUrl\n' +
      'Dress,29.99,Cotton dress,Dresses,DRS-001,/img/dress.jpg';
    const result = parseCsvCatalog(csv);

    expect(result.products).toHaveLength(1);
    const product = result.products[0];
    expect(product.name).toBe('Dress');
    expect(product.price).toBe(2999);
    expect(product.description).toBe('Cotton dress');
    expect(product.category).toBe('Dresses');
    expect(product.sku).toBe('DRS-001');
    expect(product.imageUrl).toBe('/img/dress.jpg');
  });

  it('handles quoted fields with commas', () => {
    const csv =
      'name,price,description\n' +
      '"T-Shirt, Crew Neck",24.99,"Soft, breathable cotton"';
    const result = parseCsvCatalog(csv);

    expect(result.products).toHaveLength(1);
    expect(result.products[0].name).toBe('T-Shirt, Crew Neck');
    expect(result.products[0].description).toBe('Soft, breathable cotton');
  });

  it('handles escaped quotes in fields', () => {
    const csv = 'name,price\n"8"" Display",99.99';
    const result = parseCsvCatalog(csv);

    expect(result.products).toHaveLength(1);
    expect(result.products[0].name).toBe('8" Display');
  });

  it('converts price to cents (integer)', () => {
    const csv = 'name,price\nItem,10.50';
    const result = parseCsvCatalog(csv);
    expect(result.products[0].price).toBe(1050);
  });

  it('handles whole number prices', () => {
    const csv = 'name,price\nItem,25';
    const result = parseCsvCatalog(csv);
    expect(result.products[0].price).toBe(2500);
  });

  it('reports missing name column', () => {
    const csv = 'title,price\nThing,10';
    const result = parseCsvCatalog(csv);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('name');
  });

  it('reports missing price column', () => {
    const csv = 'name,cost\nThing,10';
    const result = parseCsvCatalog(csv);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('price');
  });

  it('reports rows with missing name', () => {
    const csv = 'name,price\n,29.99\nDress,39.99';
    const result = parseCsvCatalog(csv);

    expect(result.products).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].row).toBe(1);
    expect(result.errors[0].message).toContain('name');
  });

  it('reports rows with invalid price', () => {
    const csv = 'name,price\nDress,abc\nShirt,19.99';
    const result = parseCsvCatalog(csv);

    expect(result.products).toHaveLength(1);
    expect(result.products[0].name).toBe('Shirt');
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('price');
  });

  it('reports rows with negative price', () => {
    const csv = 'name,price\nDress,-10';
    const result = parseCsvCatalog(csv);

    expect(result.products).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
  });

  it('skips empty lines', () => {
    const csv = 'name,price\nA,10\n\nB,20\n';
    const result = parseCsvCatalog(csv);
    expect(result.products).toHaveLength(2);
  });

  it('returns empty for empty CSV', () => {
    const result = parseCsvCatalog('');
    expect(result.products).toHaveLength(0);
    expect(result.totalRows).toBe(0);
  });

  it('returns empty for header-only CSV', () => {
    const result = parseCsvCatalog('name,price');
    expect(result.products).toHaveLength(0);
    expect(result.totalRows).toBe(0);
  });

  it('reports totalRows correctly', () => {
    const csv = 'name,price\nA,10\nB,20\nC,30';
    const result = parseCsvCatalog(csv);
    expect(result.totalRows).toBe(3);
  });

  it('handles case-insensitive headers', () => {
    const csv = 'Name,Price,Description\nThing,5.99,Nice thing';
    const result = parseCsvCatalog(csv);
    expect(result.products).toHaveLength(1);
    expect(result.products[0].description).toBe('Nice thing');
  });

  it('handles imageUrl header (camelCase)', () => {
    const csv = 'name,price,imageUrl\nItem,10,/img/item.jpg';
    const result = parseCsvCatalog(csv);
    expect(result.products[0].imageUrl).toBe('/img/item.jpg');
  });
});

describe('getSampleCatalog', () => {
  it('returns 5 products for fashion', () => {
    const catalog = getSampleCatalog('fashion');
    expect(catalog).toHaveLength(5);
    expect(catalog[0].name).toBeTruthy();
    expect(catalog[0].price).toBeGreaterThan(0);
  });

  it('returns 5 products for kids', () => {
    const catalog = getSampleCatalog('kids');
    expect(catalog).toHaveLength(5);
  });

  it('returns 5 products for food', () => {
    const catalog = getSampleCatalog('food');
    expect(catalog).toHaveLength(5);
  });

  it('returns 5 products for electronics', () => {
    const catalog = getSampleCatalog('electronics');
    expect(catalog).toHaveLength(5);
  });

  it('returns 5 products for beauty', () => {
    const catalog = getSampleCatalog('beauty');
    expect(catalog).toHaveLength(5);
  });

  it('returns 5 products for home', () => {
    const catalog = getSampleCatalog('home');
    expect(catalog).toHaveLength(5);
  });

  it('returns general catalog for unknown industry', () => {
    const catalog = getSampleCatalog('unknown' as any);
    expect(catalog).toHaveLength(5);
    expect(catalog[0].name).toContain('Sample');
  });

  it('products have SKUs', () => {
    const catalog = getSampleCatalog('fashion');
    for (const product of catalog) {
      expect(product.sku).toBeTruthy();
    }
  });

  it('some products have variants', () => {
    const catalog = getSampleCatalog('fashion');
    const withVariants = catalog.filter((p) => p.variants && p.variants.length > 0);
    expect(withVariants.length).toBeGreaterThanOrEqual(1);
  });

  it('returns copies (not internal references)', () => {
    const a = getSampleCatalog('fashion');
    const b = getSampleCatalog('fashion');
    expect(a).not.toBe(b);
    expect(a[0]).not.toBe(b[0]);
  });
});

describe('getSampleCatalogIndustries', () => {
  it('returns all 7 industries', () => {
    const industries = getSampleCatalogIndustries();
    expect(industries).toHaveLength(7);
    expect(industries).toContain('fashion');
    expect(industries).toContain('kids');
    expect(industries).toContain('food');
    expect(industries).toContain('electronics');
    expect(industries).toContain('beauty');
    expect(industries).toContain('home');
    expect(industries).toContain('general');
  });
});
