import React, { useEffect, useState } from 'react';
import ReactConfetti from 'react-confetti';
import OncadeService from '../services/OncadeService';
import { PurchaseItem } from '../types';

interface PurchaseSuccessProps {
  onBackToStore: () => void;
}

const PurchaseSuccess: React.FC<PurchaseSuccessProps> = ({ onBackToStore }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [purchaseVerified, setPurchaseVerified] = useState<boolean>(false);
  const [purchasedItem, setPurchasedItem] = useState<PurchaseItem | null>(null);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [showConfetti, setShowConfetti] = useState<boolean>(false);

  // Update window size when it changes
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const verifyPurchase = async () => {
      try {
        // Get the transaction ID from URL query parameters
        const urlParams = new URLSearchParams(window.location.search);
        const txId = urlParams.get('transactionHash');
        setTransactionId(txId);

        if (!txId) {
          setError('No transaction ID provided.');
          setLoading(false);
          return;
        }

        // Get Oncade service
        const oncadeService = OncadeService.getInstance();
        
        // Ensure SDK is initialized before proceeding
        if (!oncadeService.isInitialized()) {
          console.log('Initializing Oncade SDK...');
          const initialized = await oncadeService.initialize();
          if (!initialized) {
            setError('Failed to initialize payment system. Please try again.');
            setLoading(false);
            return;
          }
        }
        
        // Check session info
        const sessionInfo = await oncadeService.getSessionInfo();
        if (!sessionInfo.isValid) {
          console.log('Invalid session:', sessionInfo);
          setError('Invalid session. Please try again.');
          setLoading(false);
          return;
        }

        // Verify the purchase if the user is authenticated
        if (sessionInfo.hasUserId) {
          // Get transaction history
          const transactions = await oncadeService.getPurchaseHistory();
          
          // Find the transaction with matching ID
          const completedTransaction = transactions.find(
            (tx) => tx.transactionHash === txId && tx.status === 'completed'
          );
          
          if (completedTransaction) {
            console.log('Purchase verified:', completedTransaction);
            setPurchaseVerified(true);
            
            // Get the purchased item details
            const item = await oncadeService.getStoreItem(completedTransaction.metadata.itemId);
            if (item) {
              setPurchasedItem(item);
              // Delay confetti slightly for a better effect
              setTimeout(() => setShowConfetti(true), 500);
            }
          } else {
            setError('Purchase verification failed. Please contact support.');
          }
        } else {
          // User is not authenticated, we can't verify purchase
          setError('User not authenticated. Please log in to verify your purchase.');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error verifying purchase:', err);
        setError('An error occurred while verifying your purchase. Please try again.');
        setLoading(false);
      }
    };

    verifyPurchase();
  }, []);

  if (loading) {
    return (
      <div className="purchase-success">
        <div className="loading">
          <div className="loading-spinner" />
          <div>Verifying your purchase...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="purchase-success">
      {showConfetti && (
        <ReactConfetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.2}
          initialVelocityY={20}
          tweenDuration={100}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 1000 }}
        />
      )}
      <div className="purchase-container">
        <h2>{purchaseVerified ? 'Purchase Successful!' : 'Purchase Status'}</h2>
        
        {error ? (
          <div className="error-message">
            <p>{error}</p>
          </div>
        ) : purchaseVerified && purchasedItem ? (
          <div className="success-message">
            <div className="purchased-item">
              {purchasedItem.imageUrl && (
                <img 
                  src={purchasedItem.imageUrl} 
                  alt={purchasedItem.name}
                  className="item-image"
                />
              )}
              <h3>{purchasedItem.name}</h3>
              <p>{purchasedItem.description}</p>
            </div>
            <p>Thank you for your purchase!</p>
          </div>
        ) : (
          <div className="info-message">
            <p>Your purchase is being processed.</p>
          </div>
        )}
        
        <button className="back-button" onClick={onBackToStore}>
          Return to Store
        </button>
      </div>
    </div>
  );
};

export default PurchaseSuccess; 