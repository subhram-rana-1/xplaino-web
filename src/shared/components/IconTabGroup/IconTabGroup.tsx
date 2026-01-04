import React, { useRef, useEffect, useLayoutEffect } from 'react';
import { IconType } from 'react-icons';
import styles from './IconTabGroup.module.css';

export interface IconTab {
  id: string;
  icon: IconType;
  label: string;
}

export interface IconTabGroupProps {
  tabs: IconTab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  iconSize?: number;
  tabSize?: number;
}

/**
 * IconTabGroup - Tab group component with icons and sliding indicator
 */
export const IconTabGroup: React.FC<IconTabGroupProps> = ({
  tabs,
  activeTabId,
  onTabChange,
  iconSize = 18,
}) => {
  const tabGroupRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Initialize tab refs array
  useEffect(() => {
    tabRefs.current = tabs.map(() => null);
  }, [tabs]);

  const updateSliderPosition = (animate: boolean = false) => {
    if (!sliderRef.current || !tabGroupRef.current) return false;

    const activeIndex = tabs.findIndex((tab) => tab.id === activeTabId);
    if (activeIndex === -1) return false;

    const activeTab = tabRefs.current[activeIndex];
    if (!activeTab) return false;

    // Use offsetLeft which gives position relative to offset parent (tabGroup)
    // This properly accounts for padding and layout
    const offsetX = activeTab.offsetLeft;
    const tabWidth = activeTab.offsetWidth;

    if (animate) {
      sliderRef.current.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    } else {
      sliderRef.current.style.transition = 'none';
    }

    sliderRef.current.style.transform = `translateX(${offsetX}px)`;
    sliderRef.current.style.width = `${tabWidth}px`;

    return true;
  };

  // Use layout effect for initial mount
  useLayoutEffect(() => {
    let retryCount = 0;
    const maxRetries = 5;
    
    const tryUpdate = () => {
      const success = updateSliderPosition(false);
      if (!success && retryCount < maxRetries) {
        retryCount++;
        setTimeout(tryUpdate, 20 * retryCount); // Exponential backoff
      }
    };

    // Initial attempt after a small delay
    const timeoutId = setTimeout(tryUpdate, 10);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update slider position when activeTabId changes
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 5;
    
    const tryUpdate = () => {
      const success = updateSliderPosition(true);
      if (!success && retryCount < maxRetries) {
        retryCount++;
        setTimeout(tryUpdate, 20 * retryCount); // Exponential backoff
      }
    };

    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(tryUpdate, 10);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabId]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      updateSliderPosition(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.tabGroup} ref={tabGroupRef}>
      <div className={styles.tabSlider} ref={sliderRef} />
      {tabs.map((tab, index) => {
        const IconComponent = tab.icon;
        const isActive = activeTabId === tab.id;

        return (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            className={`${styles.tab} ${isActive ? styles.active : ''}`}
            onClick={() => onTabChange(tab.id)}
            aria-label={tab.label}
            type="button"
          >
            <IconComponent size={iconSize} className={styles.tabIcon} />
            <span className={styles.tabLabel}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

IconTabGroup.displayName = 'IconTabGroup';

