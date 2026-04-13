import { MarketplaceExtension } from "./marketplace_extension";

export interface MarketplaceCatalog {
    version: string;
    lastUpdated: string;
    extensions: MarketplaceExtension[];
    categories: { id: string; name: string; description: string }[];
}