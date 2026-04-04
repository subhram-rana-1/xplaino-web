import React from 'react';
import { usePageTitle } from '@/shared/hooks/usePageTitle';
import styles from './RefundPolicy.module.css';

/**
 * RefundPolicy - Refund Policy page component
 * 
 * @returns JSX element
 */
export const RefundPolicy: React.FC = () => {
  usePageTitle('Refund Policy – Xplaino');
  const lastUpdated = 'February 2026';

  return (
    <div className={styles.refundPolicy}>
      <div className={styles.header}>
        <h1>Refund Policy</h1>
        <p className={styles.lastUpdated}>Last Updated: {lastUpdated}</p>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2>1. Policy Overview</h2>
          <p>
            Xplaino is operated by <strong>Subhram Subhrajyoti Rana</strong> (sole proprietor), doing business
            as Aivor. This Refund Policy ("Policy") governs all transactions related to the Xplaino Chrome
            Extension ("Extension", "Service", "we", "us", or "our").
          </p>
          <p>
            All payments, billing, and refunds for Xplaino are processed through <strong>Paddle.com Market
            Ltd</strong> ("Paddle"), which acts as the Merchant of Record for all transactions. You may see
            "Paddle.net" or "Paddle" on your bank or credit card statements for charges related to Xplaino.
          </p>
        </section>

        <section className={styles.section}>
          <h2>2. 14-Day Refund Policy</h2>
          <p>
            You have the right to request a full refund within <strong>14 days</strong> of the date of
            your purchase, without needing to provide a reason.
          </p>
          <p>
            To meet the refund deadline, it is sufficient that you send your refund request before the
            expiration of the 14-day period.
          </p>
        </section>

        <section className={styles.section}>
          <h2>3. How to Request a Refund</h2>
          <p>
            To request a refund, please contact us using one of the following methods:
          </p>
          <ul>
            <li><strong>Email:</strong> Send your refund request to support@xplaino.com</li>
            <li><strong>Paddle:</strong> Contact Paddle directly through their{' '}
            <a href="https://www.paddle.com/help/start/intro-paddle/how-can-i-get-a-refund-or-cancel-my-subscription" className={styles.link} target="_blank" rel="noopener noreferrer">
            support page</a></li>
          </ul>
          <p>
            When requesting a refund, please include your order number or the email address used
            for the purchase so we can process your request promptly.
          </p>
        </section>

        <section className={styles.section}>
          <h2>4. Refund Processing</h2>
          <p>
            If you request a refund within the 14-day period:
          </p>
          <ul>
            <li>We will reimburse all payments received from you for the transaction</li>
            <li>Refunds will be processed without undue delay, and no later than 14 days after the day
            on which we are informed of your decision to request a refund</li>
            <li>Refunds will be made using the same payment method you used for the original transaction</li>
            <li>You will not incur any fees as a result of the refund</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>5. Subscriptions</h2>
          <p>
            If you have purchased a subscription to Xplaino:
          </p>
          <ul>
            <li><strong>Refund on Initial Purchase:</strong> You can request a full refund within
            14 days of your initial subscription purchase</li>
            <li><strong>Automatic Renewal:</strong> Subscriptions automatically renew at the end of each
            billing period unless cancelled before the renewal date</li>
            <li><strong>Cancellation:</strong> You can cancel your subscription at any time through your
            account settings or by contacting us at support@xplaino.com. Cancellation will take effect
            at the end of the current billing period, and no further charges will be made</li>
            <li><strong>How to Cancel:</strong> Please cancel at least 48 hours before the end of the
            current billing period to ensure your cancellation is processed before the next renewal</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>6. Free Trial Period</h2>
          <p>
            If a free trial period is offered:
          </p>
          <ul>
            <li>You may cancel during the free trial period to avoid being charged</li>
            <li>If you do not cancel before the trial ends, your paid subscription will begin and the
            standard 14-day refund policy applies from the date of the first charge</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>7. Consumer Rights</h2>
          <p>
            This Policy does not affect your statutory rights as a consumer. If you are located in a
            jurisdiction that provides mandatory consumer protection rights, those rights apply in full.
          </p>
          <p>
            If you are a consumer in the European Union, you have a 14-day right of withdrawal from the
            date of purchase. To exercise this right, you must inform us of your decision to withdraw
            before the 14-day period expires.
          </p>
        </section>

        <section className={styles.section}>
          <h2>8. Payment Disputes</h2>
          <p>
            We encourage you to contact us directly before initiating a chargeback or payment dispute
            with your financial institution. We are committed to resolving any billing concerns promptly.
          </p>
        </section>

        <section className={styles.section}>
          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this Refund Policy from time to time. Changes will be posted on this page and
            become effective as indicated by the "Last Updated" date. Material changes will be communicated
            through the Extension interface or via email to registered users.
          </p>
        </section>

        <section className={styles.section}>
          <h2>10. Contact Information</h2>
          <p>
            If you have questions about this Refund Policy or need assistance with a refund request,
            please contact us:
          </p>
          <div className={styles.contactInfo}>
            <p><strong>Refund Inquiries:</strong> support@xplaino.com</p>
            <p><strong>Website:</strong> <a href="https://www.xplaino.com" className={styles.link}>www.xplaino.com</a></p>
          </div>
          <p>
            We aim to respond to all refund inquiries within 2-3 business days.
          </p>
        </section>
      </div>
    </div>
  );
};

RefundPolicy.displayName = 'RefundPolicy';
