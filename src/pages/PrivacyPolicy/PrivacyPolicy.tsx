import React from 'react';
import styles from './PrivacyPolicy.module.css';

/**
 * PrivacyPolicy - Privacy Policy page component
 * 
 * @returns JSX element
 */
export const PrivacyPolicy: React.FC = () => {
  const lastUpdated = 'January 2025';

  return (
    <div className={styles.privacyPolicy}>
      <div className={styles.header}>
      <h1>Privacy Policy</h1>
        <p className={styles.lastUpdated}>Last Updated: {lastUpdated}</p>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2>1. Introduction</h2>
          <p>
            At Xplaino ("we", "us", "our", or "Xplaino"), we are committed to protecting your privacy. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
            when you use our Chrome browser extension ("Extension", "Service").
          </p>
          <p>
            Please read this Privacy Policy carefully. By using the Extension, you consent to the data 
            practices described in this policy. If you do not agree with the practices described in this 
            policy, please do not use the Extension.
          </p>
        </section>

        <section className={styles.section}>
          <h2>2. Information We Collect</h2>
          <p>
            To provide our AI-powered reading assistance features, we collect the following types of 
            information:
          </p>

          <h3>2.1 Content You Select</h3>
          <ul>
            <li><strong>Selected Words:</strong> When you double-click a word or select text, we collect 
            the word or text passage you select to provide instant meanings and explanations.</li>
            <li><strong>Text Passages:</strong> When you select text for summarization or explanation, 
            we process the selected content to generate AI-powered summaries and explanations.</li>
            <li><strong>Webpage Content:</strong> When you request a page summary or ask questions about 
            a webpage, we collect and process the visible text content from the webpage you are viewing.</li>
          </ul>

          <h3>2.2 User-Generated Content</h3>
          <ul>
            <li><strong>Bookmarked Words:</strong> Words and their meanings that you save using our 
            bookmarking feature.</li>
            <li><strong>Chat Interactions:</strong> Messages, questions, and conversations you have with 
            our AI chat feature, including the language preferences you use.</li>
            <li><strong>User Preferences:</strong> Settings, language preferences, and customization 
            options you configure within the Extension.</li>
          </ul>

          <h3>2.3 Technical Information</h3>
          <ul>
            <li><strong>Browser Information:</strong> Browser type, version, and extension version.</li>
            <li><strong>Device Information:</strong> Device type, operating system, and screen resolution 
            (for UI optimization).</li>
            <li><strong>Usage Data:</strong> Features used, frequency of use, and interaction patterns 
            (to improve our service).</li>
            <li><strong>Error Logs:</strong> Technical error information to help us diagnose and fix issues.</li>
          </ul>

          <h3>2.4 Browser Permissions</h3>
          <p>
            The Extension requires the following browser permissions to function:
          </p>
          <ul>
            <li><strong>Active Tab Access:</strong> To read and process content from webpages you visit.</li>
            <li><strong>Storage:</strong> To save your bookmarks, preferences, and settings locally and 
            sync them across your devices.</li>
            <li><strong>Background Processing:</strong> To process page content and generate summaries 
            efficiently.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>3. How We Use Your Information</h2>
          <p>We use the collected information for the following purposes:</p>

          <h3>3.1 Service Provision</h3>
          <ul>
            <li>To provide instant word meanings, explanations, and definitions</li>
            <li>To generate AI-powered summaries of text passages and webpages</li>
            <li>To enable multilingual AI chat functionality</li>
            <li>To save and sync your bookmarked words across devices</li>
            <li>To process and respond to your questions about webpage content</li>
          </ul>

          <h3>3.2 AI Processing</h3>
          <p>
            Your selected text, questions, and content are processed by third-party AI service providers 
            to generate explanations, summaries, and responses. This processing may involve:
          </p>
          <ul>
            <li>Sending your selected content to AI models for analysis</li>
            <li>Using natural language processing to understand context</li>
            <li>Generating responses in your preferred language</li>
            <li>Storing conversation history to maintain context during chat sessions</li>
          </ul>

          <h3>3.3 Service Improvement</h3>
          <ul>
            <li>Analyzing usage patterns to improve Extension features and performance</li>
            <li>Identifying and fixing technical issues</li>
            <li>Developing new features based on user needs</li>
            <li>Optimizing AI response quality and accuracy</li>
          </ul>

          <h3>3.4 Personalization</h3>
          <ul>
            <li>Remembering your language preferences</li>
            <li>Maintaining your bookmarked words and saved content</li>
            <li>Customizing the Extension interface based on your usage</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>4. Data Storage and Syncing</h2>
          <p>
            Your bookmarked words, preferences, and settings are stored locally in your browser and may 
            be synced across your devices using browser sync functionality. This allows you to access 
            your saved content from any device where you use the Extension.
          </p>
          <p>
            <strong>Local Storage:</strong> Most data is stored locally in your browser using Chrome's 
            storage APIs. This data remains on your device unless you choose to sync it.
          </p>
          <p>
            <strong>Cloud Sync:</strong> If you enable browser sync, your bookmarks and preferences may 
            be stored in your Google account and synced across devices. This sync is managed by Google's 
            Chrome sync service, not directly by Xplaino.
          </p>
        </section>

        <section className={styles.section}>
          <h2>5. Third-Party Services</h2>
          <p>
            We use third-party services to provide our AI-powered features:
          </p>

          <h3>5.1 AI Service Providers</h3>
          <p>
            We partner with third-party AI service providers to process your content and generate 
            explanations, summaries, and responses. These providers may have access to:
          </p>
          <ul>
            <li>Text content you select or submit</li>
            <li>Questions and chat messages you send</li>
            <li>Webpage content you request to be summarized</li>
          </ul>
          <p>
            These AI providers process your data according to their own privacy policies. We select 
            providers that commit to maintaining appropriate security and privacy standards.
          </p>

          <h3>5.2 Chrome Web Store</h3>
          <p>
            The Extension is distributed through the Chrome Web Store, which may collect information 
            about Extension installations and updates according to Google's privacy policy.
          </p>

          <h3>5.3 Analytics Services</h3>
          <p>
            We may use analytics services to understand how users interact with the Extension. These 
            services collect aggregated, anonymized usage data and do not identify individual users.
          </p>
        </section>

        <section className={styles.section}>
          <h2>6. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your information:
          </p>
          <ul>
            <li><strong>Encryption:</strong> Data transmitted between your browser and our servers is 
            encrypted using industry-standard protocols (HTTPS/TLS).</li>
            <li><strong>Secure Storage:</strong> Sensitive data is stored securely using browser security 
            features and best practices.</li>
            <li><strong>Access Controls:</strong> Access to user data is restricted to authorized personnel 
            who need it to provide the Service.</li>
            <li><strong>Regular Updates:</strong> We regularly update the Extension to address security 
            vulnerabilities and improve protection.</li>
          </ul>
          <p>
            However, no method of transmission over the Internet or electronic storage is 100% secure. 
            While we strive to use commercially acceptable means to protect your information, we cannot 
            guarantee absolute security.
          </p>
        </section>

        <section className={styles.section}>
          <h2>7. Your Rights and Choices</h2>
          <p>You have the following rights regarding your personal information:</p>

          <h3>7.1 Access and Portability</h3>
          <ul>
            <li>Access your bookmarked words and saved content through the Extension interface</li>
            <li>Export your bookmarks and saved data</li>
            <li>View your Extension settings and preferences</li>
          </ul>

          <h3>7.2 Deletion</h3>
          <ul>
            <li>Delete individual bookmarked words or all bookmarks at any time</li>
            <li>Clear chat history and conversation data</li>
            <li>Uninstall the Extension to remove all locally stored data</li>
            <li>Request deletion of your account and associated data by contacting us</li>
          </ul>

          <h3>7.3 Control Over Data Collection</h3>
          <ul>
            <li>Disable the Extension at any time to stop data collection</li>
          </ul>

          <h3>7.4 Opt-Out</h3>
          <p>
            You can stop using the Extension at any time by uninstalling it from your browser. This will 
            stop all data collection and processing.
          </p>
        </section>

        <section className={styles.section}>
          <h2>8. Data Retention</h2>
          <p>
            We retain your information for as long as necessary to provide the Service and fulfill the 
            purposes described in this Privacy Policy, unless a longer retention period is required by law.
          </p>
          <ul>
            <li><strong>Bookmarked Words:</strong> Retained until you delete them or uninstall the Extension.</li>
            <li><strong>Chat History:</strong> Retained during active sessions and may be cleared when you 
            close the Extension or clear your browser data.</li>
            <li><strong>Usage Data:</strong> Aggregated and anonymized usage data may be retained for 
            service improvement purposes.</li>
            <li><strong>Technical Logs:</strong> Retained for a limited period to diagnose issues and 
            improve service reliability.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>9. International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your country of 
            residence. These countries may have data protection laws that differ from those in your country.
          </p>
          <p>
            When we transfer your information internationally, we take steps to ensure that appropriate 
            safeguards are in place to protect your information in accordance with this Privacy Policy.
          </p>
        </section>

        <section className={styles.section}>
          <h2>10. Children's Privacy</h2>
          <p>
            We recognize that Xplaino can be a valuable educational tool for children who are learning to 
            read and comprehend online materials and webpages. The Extension's features—including instant 
            word meanings, text explanations, and summaries—can help young readers understand complex 
            content and enhance their learning experience.
          </p>
          <p>
            <strong>Parental Consent Required:</strong> For children under the age of 13, we require parental 
            or guardian consent before using the Extension. Parents and guardians should supervise their 
            child's use of the Extension and review this Privacy Policy to understand what information is 
            collected and how it is used.
          </p>
          <p>
            <strong>Educational Use:</strong> When used by children for educational purposes, the Extension 
            collects only the information necessary to provide its reading assistance features, such as 
            selected words or text passages for explanations and summaries.
          </p>
          <p>
            <strong>Parental Controls:</strong> Parents and guardians can:
          </p>
          <ul>
            <li>Monitor their child's use of the Extension</li>
            <li>Review and delete bookmarked words and saved content</li>
            <li>Disable or uninstall the Extension at any time</li>
            <li>Contact us to request deletion of any data collected from their child</li>
          </ul>
          <p>
            If you are a parent or guardian and believe your child under 13 has used the Extension without 
            your consent, or if you have any concerns about your child's privacy, please contact us 
            immediately at support@xplaino.com.
          </p>
        </section>

        <section className={styles.section}>
          <h2>11. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices, 
            technology, legal requirements, or other factors. We will notify you of any material changes 
            by:
          </p>
          <ul>
            <li>Posting the updated Privacy Policy on this page</li>
            <li>Updating the "Last Updated" date at the top of this policy</li>
            <li>Providing notice through the Extension interface for significant changes</li>
          </ul>
          <p>
            Your continued use of the Extension after any changes to this Privacy Policy constitutes your 
            acceptance of the updated policy.
          </p>
        </section>

        <section className={styles.section}>
          <h2>12. California Privacy Rights</h2>
          <p>
            If you are a California resident, you have additional rights under the California Consumer 
            Privacy Act (CCPA):
          </p>
          <ul>
            <li>The right to know what personal information we collect, use, and disclose</li>
            <li>The right to delete personal information we have collected</li>
            <li>The right to opt-out of the sale of personal information (we do not sell your personal 
            information)</li>
            <li>The right to non-discrimination for exercising your privacy rights</li>
          </ul>
          <p>
            To exercise these rights, please contact us using the information provided in the Contact 
            section below.
          </p>
        </section>

        <section className={styles.section}>
          <h2>13. GDPR Rights (European Users)</h2>
          <p>
            If you are located in the European Economic Area (EEA), you have certain rights under the 
            General Data Protection Regulation (GDPR):
          </p>
          <ul>
            <li><strong>Right of Access:</strong> Request a copy of your personal data</li>
            <li><strong>Right to Rectification:</strong> Request correction of inaccurate data</li>
            <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
            <li><strong>Right to Restrict Processing:</strong> Request limitation of data processing</li>
            <li><strong>Right to Data Portability:</strong> Request transfer of your data</li>
            <li><strong>Right to Object:</strong> Object to processing of your personal data</li>
          </ul>
          <p>
            To exercise these rights, please contact us using the information provided in the Contact 
            section below.
          </p>
        </section>

        <section className={styles.section}>
          <h2>14. Contact Us</h2>
          <p>
            If you have any questions, concerns, or requests regarding this Privacy Policy or our data 
            practices, please contact us:
          </p>
          <div className={styles.contactInfo}>
            <p><strong>General Support:</strong> support@xplaino.com</p>
            <p><strong>Website:</strong> <a href="https://www.xplaino.com" className={styles.link}>www.xplaino.com</a></p>
          </div>
          <p>
            We will respond to your inquiry within a reasonable timeframe and in accordance with applicable 
            privacy laws.
          </p>
        </section>
      </div>
    </div>
  );
};

PrivacyPolicy.displayName = 'PrivacyPolicy';
