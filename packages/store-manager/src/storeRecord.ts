/**
 * storeRecord.ts — Store record types and lifecycle states.
 *
 * A StoreRecord represents a provisioned (or provisioning) store in the
 * engine's registry. It tracks:
 * - Store identity (storeId, name, owner)
 * - Current lifecycle status (created, provisioning, active, error, etc.)
 * - Cloud deployment info (provider, region, URLs)
 * - Feature flags and configuration snapshot
 * - Provisioning history (status changes with timestamps)
 *
 * How it connects to the system:
 * - Created when the wizard's finish() produces configs
 * - Updated as the provisioning bridge executes deployment stages
 * - Queried by the engine admin dashboard to display store list/status
 * - The store manager (storeManager.ts) provides CRUD operations on these records
 *
 * Design decisions:
 * - Status follows a linear lifecycle: created → provisioning → active
 * - Error and suspended are branch states (can recover to provisioning/active)
 * - Each status change is logged in the history array for audit
 * - The record stores a snapshot of the wizard answers for re-provisioning
 * - Cloud URLs (site, admin, API) are populated during provisioning
 */

import type { WizardAnswers } from '@byb/config-generator';
import type { StoreProfile } from '@byb/core';

/**
 * Store lifecycle status.
 */
export type StoreStatus =
  | 'created'       // Record created, not yet provisioned
  | 'provisioning'  // Cloud resources being created
  | 'active'        // Fully deployed and operational
  | 'error'         // Provisioning or runtime error
  | 'suspended'     // Temporarily disabled (billing, maintenance)
  | 'deprovisioning' // Cloud resources being destroyed
  | 'deleted';      // Fully removed

/**
 * A status change event in the store's history.
 */
export interface StoreStatusEvent {
  /** The new status */
  status: StoreStatus;
  /** When the status changed */
  timestamp: string;
  /** Human-readable reason for the change */
  reason?: string;
  /** Error details (only for 'error' status) */
  errorDetail?: string;
}

/**
 * Cloud deployment URLs — populated during provisioning.
 */
export interface StoreUrls {
  /** Public storefront URL */
  siteUrl?: string;
  /** Admin dashboard URL */
  adminUrl?: string;
  /** Backend API URL */
  apiUrl?: string;
  /** CDN distribution URL */
  cdnUrl?: string;
}

/**
 * A complete store record in the engine's registry.
 */
export interface StoreRecord {
  /** Unique store identifier (matches storeId from wizard) */
  storeId: string;
  /** Human-readable store name */
  storeName: string;
  /** Owner identifier (user/account ID) */
  ownerId: string;
  /** Current lifecycle status */
  status: StoreStatus;
  /** Cloud provider (aws, azure, gcp) */
  cloudProvider: string;
  /** Deployment region */
  region: string;
  /** Custom domain (optional) */
  customDomain?: string;
  /** Deployed URLs */
  urls: StoreUrls;
  /** The store profile used for adapter resolution */
  profile: StoreProfile;
  /** Snapshot of the original wizard answers (for re-provisioning) */
  wizardAnswers: WizardAnswers;
  /** Status change history (ordered, newest last) */
  history: StoreStatusEvent[];
  /** Preset ID used (if selected from gallery) */
  presetId?: string;
  /** Record creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
}

/**
 * Input for creating a new store record.
 * The manager fills in the remaining fields (timestamps, history, etc.).
 */
export interface CreateStoreInput {
  storeId: string;
  storeName: string;
  ownerId: string;
  cloudProvider: string;
  region: string;
  customDomain?: string;
  profile: StoreProfile;
  wizardAnswers: WizardAnswers;
  presetId?: string;
}
