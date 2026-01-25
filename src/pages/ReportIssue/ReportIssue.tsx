import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ReportIssue.module.css';
import { DropdownIcon } from '@/shared/components/DropdownIcon';
import { useAuth } from '@/shared/hooks/useAuth';
import { reportIssue } from '@/shared/services/issues.service';
import { IssueType } from '@/shared/types/issues.types';
import { Toast } from '@/shared/components/Toast';
import { LoginModal } from '@/shared/components/LoginModal';

const ISSUE_TYPES_REQUIRING_URL = [IssueType.GLITCH];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const MAX_FILES = 3; // Maximum number of files allowed

interface FormErrors {
  issueType?: string;
  heading?: string;
  description?: string;
  webpageUrl?: string;
  files?: string;
}

/**
 * ReportIssue - Report Issue page component
 * 
 * @returns JSX element
 */
export const ReportIssue: React.FC = () => {
  const { isLoggedIn, accessToken } = useAuth();
  const navigate = useNavigate();
  const [issueType, setIssueType] = useState<IssueType | ''>('');
  const [heading, setHeading] = useState('');
  const [description, setDescription] = useState('');
  const [webpageUrl, setWebpageUrl] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const requiresUrl = issueType && ISSUE_TYPES_REQUIRING_URL.includes(issueType as IssueType);

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateFile = (file: File): string | null => {
    // Check file type
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    
    if (!isImage && !isPdf) {
      return 'Only images and PDFs are allowed';
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 5MB';
    }

    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newErrors: FormErrors = { ...errors };
    const validFiles: File[] = [];

    // Check if adding these files would exceed the maximum
    if (files.length + selectedFiles.length > MAX_FILES) {
      newErrors.files = `You can upload a maximum of ${MAX_FILES} files`;
      setErrors(newErrors);
      e.target.value = '';
      return;
    }

    selectedFiles.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        newErrors.files = error;
      } else {
        validFiles.push(file);
      }
    });

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
      delete newErrors.files;
    }

    setErrors(newErrors);
    // Reset input to allow selecting the same file again
    e.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!issueType) {
      newErrors.issueType = 'Issue type is required';
    }

    if (heading.trim().length > 100) {
      newErrors.heading = 'Heading must be less than 100 characters';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (requiresUrl && !webpageUrl.trim()) {
      newErrors.webpageUrl = 'Webpage URL is required for this issue type';
    } else if (requiresUrl && webpageUrl.trim() && !validateUrl(webpageUrl)) {
      newErrors.webpageUrl = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !isLoggedIn || !accessToken) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare API payload
      const payload = {
        type: issueType as IssueType,
        heading: heading.trim() || null,
        description: description.trim(),
        webpage_url: requiresUrl && webpageUrl.trim() ? webpageUrl.trim() : null,
      };

      await reportIssue(accessToken, payload, files.length > 0 ? files : undefined);

      // Show success modal instead of redirecting
      setShowSuccessModal(true);
      setIsSubmitting(false);
    } catch (error) {
      console.error('Error reporting issue:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to report issue';
      setToast({ message: errorMessage, type: 'error' });
      setIsSubmitting(false);
    }
  };

  const issueTypeOptions = [
    { value: IssueType.GLITCH, label: 'Extension not working properly' },
    { value: IssueType.SUBSCRIPTION, label: 'Subscription related issue' },
    { value: IssueType.AUTHENTICATION, label: 'Login related issue' },
    { value: IssueType.FEATURE_REQUEST, label: 'Request a new feature' },
    { value: IssueType.OTHERS, label: 'Others, I will describe' },
  ];

  const selectedLabel = issueType 
    ? issueTypeOptions.find(opt => opt.value === issueType)?.label || 'Select issue type'
    : 'Select issue type';

  const handleSelectOption = (value: IssueType) => {
    setIssueType(value);
    setErrors((prev) => ({ ...prev, issueType: undefined }));
    setIsDropdownOpen(false);
    // Clear URL when issue type changes
    if (!ISSUE_TYPES_REQUIRING_URL.includes(value)) {
      setWebpageUrl('');
    }
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(`.${styles.dropdownContainer}`)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  if (!isLoggedIn) {
    return <LoginModal actionText="report an issue" />;
  }

  return (
    <div className={styles.reportIssue}>
      <div className={styles.container}>
        <form 
          className={styles.form}
          onSubmit={handleSubmit}
        >
          <h1 className={styles.heading}>Report an Issue</h1>
          
          {/* Issue Type */}
          <div className={styles.fieldGroup}>
            <label htmlFor="issueType" className={styles.label}>
              Issue Type <span className={styles.required}>*</span>
            </label>
            <div className={styles.dropdownContainer}>
              <input
                type="hidden"
                value={issueType}
                required
              />
              <button
                type="button"
                id="issueType"
                className={`${styles.dropdownButton} ${errors.issueType ? styles.inputError : ''} ${isDropdownOpen ? styles.dropdownButtonOpen : ''}`}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-haspopup="listbox"
                aria-expanded={isDropdownOpen}
              >
                <span className={styles.dropdownButtonText}>{selectedLabel}</span>
                <DropdownIcon isOpen={isDropdownOpen} />
              </button>
              {isDropdownOpen && (
                <div className={styles.dropdownList} role="listbox">
                  {issueTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`${styles.dropdownOption} ${issueType === option.value ? styles.dropdownOptionSelected : ''}`}
                      onClick={() => handleSelectOption(option.value)}
                      role="option"
                      aria-selected={issueType === option.value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.issueType && <span className={styles.errorMessage}>{errors.issueType}</span>}
          </div>

          {/* Heading - Optional */}
          <div className={styles.fieldGroup}>
            <label htmlFor="heading" className={styles.label}>
              Heading <span className={styles.optional}>(Optional)</span>
            </label>
            <input
              id="heading"
              type="text"
              className={`${styles.input} ${errors.heading ? styles.inputError : ''}`}
              value={heading}
              onChange={(e) => {
                setHeading(e.target.value);
                setErrors((prev) => ({ ...prev, heading: undefined }));
              }}
              placeholder="Brief summary of the issue"
              maxLength={100}
            />
            {errors.heading && <span className={styles.errorMessage}>{errors.heading}</span>}
          </div>

          {/* Webpage URL - Conditional */}
          {requiresUrl && (
            <div className={`${styles.fieldGroup} ${styles.fieldGroupVisible}`}>
              <label htmlFor="webpageUrl" className={styles.label}>
                Webpage URL <span className={styles.required}>*</span>
              </label>
              <span className={styles.helperText}>The webpage where you are facing issue</span>
              <input
                id="webpageUrl"
                type="url"
                className={`${styles.input} ${errors.webpageUrl ? styles.inputError : ''}`}
                value={webpageUrl}
                onChange={(e) => {
                  setWebpageUrl(e.target.value);
                  setErrors((prev) => ({ ...prev, webpageUrl: undefined }));
                }}
                placeholder="https://example.com/page"
                required
              />
              {errors.webpageUrl && <span className={styles.errorMessage}>{errors.webpageUrl}</span>}
            </div>
          )}

          {/* Description */}
          <div className={styles.fieldGroup}>
            <label htmlFor="description" className={styles.label}>
              Description <span className={styles.required}>*</span>
            </label>
            <textarea
              id="description"
              className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setErrors((prev) => ({ ...prev, description: undefined }));
              }}
              placeholder="Please describe the issue you're experiencing..."
              rows={8}
              required
            />
            {errors.description && <span className={styles.errorMessage}>{errors.description}</span>}
          </div>

          {/* File Attachment - Hidden from UI */}
          <div className={styles.fieldGroup} style={{ display: 'none' }}>
            <label htmlFor="fileAttachment" className={styles.label}>
              File Attachment <span className={styles.optional}>(Optional)</span>
            </label>
            <div className={styles.fileUploadArea}>
              <input
                id="fileAttachment"
                type="file"
                className={styles.fileInput}
                accept="image/*,.pdf"
                multiple
                onChange={handleFileChange}
                disabled={files.length >= MAX_FILES}
              />
              <label 
                htmlFor="fileAttachment" 
                className={`${styles.fileInputLabel} ${files.length >= MAX_FILES ? styles.fileInputLabelDisabled : ''}`}
              >
                <span className={styles.fileInputText}>Choose files or drag and drop</span>
                <span className={styles.fileInputHint}>Accepted: Images, PDFs (Max 5MB per file, up to 3 files)</span>
              </label>
            </div>
            {errors.files && <span className={styles.errorMessage}>{errors.files}</span>}
            
            {/* File List */}
            {files.length > 0 && (
              <div className={styles.fileList}>
                {files.map((file, index) => (
                  <div key={index} className={styles.fileItem}>
                    <span className={styles.fileName}>{file.name}</span>
                    <button
                      type="button"
                      className={styles.removeFileButton}
                      onClick={() => handleRemoveFile(index)}
                      aria-label={`Remove ${file.name}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>

        {/* Success Modal */}
        {showSuccessModal && (
          <div className={styles.successModalOverlay}>
            <div className={styles.successModalContent}>
              <div className={styles.successIcon}>✓</div>
              <h2 className={styles.successTitle}>Issue Reported Successfully!</h2>
              <p className={styles.successMessage}>
                Thank you for bringing this to our attention. Our team will review your issue and work on resolving it as soon as possible.
              </p>
              <div className={styles.successActions}>
                <button 
                  className={styles.successButtonPrimary}
                  onClick={() => navigate('/user/issues')}
                >
                  View All My Issues
                </button>
                <div className={styles.successActionsRow}>
                  <button 
                    className={styles.successButtonText}
                    onClick={() => navigate('/user/dashboard')}
                  >
                    Back to Dashboard
                  </button>
                  <button 
                    className={styles.successButtonText}
                    onClick={() => {
                      setShowSuccessModal(false);
                      // Reset form
                      setIssueType('');
                      setHeading('');
                      setDescription('');
                      setWebpageUrl('');
                      setFiles([]);
                    }}
                  >
                    Report Another Issue
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
};

ReportIssue.displayName = 'ReportIssue';

