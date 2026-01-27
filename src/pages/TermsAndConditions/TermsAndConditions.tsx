import React from 'react';
import styles from './TermsAndConditions.module.css';

/**
 * TermsAndConditions - Terms & Conditions page component
 * 
 * @returns JSX element
 */
export const TermsAndConditions: React.FC = () => {
  const lastUpdated = 'January 2025';

  return (
    <div className={styles.termsAndConditions}>
      <div className={styles.header}>
        <h1>Terms & Conditions</h1>
        <p className={styles.lastUpdated}>Last Updated: {lastUpdated}</p>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using the Xplaino Chrome Extension ("Extension", "Service", "we", "us", or "our"), 
            you accept and agree to be bound by the terms and provision of this agreement. If you do not agree 
            to abide by the above, please do not use this service.
          </p>
          <p>
            These Terms & Conditions ("Terms") govern your access to and use of Xplaino, an AI-powered browser 
            extension that provides contextual explanations, word meanings, text summaries, and multilingual 
            chat capabilities. By installing, accessing, or using the Extension, you agree to comply with 
            these Terms.
          </p>
        </section>

        <section className={styles.section}>
          <h2>2. Description of Service</h2>
          <p>
            Xplaino is a Chrome browser extension that enhances your reading experience through AI-powered 
            features, including but not limited to:
          </p>
          <ul>
            <li><strong>Instant Word Meanings:</strong> Double-click any word to receive instant AI-powered 
            explanations with meanings, examples, and contextual usage.</li>
            <li><strong>Text Summarization:</strong> Select text passages or entire webpages to receive 
            AI-generated summaries and explanations.</li>
            <li><strong>Word Bookmarking:</strong> Save and organize words with their meanings for future 
            reference, synced across all your browser tabs and devices.</li>
            <li><strong>Multilingual AI Chat:</strong> Engage in conversations with AI in over 50 languages, 
            regardless of the website's content language.</li>
            <li><strong>Page Analysis:</strong> Ask questions about entire webpages and receive comprehensive 
            AI-powered responses.</li>
            <li><strong>Text Simplification:</strong> Get simplified explanations of complex text passages 
            to improve comprehension.</li>
          </ul>
          <p>
            The Service processes content from webpages you visit and uses artificial intelligence to provide 
            explanations, summaries, and responses. The Extension operates in the background and requires 
            certain browser permissions to function properly.
          </p>
        </section>

        <section className={styles.section}>
          <h2>3. User Accounts and Registration</h2>
          <p>
            Some features of the Extension may require you to create an account or provide personal information. 
            You are responsible for maintaining the confidentiality of your account credentials and for all 
            activities that occur under your account.
          </p>
          <p>
            You agree to:
          </p>
          <ul>
            <li>Provide accurate, current, and complete information during registration</li>
            <li>Maintain and promptly update your account information</li>
            <li>Maintain the security of your password and identification</li>
            <li>Accept all responsibility for activities that occur under your account</li>
            <li>Inform us immediately by raising an "issue ticket" of any unauthorized use of your account</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>4. Acceptable Use Policy</h2>
          <p>
            You agree to use the Extension only for lawful purposes and in accordance with these Terms. 
            You agree not to use the Extension:
          </p>
          <ul>
            <li>In any way that violates any applicable federal, state, local, or international law or 
            regulation</li>
            <li>To transmit, or procure the sending of, any advertising or promotional material without 
            our prior written consent</li>
            <li>To impersonate or attempt to impersonate the company, a company employee, another user, 
            or any other person or entity</li>
            <li>In any way that infringes upon the rights of others, or in any way is illegal, threatening, 
            fraudulent, or harmful</li>
            <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of 
            the Extension, or which may harm the company or users of the Extension</li>
            <li>To attempt to gain unauthorized access to, interfere with, damage, or disrupt any parts of 
            the Extension, the server on which the Extension is stored, or any server, computer, or database 
            connected to the Extension</li>
            <li>To use automated systems (bots, scrapers, etc.) to access the Extension in a manner that 
            sends more request messages to our servers than a human can reasonably produce in the same period</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>5. Intellectual Property Rights</h2>
          <p>
            The Extension and its original content, features, and functionality are and will remain the 
            exclusive property of Xplaino and its licensors. The Extension is protected by copyright, 
            trademark, and other laws. Our trademarks and trade dress may not be used in connection with 
            any product or service without our prior written consent.
          </p>
          <p>
            You retain ownership of any content you create, bookmark, or save using the Extension. However, 
            by using the Extension, you grant us a non-exclusive, worldwide, royalty-free license to use, 
            reproduce, modify, and process your content solely for the purpose of providing and improving 
            the Service.
          </p>
        </section>

        <section className={styles.section}>
          <h2>6. AI-Generated Content Disclaimers</h2>
          <p>
            The Extension uses artificial intelligence to generate explanations, summaries, translations, 
            and responses. You acknowledge and agree that:
          </p>
          <ul>
            <li>AI-generated content may contain errors, inaccuracies, or omissions</li>
            <li>AI-generated content should not be considered as professional, legal, medical, or financial 
            advice</li>
            <li>We do not guarantee the accuracy, completeness, or usefulness of any AI-generated content</li>
            <li>You should verify important information independently and not rely solely on AI-generated 
            content</li>
            <li>AI models may produce different results for similar inputs</li>
            <li>We are not responsible for decisions made based on AI-generated content</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>7. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by applicable law, Xplaino, its affiliates, agents, directors, 
            employees, suppliers, or licensors shall not be liable for any indirect, punitive, incidental, 
            special, consequential, or exemplary damages, including without limitation damages for loss of 
            profits, goodwill, use, data, or other intangible losses, arising out of or relating to the use 
            of, or inability to use, the Extension.
          </p>
          <p>
            To the maximum extent permitted by applicable law, Xplaino assumes no liability or responsibility 
            for any errors or omissions in the content of the Extension, any failures, delays, or interruptions 
            in the delivery of the Service, or any losses or damages arising from the use of the Extension or 
            any content posted, transmitted, or otherwise made available through the Extension.
          </p>
          <p>
            In no event shall Xplaino's total liability to you for all damages exceed the amount you paid to 
            us, if any, for accessing the Extension, or fifty dollars ($50), whichever is greater.
          </p>
        </section>

        <section className={styles.section}>
          <h2>8. Service Modifications and Availability</h2>
          <p>
            We reserve the right to withdraw or amend the Extension, and any service or material we provide 
            through the Extension, in our sole discretion without notice. We will not be liable if, for any 
            reason, all or any part of the Extension is unavailable at any time or for any period.
          </p>
        </section>

        <section className={styles.section}>
          <h2>9. Termination</h2>
          <p>
            We may terminate or suspend your access immediately, without prior notice or liability, for any 
            reason whatsoever, including without limitation if you breach the Terms. Upon termination, your 
            right to use the Extension will cease immediately.
          </p>
          <p>
            You may stop using the Extension at any time by uninstalling it from your browser. If you have 
            an account, you may delete it at any time through the Extension settings or by contacting us.
          </p>
        </section>

        <section className={styles.section}>
          <h2>10. Governing Law</h2>
          <p>
            These Terms shall be interpreted and governed by the laws of the jurisdiction in which Xplaino 
            operates, without regard to its conflict of law provisions. Our failure to enforce any right or 
            provision of these Terms will not be considered a waiver of those rights.
          </p>
        </section>

        <section className={styles.section}>
          <h2>11. Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If 
            a revision is material, we will provide at least 30 days notice prior to any new terms taking 
            effect. What constitutes a material change will be determined at our sole discretion.
          </p>
          <p>
            By continuing to access or use our Extension after any revisions become effective, you agree to 
            be bound by the revised terms. If you do not agree to the new terms, you must stop using the 
            Extension.
          </p>
        </section>

        <section className={styles.section}>
          <h2>12. Contact Information</h2>
          <p>
            If you have any questions about these Terms & Conditions, please contact us at:
          </p>
          <div className={styles.contactInfo}>
            <p><strong>Email:</strong> support@xplaino.com</p>
            <p><strong>Website:</strong> <a href="https://www.xplaino.com" className={styles.link}>www.xplaino.com</a></p>
          </div>
        </section>

        <section className={styles.section}>
          <h2>13. Severability</h2>
          <p>
            If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining 
            provisions of these Terms will remain in effect. These Terms constitute the entire agreement 
            between us regarding our Extension and supersede and replace any prior agreements we might have 
            between us regarding the Extension.
          </p>
        </section>
      </div>
    </div>
  );
};

TermsAndConditions.displayName = 'TermsAndConditions';
