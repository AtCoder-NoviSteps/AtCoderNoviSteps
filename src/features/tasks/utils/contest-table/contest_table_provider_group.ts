import { type ContestTablesMetaData } from '$features/tasks/types/contest-table/contest_table_provider';
import { ContestType } from '$lib/types/contest';

import { ContestTableProviderBase } from './contest_table_provider_base';

/**
 * A class that manages individual provider groups
 * Manages multiple ContestTableProviders as a single group,
 * enabling group-level operations.
 */
export class ContestTableProviderGroup {
  private groupName: string;
  private metadata: ContestTablesMetaData;
  private providers = new Map<string, ContestTableProviderBase>();

  constructor(groupName: string, metadata: ContestTablesMetaData) {
    this.groupName = groupName;
    this.metadata = metadata;
  }

  /**
   * Add a provider
   * Provider key is determined by the provider's getProviderKey() method
   *
   * @param provider Provider instance
   * @returns Returns this for method chaining
   */
  addProvider(provider: ContestTableProviderBase): this {
    const key = provider.getProviderKey();
    this.providers.set(key, provider);
    return this;
  }

  /**
   * Add multiple providers
   * Each provider's key is determined by its getProviderKey() method
   *
   * @param providers Array of provider instances
   * @returns Returns this for method chaining
   */
  addProviders(...providers: ContestTableProviderBase[]): this {
    providers.forEach((provider) => {
      const key = provider.getProviderKey();
      this.providers.set(key, provider);
    });
    return this;
  }

  /**
   * Get a provider for a specific contest type and optional section
   * Maintains backward compatibility by supporting section-less lookups
   *
   * @param contestType Contest type
   * @param section Optional section identifier
   * @returns Provider instance, or undefined
   */
  getProvider(contestType: ContestType, section?: string): ContestTableProviderBase | undefined {
    const key = ContestTableProviderBase.createProviderKey(contestType, section);
    return this.providers.get(key);
  }

  /**
   * Get all providers in the group
   * @returns Array of providers
   */
  getAllProviders(): ContestTableProviderBase[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get the group name
   * @returns Group name
   */
  getGroupName(): string {
    return this.groupName;
  }

  /**
   * Get the metadata for the group
   * @returns Metadata for the group
   */
  getMetadata(): ContestTablesMetaData {
    return this.metadata;
  }

  /**
   * Get the number of providers in the group
   * @returns Number of providers
   */
  getSize(): number {
    return this.providers.size;
  }

  /**
   * Get group statistics
   * @returns Group statistics
   */
  getStats() {
    return {
      groupName: this.groupName,
      providerCount: this.providers.size,
      providers: Array.from(this.providers.entries()).map(([key, provider]) => ({
        providerKey: key,
        metadata: provider.getMetadata(),
        displayConfig: provider.getDisplayConfig(),
      })),
    };
  }
}
