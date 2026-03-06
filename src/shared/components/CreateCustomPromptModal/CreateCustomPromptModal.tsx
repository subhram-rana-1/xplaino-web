import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { X, Loader2, Bold, Italic, List, ListOrdered } from 'lucide-react';
import styles from './CreateCustomPromptModal.module.css';
import { createCustomPrompt } from '@/shared/services/customPrompt.service';
import type { CustomPromptResponse } from '@/shared/types/customPrompt.types';
import { Toast } from '@/shared/components/Toast';

export const EXAMPLE_PROMPT_HTML = 
`<p>Analyze the selected text as a research professional and provide:</p>
<ul>
<li><strong>Key Findings</strong>: Extract the main conclusions and contributions</li>
<li><strong>Methodology Notes</strong>: Identify the research approach and study design</li>
<li><strong>Evidence Quality</strong>: Assess the strength of evidence and potential biases</li>
<li><strong>Research Gaps</strong>: Highlight open questions or areas needing further investigation</li>
<li><strong>Implications</strong>: Describe the broader scientific or practical impact</li>
</ul>
<p>Respond in a structured, <em>academic tone</em> suitable for peer review.</p>`;

// ─── Rich Text Editor (self-contained) ────────────────────────────────────────

interface RichTextEditorProps {
  initialContent?: string;
  placeholder?: string;
  onChange: (html: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialContent = '',
  placeholder = 'Prompt description / content…',
  onChange,
}) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    autofocus: false,
    editorProps: {
      attributes: { 'data-placeholder': placeholder },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    },
  });

  useEffect(() => () => { editor?.destroy(); }, [editor]);

  if (!editor) return null;

  return (
    <div className={styles.editorWrapper}>
      <div className={styles.editorToolbar}>
        <button
          type="button"
          className={`${styles.toolbarBtn} ${editor.isActive('bold') ? styles.toolbarBtnActive : ''}`}
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
          title="Bold"
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          className={`${styles.toolbarBtn} ${editor.isActive('italic') ? styles.toolbarBtnActive : ''}`}
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
          title="Italic"
        >
          <Italic size={14} />
        </button>
        <div className={styles.toolbarDivider} />
        <button
          type="button"
          className={`${styles.toolbarBtn} ${editor.isActive('bulletList') ? styles.toolbarBtnActive : ''}`}
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}
          title="Bullet list"
        >
          <List size={14} />
        </button>
        <button
          type="button"
          className={`${styles.toolbarBtn} ${editor.isActive('orderedList') ? styles.toolbarBtnActive : ''}`}
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }}
          title="Numbered list"
        >
          <ListOrdered size={14} />
        </button>
      </div>
      <EditorContent editor={editor} className={styles.editorContent} />
    </div>
  );
};

// ─── Modal ────────────────────────────────────────────────────────────────────

export interface CreateCustomPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (prompt: CustomPromptResponse) => void;
}

export const CreateCustomPromptModal: React.FC<CreateCustomPromptModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [title, setTitle] = useState('Research Analysis Framework');
  const [description, setDescription] = useState(EXAMPLE_PROMPT_HTML);
  const [editorKey, setEditorKey] = useState(0);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle('Research Analysis Framework');
      setDescription(EXAMPLE_PROMPT_HTML);
      setEditorKey(k => k + 1);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      setCreating(true);
      const created = await createCustomPrompt({ title: title.trim(), description });
      setToast({ message: 'Prompt created', type: 'success' });
      onCreated?.(created);
      onClose();
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Failed to create prompt', type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>New Custom Prompt</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="cpm-title">Title</label>
            <input
              id="cpm-title"
              className={styles.input}
              placeholder="e.g. Research Analysis Framework"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Description</label>
            <p className={styles.hint}>
              This is an example for a research professional — edit or replace it with your own prompt.
            </p>
            <RichTextEditor
              key={editorKey}
              initialContent={EXAMPLE_PROMPT_HTML}
              placeholder="Prompt description / content…"
              onChange={setDescription}
            />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.saveBtn} disabled={creating || !title.trim()}>
              {creating && <Loader2 size={14} className={styles.spin} />}
              Create Prompt
            </button>
          </div>
        </form>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>,
    document.body
  );
};

CreateCustomPromptModal.displayName = 'CreateCustomPromptModal';
