declare module '@oncade/sdk/dist/browser/oncade-sdk' {
  export interface SDKConfig {
    apiKey: string;
    gameId: string;
    environment?: string;
  }

  export interface PurchaseItem {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
    type: string;
  }

  export interface LoginURLOptions {
    gameId: string;
    sessionToken: string;
    redirectUrl?: string;
  }

  export interface PurchaseURLOptions {
    itemId: string;
    sessionToken: string;
    redirectUrl?: string;
    affiliateCode?: string;
  }

  export default class OncadeSDK {
    constructor(config: SDKConfig);
    initialize(): Promise<boolean>;
    getSessionInfo(): Promise<{
      isValid: boolean;
      hasUserId: boolean;
      sessionToken: string | null;
    }>;
    clearSession(): void;
    getStoreCatalog(): Promise<PurchaseItem[]>;
    getStoreItem(itemId: string): Promise<PurchaseItem | null>;
    getPurchaseURL(options: Omit<PurchaseURLOptions, 'sessionToken'> & { sessionToken?: string }): string | null;
    getPurchasedItems(): Promise<PurchaseItem[]>;
    getTransactionHistory(): Promise<any[]>;
    getLoginURL(options: LoginURLOptions): string;
  }
} 