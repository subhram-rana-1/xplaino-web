import React from 'react';
import chromeIcon from '../../../assets/images/google-chrome-icon.png';
import styles from './ChromeButton.module.css';

/**
 * ChromeButton - Reusable Chrome extension install button
 * 
 * @returns JSX element
 */
export const ChromeButton: React.FC = () => {
  const handleButtonClick = () => {
    window.open(
      'https://chromewebstore.google.com/detail/xplaino/nmphalmbdmddagbllhjnfnmodfmbnlkp',
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <button className={styles.chromeButton} onClick={handleButtonClick}>
      <img src={chromeIcon} alt="Chrome Logo" className={styles.chromeLogo} />
      <span className={styles.buttonText}>Install Chrome Extension</span>
    </button>
  );
};

ChromeButton.displayName = 'ChromeButton';



