import React from 'react';
import chromeIcon from '../../../assets/images/google-chrome-icon.png';
import styles from './ChromeButton.module.css';

export interface ChromeButtonProps {
  /** When true, show "It's Free" on a second line below "Install Chrome Extension" (e.g. for CTA section) */
  stackedLabel?: boolean;
}

/**
 * ChromeButton - Reusable Chrome extension install button
 */
export const ChromeButton: React.FC<ChromeButtonProps> = ({ stackedLabel = false }) => {
  const handleButtonClick = () => {
    window.open(
      'https://chromewebstore.google.com/detail/xplaino/nmphalmbdmddagbllhjnfnmodfmbnlkp',
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <button
      className={`${styles.chromeButton} ${stackedLabel ? styles.stackedLabel : ''}`}
      onClick={handleButtonClick}
    >
      <img src={chromeIcon} alt="Chrome Logo" className={styles.chromeLogo} />
      <span className={styles.buttonText}>
        {stackedLabel ? (
          <>
            <span className={styles.buttonLinePrimary}>Install Chrome Extension</span>
            <span className={styles.buttonLineSecondary}>It's Free</span>
          </>
        ) : (
          <span className={styles.buttonLinePrimary}>Install Chrome Extension — It's Free</span>
        )}
      </span>
    </button>
  );
};

ChromeButton.displayName = 'ChromeButton';



