import { OncadeSDK } from '@oncade/sdk';
import { PurchaseItem } from '../types';

// This will be initialized with values from environment variables or provided by the user
let SDK_API_KEY = process.env.REACT_APP_ONCADE_API_KEY || '';
let SDK_GAME_ID = process.env.REACT_APP_ONCADE_GAME_ID || '';

class OncadeService {
  private static instance: OncadeService;
  private sdk: OncadeSDK | null = null;
  private initialized = false;
  private initializationError: string | null = null;
  private initializationPromise: Promise<boolean> | null = null;

  private constructor() {
    // Private constructor to prevent direct instantiation
  }

  public static getInstance(): OncadeService {
    if (!OncadeService.instance) {
      OncadeService.instance = new OncadeService();
    }
    return OncadeService.instance;
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public setCredentials(apiKey: string, gameId: string): void {
    SDK_API_KEY = apiKey;
    SDK_GAME_ID = gameId;
  }

  public async initialize(): Promise<boolean> {
    // If already initialized, return true immediately
    if (this.initialized && this.sdk) {
      console.log('Oncade SDK already initialized');
      return true;
    }

    // If initialization is in progress, return the existing promise
    if (this.initializationPromise) {
      console.log('Oncade SDK initialization already in progress');
      return this.initializationPromise;
    }

    // Create a new initialization promise
    this.initializationPromise = this.doInitialize();
    
    try {
      return await this.initializationPromise;
    } finally {
      // Clear the promise when done (success or failure)
      this.initializationPromise = null;
    }
  }

  private async doInitialize(): Promise<boolean> {
    try {
      if (!SDK_API_KEY || !SDK_GAME_ID) {
        this.initializationError = 'Oncade SDK credentials are not set. Call setCredentials first or set environment variables.';
        console.error(this.initializationError);
        return false;
      }

      this.sdk = new OncadeSDK({
        apiKey: SDK_API_KEY,
        gameId: SDK_GAME_ID,
        environment: 'development' //
      });

      // Attempt to initialize with a timeout
      const initPromise = this.sdk.initialize();
      
      // Create a timeout promise
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error('SDK initialization timed out after 10 seconds')), 10000);
      });
      
      // Race the initialization vs timeout
      await Promise.race([initPromise, timeoutPromise]);
      
      this.initialized = true;
      this.initializationError = null;
      console.log('Oncade SDK initialized successfully');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.initializationError = `Failed to initialize Oncade SDK: ${errorMessage}`;
      console.error(this.initializationError, error);
      return false;
    }
  }

  public async getStoreCatalog(): Promise<PurchaseItem[]> {
    if (!this.ensureInitialized()) return [];

    try {
      const catalog = await this.sdk!.getStoreCatalog();
      console.log('Store catalog retrieved:', catalog);
      return catalog;
    } catch (error) {
      console.error('Failed to retrieve store catalog:', error);
      return [];
    }
  }

  public async getStoreItem(itemId: string): Promise<PurchaseItem | null> {
    if (!this.ensureInitialized()) return null;

    try {
      const item = await this.sdk!.getStoreItem(itemId);
      return item;
    } catch (error) {
      console.error('Failed to retrieve store item:', error);
      return null;
    }
  }

  public async getPurchaseURL(itemId: string, redirectUrl: string): Promise<string | null> {
    if (!this.ensureInitialized()) return null;

    try {
      const purchaseUrl = await this.sdk!.getPurchaseURL({
        itemId,
        redirectUrl
      });
      
      return purchaseUrl;
    } catch (error) {
      console.error('Failed to generate purchase URL:', error);
      return null;
    }
  }

  public async getSessionInfo(): Promise<{ isValid: boolean; hasUserId: boolean }> {
    if (!this.ensureInitialized()) {
      return { isValid: false, hasUserId: false };
    }

    try {
      // Attempt to get session info with a timeout to prevent long-hanging requests
      const sessionPromise = this.sdk!.getSessionInfo();
      
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Session info request timed out after 5 seconds')), 5000);
      });
      
      // Race the actual request vs timeout
      const sessionInfo = await Promise.race([sessionPromise, timeoutPromise]);
      return sessionInfo;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to get session info: ${errorMessage}`, error);
      
      // Return default value instead of failing
      return { isValid: this.initialized, hasUserId: false };
    }
  }

  public async getPurchaseHistory(): Promise<any[]> {
    if (!this.ensureInitialized()) return [];

    try {
      const sessionInfo = await this.getSessionInfo();
      if (!sessionInfo.hasUserId) {
        console.log('User not authenticated, cannot retrieve purchase history');
        return [];
      }

      const transactions = await this.sdk!.getTransactionHistory();
      return transactions;
    } catch (error) {
      console.error('Failed to retrieve purchase history:', error);
      return [];
    }
  }

  public async getTransactionByHash(transactionHash: string): Promise<any | null> {
    if (!this.ensureInitialized()) return null;

    try {
      const transactions = await this.getPurchaseHistory();
      
      // Find the transaction with the matching hash
      const transaction = transactions.find(tx => tx.transactionHash === transactionHash);
      
      return transaction || null;
    } catch (error) {
      console.error('Failed to find transaction by hash:', error);
      return null;
    }
  }

  public async getLoginURL(redirectUrl: string): Promise<string | null> {
    if (!this.ensureInitialized()) return null;

    try {
      const sessionInfo = await this.sdk!.getSessionInfo();
      if (!sessionInfo.sessionToken) {
        console.error('No session token found, cannot generate login URL');
        return null;
      }
      const loginUrl = this.sdk!.getLoginURL({
        redirectUrl,
        gameId: SDK_GAME_ID,
        sessionToken: sessionInfo.sessionToken
      });
      
      return loginUrl;
    } catch (error) {
      console.error('Failed to generate login URL:', error);
      return null;
    }
  }

  public async getTipJarURL(redirectUrl: string): Promise<string | null> {
    if (!this.ensureInitialized()) return null;

    try {
      const tipJarUrl = await this.sdk!.getTipURL({
        redirectUrl,
        gameId: SDK_GAME_ID
      });
      
      return tipJarUrl;
    } catch (error) {
      console.error('Failed to generate tip jar URL:', error);
      return null;
    }
  }

  private ensureInitialized(): boolean {
    if (!this.initialized || !this.sdk) {
      console.error('Oncade SDK is not initialized. Call initialize() first.');
      if (this.initializationError) {
        console.error('Initialization error:', this.initializationError);
      }
      return false;
    }
    return true;
  }
}

export default OncadeService; 