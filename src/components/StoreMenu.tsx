import React, { useState, useEffect } from 'react';
import { StoreItem, PurchaseItem } from '../types';
import OncadeService from '../services/OncadeService';

interface StoreMenuProps {
  onBack: () => void;
}

const StoreMenu: React.FC<StoreMenuProps> = ({ onBack }) => {
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [sessionStatus, setSessionStatus] = useState<string>('checking');

  // Check authentication and fetch store items
  useEffect(() => {
    const fetchItemsAndCheckAuth = async () => {
      try {
        setLoading(true);
        
        // Get Oncade service instance
        const oncadeService = OncadeService.getInstance();
        
        // Check session info
        const sessionInfo = await oncadeService.getSessionInfo();
        setIsAuthenticated(sessionInfo.hasUserId);
        setSessionStatus(sessionInfo.isValid ? 'authenticated' : 'unauthenticated');
        
        // Fetch store catalog
        const catalog = await oncadeService.getStoreCatalog();
        
        if (catalog && catalog.length > 0) {
          setItems(catalog);
          setLoading(false);
        } else {
          setError('No items found in the store.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching store data:', err);
        setError('Failed to load store items. Please try again later.');
        setLoading(false);
      }
    };

    fetchItemsAndCheckAuth();
  }, []);

  const handlePurchase = async (item: PurchaseItem): Promise<void> => {
    try {
      if (!item._id) {
        console.error('Item ID is missing');
        return;
      }
      
      const oncadeService = OncadeService.getInstance();
      const redirectUrl = `${window.location.origin}/purchase-success`;
      
      const purchaseUrl = await oncadeService.getPurchaseURL(item._id, redirectUrl);
      
      if (purchaseUrl) {
        // Redirect to the purchase page
        window.location.href = purchaseUrl;
      } else {
        console.error('Failed to generate purchase URL');
        setError('Unable to process purchase. Please try again.');
      }
    } catch (err) {
      console.error('Error processing purchase:', err);
      setError('Purchase failed. Please try again later.');
    }
  };

  const handleLogin = async () => {
    try {
      const oncadeService = OncadeService.getInstance();
      const redirectUrl = `${window.location.origin}/login-success`;
      
      const loginUrl = await oncadeService.getLoginURL(redirectUrl);
      
      if (loginUrl) {
        // Redirect to login page
        window.location.href = loginUrl;
      } else {
        setError('Unable to generate login URL. Please try again.');
      }
    } catch (err) {
      console.error('Error generating login URL:', err);
      setError('Login failed. Please try again later.');
    }
  };

  if (loading) {
    return (
      <div className="store-menu">
        <div className="loading">Loading store items...</div>
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="store-menu">
        <div className="error">Error loading store: {error}</div>
        <button onClick={onBack}>Back to Menu</button>
      </div>
    );
  }

  return (
    <div className="store-menu">
      <div className="menu-container">
        <h2>Oncade Store</h2>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <div className="store-items">
          {items.map((item) => (
            <div key={item._id} className="store-item">
              <div className="item-image">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} />
                ) : (
                  <div className="image-placeholder">{item.name[0]}</div>
                )}
              </div>
              <div className="item-details">
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <div className="item-price">${(item.price / 100).toFixed(2)}</div>
                <button onClick={() => handlePurchase(item)}>Purchase</button>
              </div>
            </div>
          ))}
        </div>
        {sessionStatus === 'checking' ? (
          <div className="auth-section">
            <p>Checking authentication status...</p>
          </div>
        ) : sessionStatus === 'error' ? (
          <div className="auth-section">
            <p>Could not verify login status</p>
            <button onClick={handleLogin} className="login-button">Log In</button>
          </div>
        ) : !isAuthenticated ? (
          <div className="auth-section">
            <p>Log in to view your purchase history</p>
            <button onClick={handleLogin} className="login-button">Log In</button>
          </div>
        ) : (
          <div className="auth-section auth-logged-in">
            <span className="logged-in-indicator">✓ Logged in</span>
          </div>
        )}
        <div className="back-button-container">
          <button className="back-button" onClick={onBack}>Back</button>
        </div>
      </div>
    </div>
  );
};

export default StoreMenu; 