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
    // TODO: Uncomment once chorme extension is all done
    window.open(
      'https://chromewebstore.google.com/detail/xplaino/nmphalmbdmddagbllhjnfnmodfmbnlkp',
      '_blank',
      'noopener,noreferrer'
    );
    
    // Navigate to pre-launch page to register user interest
    // navigate('/pre-launch');
  };

  return (
    <button className={styles.chromeButton} onClick={handleButtonClick}>
      <img src={chromeIcon} alt="Chrome Logo" className={styles.chromeLogo} />
      <span className={styles.buttonText}>
        <span className={styles.buttonLinePrimary}>Install Chrome Extension — It's Free</span>
      </span>
    </button>
  );
};

ChromeButton.displayName = 'ChromeButton';



