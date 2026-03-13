import React, { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Plus,
  Pencil,
  Trash2,
  Share2,
  EyeOff,
  Eye,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  Bold,
  Italic,
  List,
  ListOrdered,
} from 'lucide-react';
import styles from './CustomPromptTab.module.css';
import { Toast } from '@/shared/components/Toast';
import { EXAMPLE_PROMPT_HTML } from '@/shared/components/CreateCustomPromptModal';
import type {
  CustomPromptResponse,
  CustomPromptShareResponse,
} from '@/shared/types/customPrompt.types';
import {
  createCustomPrompt,
  listCustomPrompts,
  updateCustomPrompt,
  setCustomPromptHidden,
  deleteCustomPrompt,
  shareCustomPrompt,
  listReceivedShares,
  deleteReceivedShare,
  setReceivedShareHidden,
} from '@/shared/services/customPrompt.service';

const PAGE_SIZE = 20;

// ─── Rich Text Editor ──────────────────────────────────────────────────────────

interface RichTextEditorProps {
  initialContent?: string;
  placeholder?: string;
  onChange: (html: string) => void;
  autoFocus?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialContent = '',
  placeholder = 'Prompt description / content…',
  onChange,
  autoFocus = false,
}) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    autofocus: autoFocus ? 'end' : false,
    editorProps: {
      attributes: {
        'data-placeholder': placeholder,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Treat an empty paragraph as empty string
      onChange(html === '<p></p>' ? '' : html);
    },
  });

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

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

// ─── Main Component ────────────────────────────────────────────────────────────

export const CustomPromptTab: React.FC = () => {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // ─── My Prompts State ────────────────────────────────────────────────────────
  const [myPrompts, setMyPrompts] = useState<CustomPromptResponse[]>([]);
  const [myTotal, setMyTotal] = useState(0);
  const [myOffset, setMyOffset] = useState(0);
  const [myLoading, setMyLoading] = useState(true);
  const [myLoadingMore, setMyLoadingMore] = useState(false);
  const [mySectionOpen, setMySectionOpen] = useState(true);
  const [hiddenSectionOpen, setHiddenSectionOpen] = useState(false);

  // Create form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormKey, setCreateFormKey] = useState(0); // used to remount editor on reset
  const [createTitle, setCreateTitle] = useState('Research Analysis Framework');
  const [createDescription, setCreateDescription] = useState(EXAMPLE_PROMPT_HTML);
  const [creating, setCreating] = useState(false);

  // Edit form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Hiding
  const [hidingId, setHidingId] = useState<string | null>(null);

  // Share modal
  const [sharePromptId, setSharePromptId] = useState<string | null>(null);
  const [shareUserId, setShareUserId] = useState('');
  const [sharing, setSharing] = useState(false);

  // ─── Received Shares State ───────────────────────────────────────────────────
  const [receivedShares, setReceivedShares] = useState<CustomPromptShareResponse[]>([]);
  const [receivedTotal, setReceivedTotal] = useState(0);
  const [receivedOffset, setReceivedOffset] = useState(0);
  const [receivedLoading, setReceivedLoading] = useState(true);
  const [receivedLoadingMore, setReceivedLoadingMore] = useState(false);
  const [receivedSectionOpen, setReceivedSectionOpen] = useState(true);

  const [removingShareId, setRemovingShareId] = useState<string | null>(null);
  const [hidingShareId, setHidingShareId] = useState<string | null>(null);

  // ─── Load My Prompts ─────────────────────────────────────────────────────────
  const loadMyPrompts = useCallback(async (offset: number, append: boolean) => {
    try {
      append ? setMyLoadingMore(true) : setMyLoading(true);
      const data = await listCustomPrompts(offset, PAGE_SIZE);
      setMyPrompts(prev => append ? [...prev, ...data.prompts] : data.prompts);
      setMyTotal(data.total);
      setMyOffset(offset);
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Failed to load prompts', type: 'error' });
    } finally {
      append ? setMyLoadingMore(false) : setMyLoading(false);
    }
  }, []);

  // ─── Load Received Shares ────────────────────────────────────────────────────
  const loadReceivedShares = useCallback(async (offset: number, append: boolean) => {
    try {
      append ? setReceivedLoadingMore(true) : setReceivedLoading(true);
      const data = await listReceivedShares(offset, PAGE_SIZE);
      setReceivedShares(prev => append ? [...prev, ...data.shares] : data.shares);
      setReceivedTotal(data.total);
      setReceivedOffset(offset);
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Failed to load received prompts', type: 'error' });
    } finally {
      append ? setReceivedLoadingMore(false) : setReceivedLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMyPrompts(0, false);
    loadReceivedShares(0, false);
  }, [loadMyPrompts, loadReceivedShares]);

  // ─── Create ──────────────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim()) return;
    try {
      setCreating(true);
      const created = await createCustomPrompt({ title: createTitle.trim(), description: createDescription });
      setMyPrompts(prev => [created, ...prev]);
      setMyTotal(prev => prev + 1);
      setCreateTitle('Research Analysis Framework');
      setCreateDescription(EXAMPLE_PROMPT_HTML);
      setCreateFormKey(k => k + 1); // remount editor to clear it
      setShowCreateForm(false);
      setToast({ message: 'Prompt created', type: 'success' });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Failed to create prompt', type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const cancelCreate = () => {
    setShowCreateForm(false);
    setCreateTitle('Research Analysis Framework');
    setCreateDescription(EXAMPLE_PROMPT_HTML);
    setCreateFormKey(k => k + 1);
  };

  // ─── Edit ────────────────────────────────────────────────────────────────────
  const startEdit = (prompt: CustomPromptResponse) => {
    setEditingId(prompt.id);
    setEditTitle(prompt.title);
    setEditDescription(prompt.description);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditDescription('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      setSaving(true);
      const updated = await updateCustomPrompt(editingId, {
        title: editTitle.trim(),
        description: editDescription,
      });
      setMyPrompts(prev => prev.map(p => p.id === editingId ? updated : p));
      setEditingId(null);
      setToast({ message: 'Prompt updated', type: 'success' });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Failed to update prompt', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // ─── Hide / Unhide ───────────────────────────────────────────────────────────
  const handleToggleHide = async (prompt: CustomPromptResponse) => {
    try {
      setHidingId(prompt.id);
      const updated = await setCustomPromptHidden(prompt.id, !prompt.isHidden);
      setMyPrompts(prev => prev.map(p => p.id === prompt.id ? updated : p));
      setToast({ message: updated.isHidden ? 'Prompt hidden' : 'Prompt visible', type: 'success' });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Failed to update visibility', type: 'error' });
    } finally {
      setHidingId(null);
    }
  };

  // ─── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (promptId: string) => {
    try {
      setDeletingId(promptId);
      await deleteCustomPrompt(promptId);
      setMyPrompts(prev => prev.filter(p => p.id !== promptId));
      setMyTotal(prev => prev - 1);
      setToast({ message: 'Prompt deleted', type: 'success' });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Failed to delete prompt', type: 'error' });
    } finally {
      setDeletingId(null);
    }
  };

  // ─── Share ───────────────────────────────────────────────────────────────────
  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sharePromptId || !shareUserId.trim()) return;
    try {
      setSharing(true);
      await shareCustomPrompt(sharePromptId, { sharedToUserId: shareUserId.trim() });
      setSharePromptId(null);
      setShareUserId('');
      setToast({ message: 'Prompt shared successfully', type: 'success' });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Failed to share prompt', type: 'error' });
    } finally {
      setSharing(false);
    }
  };

  // ─── Received: Remove ────────────────────────────────────────────────────────
  const handleRemoveShare = async (shareId: string) => {
    try {
      setRemovingShareId(shareId);
      await deleteReceivedShare(shareId);
      setReceivedShares(prev => prev.filter(s => s.id !== shareId));
      setReceivedTotal(prev => prev - 1);
      setToast({ message: 'Prompt removed from received list', type: 'success' });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Failed to remove share', type: 'error' });
    } finally {
      setRemovingShareId(null);
    }
  };

  // ─── Received: Hide / Unhide ─────────────────────────────────────────────────
  const handleToggleShareHide = async (share: CustomPromptShareResponse) => {
    try {
      setHidingShareId(share.id);
      const updated = await setReceivedShareHidden(share.id, !share.isHidden);
      setReceivedShares(prev => prev.map(s => s.id === share.id ? updated : s));
      setToast({ message: updated.isHidden ? 'Share hidden' : 'Share visible', type: 'success' });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Failed to update visibility', type: 'error' });
    } finally {
      setHidingShareId(null);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className={styles.tab}>

      {/* ── My Prompts Section ──────────────────────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader} onClick={() => setMySectionOpen(o => !o)}>
          <div className={styles.sectionTitleGroup}>
            <h2 className={styles.sectionTitle}>My Prompts</h2>
            {myTotal > 0 && <span className={styles.badge}>{myTotal}</span>}
          </div>
          <div className={styles.sectionHeaderRight}>
            <button
              className={styles.newBtn}
              onClick={e => {
                e.stopPropagation();
                if (!showCreateForm) {
                  setCreateTitle('Research Analysis Framework');
                  setCreateDescription(EXAMPLE_PROMPT_HTML);
                  setCreateFormKey(k => k + 1);
                }
                setShowCreateForm(v => !v);
                setMySectionOpen(true);
              }}
              type="button"
            >
              <Plus size={15} />
              New
            </button>
            {mySectionOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>

        {mySectionOpen && (
          <div className={styles.sectionBody}>
            {/* Create Form */}
            {showCreateForm && (
              <form className={styles.createForm} onSubmit={handleCreate}>
                <p className={styles.createHint}>
                  This is a sample custom prompt — feel free to edit the title and content below and write your own.
                </p>
                <input
                  className={styles.input}
                  placeholder="Prompt title"
                  value={createTitle}
                  onChange={e => setCreateTitle(e.target.value)}
                  required
                  autoFocus
                />
                <RichTextEditor
                  key={createFormKey}
                  initialContent={EXAMPLE_PROMPT_HTML}
                  placeholder="Prompt description / content…"
                  onChange={setCreateDescription}
                />
                <div className={styles.formActions}>
                  <button type="button" className={styles.cancelBtn} onClick={cancelCreate}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.saveBtn} disabled={creating || !createTitle.trim()}>
                    {creating ? <Loader2 size={14} className={styles.spin} /> : null}
                    Create
                  </button>
                </div>
              </form>
            )}

            {/* Prompt List */}
            {myLoading ? (
              <div className={styles.loadingState}>
                <Loader2 size={20} className={styles.spin} />
                <span>Loading prompts…</span>
              </div>
            ) : myPrompts.filter(p => !p.isHidden).length === 0 && !showCreateForm ? (
              <div className={styles.emptyState}>
                No prompts yet. Create your first one above.
              </div>
            ) : (
              <div className={styles.cardList}>
                {myPrompts.filter(p => !p.isHidden).map(prompt => (
                  <div key={prompt.id} className={styles.card}>
                    {editingId === prompt.id ? (
                      <form className={styles.editForm} onSubmit={handleSaveEdit}>
                        <input
                          className={styles.input}
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          required
                          autoFocus
                        />
                        <RichTextEditor
                          key={`edit-${prompt.id}`}
                          initialContent={editDescription}
                          placeholder="Prompt description / content…"
                          onChange={setEditDescription}
                        />
                        <div className={styles.formActions}>
                          <button type="button" className={styles.cancelBtn} onClick={cancelEdit}>
                            Cancel
                          </button>
                          <button type="submit" className={styles.saveBtn} disabled={saving || !editTitle.trim()}>
                            {saving ? <Loader2 size={14} className={styles.spin} /> : null}
                            Save
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className={styles.cardTop}>
                          <div className={styles.cardTitleRow}>
                            <span className={styles.cardTitle}>{prompt.title}</span>
                          </div>
                          <div className={styles.cardActions}>
                            <button
                              className={styles.iconBtn}
                              title="Edit"
                              onClick={() => startEdit(prompt)}
                              type="button"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              className={styles.iconBtn}
                              title="Hide"
                              onClick={() => handleToggleHide(prompt)}
                              disabled={hidingId === prompt.id}
                              type="button"
                            >
                              {hidingId === prompt.id
                                ? <Loader2 size={15} className={styles.spin} />
                                : <EyeOff size={15} />}
                            </button>
                            <button
                              className={styles.iconBtn}
                              title="Share"
                              onClick={() => { setSharePromptId(prompt.id); setShareUserId(''); }}
                              type="button"
                            >
                              <Share2 size={15} />
                            </button>
                            <button
                              className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                              title="Delete"
                              onClick={() => handleDelete(prompt.id)}
                              disabled={deletingId === prompt.id}
                              type="button"
                            >
                              {deletingId === prompt.id
                                ? <Loader2 size={15} className={styles.spin} />
                                : <Trash2 size={15} />}
                            </button>
                          </div>
                        </div>
                        {prompt.description && (
                          <div
                            className={styles.cardDescriptionHtml}
                            dangerouslySetInnerHTML={{ __html: prompt.description }}
                          />
                        )}
                        <span className={styles.cardMeta}>
                          {new Date(prompt.updatedAt).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Hidden prompts subsection */}
            {!myLoading && myPrompts.some(p => p.isHidden) && (
              <div className={styles.hiddenSubsection}>
                <button
                  type="button"
                  className={styles.hiddenSubsectionHeader}
                  onClick={() => setHiddenSectionOpen(o => !o)}
                >
                  <EyeOff size={13} />
                  <span>Hidden ({myPrompts.filter(p => p.isHidden).length})</span>
                  {hiddenSectionOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                {hiddenSectionOpen && (
                  <div className={styles.hiddenSubsectionBody}>
                    {myPrompts.filter(p => p.isHidden).map(prompt => (
                      <div key={prompt.id} className={`${styles.card} ${styles.cardHidden}`}>
                        <div className={styles.cardTop}>
                          <div className={styles.cardTitleRow}>
                            <span className={styles.cardTitle}>{prompt.title}</span>
                          </div>
                          <div className={styles.cardActions}>
                            <button
                              className={styles.iconBtn}
                              title="Unhide"
                              onClick={() => handleToggleHide(prompt)}
                              disabled={hidingId === prompt.id}
                              type="button"
                            >
                              {hidingId === prompt.id
                                ? <Loader2 size={15} className={styles.spin} />
                                : <Eye size={15} />}
                            </button>
                          </div>
                        </div>
                        {prompt.description && (
                          <div
                            className={styles.cardDescriptionHtml}
                            dangerouslySetInnerHTML={{ __html: prompt.description }}
                          />
                        )}
                        <span className={styles.cardMeta}>
                          {new Date(prompt.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Load More */}
            {myPrompts.length < myTotal && (
              <button
                className={styles.loadMoreBtn}
                onClick={() => loadMyPrompts(myOffset + PAGE_SIZE, true)}
                disabled={myLoadingMore}
                type="button"
              >
                {myLoadingMore ? <Loader2 size={14} className={styles.spin} /> : null}
                Load more
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Received Prompts Section ─────────────────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader} onClick={() => setReceivedSectionOpen(o => !o)}>
          <div className={styles.sectionTitleGroup}>
            <h2 className={styles.sectionTitle}>Received Prompts</h2>
            {receivedTotal > 0 && <span className={styles.badge}>{receivedTotal}</span>}
          </div>
          {receivedSectionOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>

        {receivedSectionOpen && (
          <div className={styles.sectionBody}>
            {receivedLoading ? (
              <div className={styles.loadingState}>
                <Loader2 size={20} className={styles.spin} />
                <span>Loading received prompts…</span>
              </div>
            ) : receivedShares.length === 0 ? (
              <div className={styles.emptyState}>
                No prompts have been shared with you yet.
              </div>
            ) : (
              <div className={styles.cardList}>
                {receivedShares.map(share => (
                  <div key={share.id} className={`${styles.card} ${share.isHidden ? styles.cardHidden : ''}`}>
                    <div className={styles.cardTop}>
                      <div className={styles.cardTitleRow}>
                        <span className={styles.cardTitle}>{share.prompt.title}</span>
                        {share.isHidden && <span className={styles.hiddenBadge}>Hidden</span>}
                      </div>
                      <div className={styles.cardActions}>
                        <button
                          className={styles.iconBtn}
                          title={share.isHidden ? 'Unhide' : 'Hide'}
                          onClick={() => handleToggleShareHide(share)}
                          disabled={hidingShareId === share.id}
                          type="button"
                        >
                          {hidingShareId === share.id
                            ? <Loader2 size={15} className={styles.spin} />
                            : share.isHidden ? <Eye size={15} /> : <EyeOff size={15} />}
                        </button>
                        <button
                          className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                          title="Remove"
                          onClick={() => handleRemoveShare(share.id)}
                          disabled={removingShareId === share.id}
                          type="button"
                        >
                          {removingShareId === share.id
                            ? <Loader2 size={15} className={styles.spin} />
                            : <Trash2 size={15} />}
                        </button>
                      </div>
                    </div>
                    {share.prompt.description && (
                      <div
                        className={styles.cardDescriptionHtml}
                        dangerouslySetInnerHTML={{ __html: share.prompt.description }}
                      />
                    )}
                    <span className={styles.cardMeta}>
                      {new Date(share.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {receivedShares.length < receivedTotal && (
              <button
                className={styles.loadMoreBtn}
                onClick={() => loadReceivedShares(receivedOffset + PAGE_SIZE, true)}
                disabled={receivedLoadingMore}
                type="button"
              >
                {receivedLoadingMore ? <Loader2 size={14} className={styles.spin} /> : null}
                Load more
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Share Modal ──────────────────────────────────────────────────────── */}
      {sharePromptId && (
        <div className={styles.modalOverlay} onClick={() => setSharePromptId(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Share Prompt</h3>
              <button className={styles.modalClose} onClick={() => setSharePromptId(null)} type="button">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleShare}>
              <input
                className={styles.input}
                placeholder="Enter email to share with"
                value={shareUserId}
                onChange={e => setShareUserId(e.target.value)}
                required
                autoFocus
              />
              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setSharePromptId(null)}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn} disabled={sharing || !shareUserId.trim()}>
                  {sharing ? <Loader2 size={14} className={styles.spin} /> : null}
                  Share
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

CustomPromptTab.displayName = 'CustomPromptTab';
