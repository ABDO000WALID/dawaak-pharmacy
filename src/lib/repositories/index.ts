import { CatalogRepository } from './types';
import { MockCatalogRepository } from './MockCatalogRepository';
import { PostgresCatalogRepository } from './PostgresCatalogRepository';

export * from './types';
export * from './MockCatalogRepository';
export * from './PostgresCatalogRepository';

/**
 * Factory resolving the active catalog repository based on environment configuration.
 * Priority: DATA_SOURCE env variable (defaults to 'mock' if omitted or invalid).
 */
export function getCatalogRepository(): CatalogRepository {
  const dataSource = (
    process.env.DATA_SOURCE ||
    process.env.NEXT_PUBLIC_DATA_SOURCE ||
    'mock'
  ).trim().toLowerCase();

  if (dataSource === 'postgres' || dataSource === 'supabase') {
    return PostgresCatalogRepository.getInstance();
  }

  return MockCatalogRepository.getInstance();
}
