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
            <h2>Our Refund Policy</h2>
            <p className={styles.emphasis}>
              Due to the nature of our digital service, Xplaino operates with a <strong>commitment to 
              quality and immediate access</strong>. We kindly ask you to understand that purchases and 
              subscriptions are generally not eligible for refunds.
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
            <strong>Please note that purchases are generally considered complete upon confirmation.</strong> We 
            understand this is an important consideration, and while we typically cannot offer refunds, returns, 
            or exchanges, we remain committed to working with you on any concerns, and will always honor 
            applicable legal requirements.
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
            We hope you understand that due to the immediate and intangible nature of digital services, 
            processing refunds after a purchase is completed or a subscription is activated presents 
            significant challenges. We appreciate your understanding of this aspect of digital products.
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
            <li><strong>Cancellation:</strong> You have the flexibility to cancel your subscription at any time 
            through your account settings or by contacting us. Please note that while cancellation will prevent 
            future charges, the current billing period will remain active until its natural conclusion.</li>
            <li><strong>Partial Period Policy:</strong> We kindly ask for your understanding that unused 
            portions of subscription periods are not eligible for refunds, as access to all features remains 
            available throughout the entire billing period.</li>
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
            <li>Payment is processed in full at the time of purchase</li>
            <li>Access to purchased features is granted immediately upon payment confirmation</li>
            <li>We appreciate your understanding that purchases are considered complete upon confirmation</li>
            <li>Purchased features remain accessible to you as long as the Extension is available and your 
            account remains in good standing</li>
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
            <li>Please be aware that once a paid subscription begins after a free trial, the standard terms 
            regarding completed purchases will apply</li>
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
            <li><strong>Our Commitment to You:</strong> While technical difficulties, compatibility 
            issues, or user challenges may not qualify for refund consideration, we want to emphasize our 
            strong commitment to working with you to resolve any issues you encounter</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>7. Service Modifications and Discontinuation</h2>
          <p>
            We reserve the right to modify, suspend, or discontinue any aspect of the Extension at any time. 
            However:
          </p>
          <ul>
            <li>We will make every reasonable effort to provide advance notice of significant changes or 
            discontinuation</li>
            <li>We ask for your understanding that modifications to features or functionality generally 
            do not qualify for refund consideration, as we continuously work to improve the service</li>
            <li>In the unlikely event that we permanently discontinue the Extension, we are committed to 
            evaluating each active subscription fairly on a case-by-case basis</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>8. Payment Disputes</h2>
          <p>
            We value open communication and encourage you to contact us directly before initiating a 
            chargeback or payment dispute. If a dispute is raised with your financial institution:
          </p>
          <ul>
            <li>We will work cooperatively with your financial institution by providing documentation of 
            your purchase and this Refund Policy</li>
            <li>Please understand that chargebacks can affect our ability to continue providing service 
            to your account, and may result in service suspension while the matter is being resolved</li>
            <li>We will present our perspective and evidence of service delivery to help reach a fair 
            resolution</li>
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
            We recognize that every situation is unique, and exceptional circumstances can arise. If you 
            believe your situation warrants special consideration, we welcome you to reach out to us at 
            support@xplaino.com with:
          </p>
          <ul>
            <li>A detailed explanation of your circumstances</li>
            <li>Your purchase or subscription details</li>
            <li>Any relevant documentation</li>
          </ul>
          <p>
            We are committed to reviewing each request thoughtfully on a case-by-case basis. While we 
            cannot guarantee a particular outcome, we will carefully consider your situation and provide 
            you with a clear response.
          </p>
        </section>

        <section className={styles.section}>
          <h2>11. Changes to This Policy</h2>
          <p>
            We may occasionally update this Refund Policy to reflect changes in our practices or for legal 
            reasons. When we make changes, they will be posted on this page and become effective as indicated 
            by the "Last Updated" date. Your continued use of the Extension after updates indicates your 
            acceptance of the revised Policy.
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
            <p><strong>Refund Inquiries:</strong> support@xplaino.com</p>
            <p><strong>Website:</strong> <a href="https://www.xplaino.com" className={styles.link}>www.xplaino.com</a></p>
          </div>
          <p>
            We aim to respond to all inquiries within 2-3 business days.
          </p>
        </section>

        <section className={styles.section}>
          <h2>13. Your Agreement</h2>
          <p>
            By purchasing, subscribing to, or using any paid features of Xplaino, you confirm that:
          </p>
          <ul>
            <li>You have had the opportunity to read and understand this Refund Policy</li>
            <li>You agree to the terms outlined in this Policy</li>
            <li>You understand our approach to completed purchases as described above</li>
            <li>You have had the opportunity to review the Extension's features, free trial (if available), 
            and requirements before making your purchase decision</li>
            <li>You understand the digital nature of the service and appreciate the immediate access provided</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

RefundPolicy.displayName = 'RefundPolicy';
