/**
 * dbAdapter.ts — Interface for database operations.
 *
 * All database interactions in BYB go through this interface.
 * Cloud adapters implement it for their specific database:
 * - AWS: DynamoDB (single-table design with PK/SK)
 * - Azure: Cosmos DB
 * - GCP: Firestore
 *
 * The interface uses a generic key-value model with optional secondary keys,
 * which maps well to both NoSQL (DynamoDB, Cosmos) and document stores (Firestore).
 */

/** Parameters for a single-item get operation */
export interface DbGetParams {
  /** Primary key value (e.g., 'PRODUCT#123') */
  pk: string;
  /** Sort key value (e.g., 'META') */
  sk: string;
}

/** Parameters for a single-item put (upsert) operation */
export interface DbPutParams {
  /** The item to store. Must include pk and sk fields. */
  item: Record<string, unknown>;
}

/** Parameters for deleting a single item */
export interface DbDeleteParams {
  pk: string;
  sk: string;
}

/** Parameters for querying items by partition key */
export interface DbQueryParams {
  /** Partition key to query on */
  pk: string;
  /** Optional sort key prefix to filter by (begins_with) */
  skPrefix?: string;
  /** Optional index name (for GSI queries) */
  indexName?: string;
  /** Maximum number of items to return */
  limit?: number;
  /** Pagination token from a previous query */
  nextToken?: string;
}

/** Result of a query operation */
export interface DbQueryResult {
  items: Record<string, unknown>[];
  /** Pagination token for the next page, undefined if no more pages */
  nextToken?: string;
}

/** Parameters for a transactional write (multiple puts/deletes atomically) */
export interface DbTransactionItem {
  type: 'put' | 'delete';
  params: DbPutParams | DbDeleteParams;
}

/**
 * Database adapter interface.
 *
 * Required methods contract: ['get', 'put', 'delete', 'query', 'transactWrite']
 * These are validated by the adapter registry on resolution.
 */
export interface DbAdapter {
  /** Get a single item by primary key + sort key. Returns null if not found. */
  get(params: DbGetParams): Promise<Record<string, unknown> | null>;

  /** Put (upsert) a single item. */
  put(params: DbPutParams): Promise<void>;

  /** Delete a single item by primary key + sort key. */
  delete(params: DbDeleteParams): Promise<void>;

  /** Query items by partition key, with optional sort key prefix filter. */
  query(params: DbQueryParams): Promise<DbQueryResult>;

  /** Execute multiple put/delete operations atomically. */
  transactWrite(items: DbTransactionItem[]): Promise<void>;
}

/** Required methods that the adapter registry validates against */
export const DB_ADAPTER_REQUIRED_METHODS = [
  'get',
  'put',
  'delete',
  'query',
  'transactWrite',
] as const;
