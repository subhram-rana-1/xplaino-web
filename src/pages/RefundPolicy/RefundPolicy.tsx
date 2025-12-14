import React from 'react';
import styles from './RefundPolicy.module.css';

/**
 * RefundPolicy - Refund Policy page component
 * 
 * @returns JSX element
 */
export const RefundPolicy: React.FC = () => {
  const lastUpdated = 'January 2025';

  return (
    <div className={styles.refundPolicy}>
      <div className={styles.header}>
        <h1>Refund Policy</h1>
        <p className={styles.lastUpdated}>Last Updated: {lastUpdated}</p>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <div className={styles.policyStatement}>
            <h2>No Refund Policy</h2>
            <p className={styles.emphasis}>
              Xplaino operates under a <strong>no refund policy</strong>. All purchases and subscriptions 
              are final and non-refundable.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2>1. Policy Overview</h2>
          <p>
            This Refund Policy ("Policy") governs all transactions related to the Xplaino Chrome Extension 
            ("Extension", "Service", "we", "us", or "our"). By purchasing, subscribing to, or using any 
            paid features of the Extension, you acknowledge that you have read, understood, and agree to 
            be bound by this Policy.
          </p>
          <p>
            <strong>All sales are final.</strong> We do not provide refunds, returns, or exchanges for any 
            purchases or subscriptions, except as required by applicable law or as explicitly stated in this 
            Policy.
          </p>
        </section>

        <section className={styles.section}>
          <h2>2. Nature of Digital Service</h2>
          <p>
            Xplaino is a digital software service delivered as a Chrome browser extension. The nature of 
            digital products and services means that:
          </p>
          <ul>
            <li>Once the Extension is installed and activated, you have immediate access to all features</li>
            <li>Digital services cannot be "returned" in the traditional sense</li>
            <li>All features are available immediately upon purchase or subscription activation</li>
            <li>The Extension can be used immediately without physical delivery delays</li>
          </ul>
          <p>
            Due to the immediate and intangible nature of digital services, we are unable to process refunds 
            once a purchase has been completed or a subscription has been activated.
          </p>
        </section>

        <section className={styles.section}>
          <h2>3. Subscription Terms</h2>
          <p>
            If you have purchased a subscription to Xplaino:
          </p>
          <ul>
            <li><strong>Subscription Activation:</strong> Your subscription begins immediately upon purchase 
            and payment confirmation.</li>
            <li><strong>Automatic Renewal:</strong> Subscriptions may automatically renew at the end of each 
            billing period unless cancelled before the renewal date.</li>
            <li><strong>Cancellation:</strong> You may cancel your subscription at any time through your 
            account settings or by contacting us. Cancellation will prevent future charges but does not 
            entitle you to a refund for the current billing period.</li>
            <li><strong>No Refunds for Partial Periods:</strong> We do not provide refunds for unused 
            portions of subscription periods, regardless of when you cancel.</li>
            <li><strong>Immediate Access:</strong> Once payment is processed, you have immediate access 
            to all subscription features for the entire billing period.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>4. One-Time Purchases</h2>
          <p>
            For one-time purchases of the Extension or premium features:
          </p>
          <ul>
            <li>Payment is required in full at the time of purchase</li>
            <li>Access to purchased features is granted immediately upon payment confirmation</li>
            <li>All sales are final and non-refundable</li>
            <li>Purchased features remain accessible as long as the Extension is available and your account 
            is in good standing</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>5. Free Trial Period</h2>
          <p>
            If we offer a free trial period:
          </p>
          <ul>
            <li>Free trials allow you to experience the Extension at no cost for a limited time</li>
            <li>You may cancel during the free trial period to avoid being charged</li>
            <li>If you do not cancel before the trial ends, your subscription will begin and charges will 
            apply</li>
            <li>Once a paid subscription begins after a free trial, our standard no refund policy applies</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>6. Technical Issues and Support</h2>
          <p>
            If you experience technical issues with the Extension:
          </p>
          <ul>
            <li><strong>Contact Support First:</strong> We encourage you to contact our support team at 
            support@xplaino.com before requesting any refund consideration</li>
            <li><strong>Problem Resolution:</strong> Our support team will work with you to resolve any 
            technical issues you may encounter</li>
            <li><strong>Compatibility:</strong> Please ensure your browser and system meet the Extension's 
            requirements before purchasing</li>
            <li><strong>No Refund for Technical Issues:</strong> Technical difficulties, compatibility 
            issues, or user error do not entitle you to a refund, though we will make reasonable efforts 
            to help resolve issues</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>7. Service Modifications and Discontinuation</h2>
          <p>
            We reserve the right to modify, suspend, or discontinue any aspect of the Extension at any time. 
            However:
          </p>
          <ul>
            <li>We will make reasonable efforts to provide advance notice of significant changes or 
            discontinuation</li>
            <li>Modifications to features or functionality do not entitle you to a refund</li>
            <li>If we permanently discontinue the Extension, we will evaluate refund eligibility on a 
            case-by-case basis for active subscriptions</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>8. Chargebacks and Payment Disputes</h2>
          <p>
            If you initiate a chargeback or payment dispute with your financial institution:
          </p>
          <ul>
            <li>We will provide documentation of your purchase and this Refund Policy to your financial 
            institution</li>
            <li>Chargebacks initiated in violation of this Policy may result in immediate termination of 
            your account and access to the Extension</li>
            <li>We reserve the right to dispute chargebacks and provide evidence of service delivery</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>9. Legal Requirements</h2>
          <p>
            This Policy does not affect your statutory rights as a consumer. If you are located in a 
            jurisdiction that provides mandatory refund rights that cannot be waived, those rights will 
            apply to the extent required by law.
          </p>
          <p>
            In particular, if you are located in the European Union, you may have a 14-day right of 
            withdrawal for digital content, but this right may be waived if you have consented to 
            immediate performance and acknowledged that you will lose your right of withdrawal.
          </p>
        </section>

        <section className={styles.section}>
          <h2>10. Exceptional Circumstances</h2>
          <p>
            While we maintain a strict no refund policy, we understand that exceptional circumstances may 
            arise. If you believe your situation warrants special consideration, please contact us at 
            support@xplaino.com with:
          </p>
          <ul>
            <li>A detailed explanation of your circumstances</li>
            <li>Your purchase or subscription details</li>
            <li>Any relevant documentation</li>
          </ul>
          <p>
            We will review each request on a case-by-case basis. However, submission of a request does 
            not guarantee a refund, and our decision is final.
          </p>
        </section>

        <section className={styles.section}>
          <h2>11. Changes to This Policy</h2>
          <p>
            We reserve the right to modify this Refund Policy at any time. Changes will be effective 
            immediately upon posting on this page. Your continued use of the Extension after any changes 
            constitutes your acceptance of the updated Policy.
          </p>
          <p>
            Material changes to this Policy will be communicated through the Extension interface or via 
            email to registered users.
          </p>
        </section>

        <section className={styles.section}>
          <h2>12. Contact Information</h2>
          <p>
            If you have questions about this Refund Policy or need assistance with your purchase or 
            subscription, please contact us:
          </p>
          <div className={styles.contactInfo}>
            <p><strong>Email:</strong> support@xplaino.com</p>
            <p><strong>Refund Inquiries:</strong> refunds@xplaino.com</p>
            <p><strong>Website:</strong> <a href="https://xplaino.com" className={styles.link}>https://xplaino.com</a></p>
          </div>
          <p>
            We aim to respond to all inquiries within 2-3 business days.
          </p>
        </section>

        <section className={styles.section}>
          <h2>13. Acknowledgment</h2>
          <p>
            By purchasing, subscribing to, or using any paid features of Xplaino, you acknowledge that:
          </p>
          <ul>
            <li>You have read and understood this Refund Policy</li>
            <li>You agree to be bound by the terms of this Policy</li>
            <li>You understand that all sales are final and non-refundable</li>
            <li>You have had the opportunity to review the Extension's features and requirements before 
            making a purchase</li>
            <li>You accept the digital nature of the service and the immediate access provided</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

RefundPolicy.displayName = 'RefundPolicy';
