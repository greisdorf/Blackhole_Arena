import React, { useEffect, useState } from 'react';
import ReactConfetti from 'react-confetti';
import OncadeService from '../services/OncadeService';

interface TipSuccessModalProps {
  onClose: () => void;
}

const TipSuccessModal: React.FC<TipSuccessModalProps> = ({ onClose }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tipInfo, setTipInfo] = useState<any | null>(null);
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

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
    // Get transaction hash from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const hash = urlParams.get('transactionHash');
    
    if (hash) {
      setTransactionHash(hash);
    }
  }, []);

  const handleClose = () => {
    // Clean up URL parameters without refreshing the page
    const newUrl = window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);
    onClose();
  };

  useEffect(() => {
    const fetchTipDetails = async () => {
      try {
        if (!transactionHash) {
          setError('Transaction hash is missing.');
          setLoading(false);
          return;
        }

        console.log(transactionHash);

        const oncadeService = OncadeService.getInstance();
        await oncadeService.initialize();
        
        // Get the specific transaction by hash
        const transaction = await oncadeService.getTransactionByHash(transactionHash);
        
        if (transaction) {
          setTipInfo(transaction);
          // Delay confetti slightly for a better effect
          setTimeout(() => setShowConfetti(true), 500);
        } else {
          setError('Tip transaction not found in your history.');
          const transactions = await oncadeService.getPurchaseHistory();
          console.log(transactions);
        }
      } catch (err) {
        console.error('Error fetching tip details:', err);
        setError('Could not retrieve tip information.');
      } finally {
        setLoading(false);
      }
    };

    if (transactionHash) {
      fetchTipDetails();
    }
  }, [transactionHash]);

  return (
    <div className="modal-overlay">
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
      <div className="modal-container">
        <h2>Thank You for Your Tip!</h2>
        
        {loading ? (
          <div className="loading-message">
            <p>Loading...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
          </div>
        ) : tipInfo ? (
          <div className="success-message">
            <p>Your tip has been received and is greatly appreciated!</p>
            {tipInfo.amount && (
              <p>Amount: ${(tipInfo.amount / 100).toFixed(2)}</p>
            )}
            <p>Thank you for supporting the developer!</p>
          </div>
        ) : (
          <div className="info-message">
            <p>Thank you for your tip!</p>
          </div>
        )}
        
        <button className="close-button" onClick={handleClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default TipSuccessModal; 