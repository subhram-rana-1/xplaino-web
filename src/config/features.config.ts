const CHROME_STORE_URL = 'https://chromewebstore.google.com/detail/xplaino/nmphalmbdmddagbllhjnfnmodfmbnlkp';
const PROMO_VIDEO_URL = 'https://bmicorrect.com/website/website_1902_720_2.webm';

export type FeatureCategory = 'webpage' | 'pdf';
export type CtaAction = 'extension' | 'pdf';

export interface FeatureConfig {
  slug: string;
  route: string;
  category: FeatureCategory;
  /** Short name shown in the navbar dropdown item title */
  navTitle: string;
  /** Short keyword-rich description shown in the navbar dropdown */
  navDescription: string;
  /** Main H1 heading on the landing page */
  heading: string;
  /** The teal gradient span wraps this substring of the heading (must be exact substring) */
  headingHighlight: string;
  /** 2-3 sentence keyword-rich description shown below the H1 */
  description: string;
  /** Teal tagline below the description */
  tagline: string;
  /** Full CTA button label */
  ctaLabel: string;
  /** What the CTA does */
  ctaAction: CtaAction;
  /** URL for the autoplay video */
  videoUrl: string;
  /** Video modal title */
  videoTitle: string;
  /** Extra chip labels shown in the "more features" grid alongside other feature cards */
  additionalChips?: string[];
}

export const FEATURES: FeatureConfig[] = [
  // ── Webpage features ──────────────────────────────────────────────────────
  {
    slug: 'chat-with-webpage',
    route: '/features/chat-with-webpage',
    category: 'webpage',
    navTitle: 'Chat with Webpage',
    navDescription: 'Ask anything about any page without reading it. Setup question once & reuse. Ask on any selected text and get instant answers',
    heading: 'Chat with Webpage — Ask AI Questions Right on the Page',
    headingHighlight: 'Ask AI Questions Right on the Page',
    description:
      'Turn any webpage into an interactive conversation. Ask questions about the content, annotate text, and get instant AI-powered answers without ever leaving the tab. Understand complex articles, research papers, and documentation in seconds — no copy-pasting required.',
    tagline: 'Your AI reading companion, active on every page you visit.',
    ctaLabel: 'Start Chatting with Pages — Install Extension',
    ctaAction: 'extension',
    videoUrl: PROMO_VIDEO_URL,
    videoTitle: 'Chat with Any Webpage — Xplaino AI Extension',
    additionalChips: ['Custom AI Prompts'],
  },
  {
    slug: 'web-highlighter-notes',
    route: '/features/web-highlighter-notes',
    category: 'webpage',
    navTitle: 'Web Highlighter & Notes',
    navDescription: 'Highlight text, add notes that got auto saved right on the page forever. Share and collaborate with others',
    heading: 'Highlight Text & Take Notes on Any Website',
    headingHighlight: 'Take Notes on Any Website',
    description:
      'Highlight the text that matters most on any webpage, add contextual comments right where they belong, and have everything auto-saved to your personal dashboard for later review. Share your highlights and collaborate with teammates or classmates — all in real time, without switching tools.',
    tagline: 'Stop losing your best insights. Capture them the moment they happen.',
    ctaLabel: 'Start Highlighting — Install Extension',
    ctaAction: 'extension',
    videoUrl: PROMO_VIDEO_URL,
    videoTitle: 'Web Highlighter & Notes — Xplaino AI Extension',
    additionalChips: ['Custom AI Prompts'],
  },
  {
    slug: 'chat-with-image',
    route: '/features/chat-with-image',
    category: 'webpage',
    navTitle: 'Chat with Images in context',
    navDescription: 'Ask AI about any image in context without downloading it. Setup quesiton once and reuse everytime. Save images to dashboard and share with others',
    heading: 'Chat with Any Image on the Web — AI Visual Understanding',
    headingHighlight: 'AI Visual Understanding',
    description:
      'Point Xplaino at any image on any webpage — charts, diagrams, infographics, screenshots — and ask AI exactly what you want to know. Get clear, contextual explanations without downloading or switching apps. Turn ambiguous visuals into crystal-clear knowledge instantly.',
    tagline: 'See more, understand faster. Every image becomes a conversation.',
    ctaLabel: 'Ask AI About Images — Install Extension',
    ctaAction: 'extension',
    videoUrl: PROMO_VIDEO_URL,
    videoTitle: 'Chat with Web Images — Xplaino AI Extension',
    additionalChips: ['Custom AI Prompts'],
  },
  {
    slug: 'web-bookmarks',
    route: '/features/web-bookmarks',
    category: 'webpage',
    navTitle: 'Smart Web Bookmarks',
    navDescription: 'Save pages, images, and text to your knowledge base. Build your second brain.',
    heading: 'Smart Bookmarks — Save Pages, Images & Text to Your Knowledge Base',
    headingHighlight: 'Save Pages, Images & Text to Your Knowledge Base',
    description:
      'Go far beyond basic bookmarks. Save entire webpages, specific images, selected text snippets, and key phrases to your personal Xplaino dashboard in one click. Build a structured, searchable knowledge system that captures everything you discover online — organized exactly the way you think.',
    tagline: 'Research smarter. Your second brain starts with a single save.',
    ctaLabel: 'Start Saving Smarter — Install Extension',
    ctaAction: 'extension',
    videoUrl: PROMO_VIDEO_URL,
    videoTitle: 'Smart Web Bookmarks — Xplaino AI Extension',
    additionalChips: ['Custom AI Prompts'],
  },
  {
    slug: 'knowledge-dashboard',
    route: '/features/knowledge-dashboard',
    category: 'webpage',
    navTitle: 'Knowledge Dashboard',
    navDescription: 'Organize webpages, images, highlights, and notes — all with source references.',
    heading: 'Your Personal Knowledge Dashboard — Organize Everything You Learn Online',
    headingHighlight: 'Organize Everything You Learn Online',
    description:
      "All your saved webpages, images, highlights, and notes — unified in one powerful dashboard, each item linked back to its original source. Track your research, search across everything you've ever saved, and revisit key insights on demand. Stop juggling browser tabs and scattered notes.",
    tagline: 'One place for everything you know. Never lose a great idea again.',
    ctaLabel: 'Organize Your Research — Install Extension',
    ctaAction: 'extension',
    videoUrl: PROMO_VIDEO_URL,
    videoTitle: 'Knowledge Dashboard — Xplaino AI Extension',
    additionalChips: ['Custom AI Prompts'],
  },

  // ── PDF features ──────────────────────────────────────────────────────────
  {
    slug: 'chat-with-pdf',
    route: '/features/chat-with-pdf',
    category: 'pdf',
    navTitle: 'Chat PDF',
    navDescription: 'Ask anything about PDF without reading it, Setup question once & reuse, Ask on any selected text and get instant answers, Share conversations with others and collaborate.',
    heading: 'Chat with PDF — AI-Powered PDF Reader & Annotator',
    headingHighlight: 'AI-Powered PDF Reader & Annotator',
    description:
      'Upload any PDF and start asking questions instantly. Build custom prompts once, reuse them every time. Highlight key text, add personal notes, and share your annotated PDF with teammates to collaborate.',
    tagline: 'Stop reading passively. Start having a conversation with your PDF.',
    ctaLabel: 'Start Chatting — Upload PDF',
    ctaAction: 'pdf',
    videoUrl: PROMO_VIDEO_URL,
    videoTitle: 'Chat with PDF — Xplaino AI PDF Reader',
    additionalChips: ['Share Document', 'Collaborate in Real Time', 'Add Comments & Replies', 'Saved Chat History', 'Custom AI Prompts'],
  },
  {
    slug: 'pdf-highlighter-notes',
    route: '/features/pdf-highlighter-notes',
    category: 'pdf',
    navTitle: 'PDF Highlighter & Notes',
    navDescription: 'Highlight text, add personal notes & comments, Share your work with others and collaborate',
    heading: 'Highlight & Annotate PDFs — Collaborative PDF Notes Made Easy',
    headingHighlight: 'Collaborative PDF Notes Made Easy',
    description:
      'Highlight key passages, add personal notes in the margin, and leave pinned comments on any PDF. Invite classmates or colleagues to annotate alongside you — all annotations sync in real time across every device. Your notes are always there, exactly where you left them.',
    tagline: 'Annotate smarter. Study together. Retain more.',
    ctaLabel: 'Start Highlighting — Upload PDF',
    ctaAction: 'pdf',
    videoUrl: PROMO_VIDEO_URL,
    videoTitle: 'PDF Highlighter & Notes — Xplaino AI PDF Tool',
    additionalChips: ['Share Document', 'Collaborate in Real Time', 'Add Comments & Replies', 'AI PDF Chat', 'Custom AI Prompts'],
  },
];

export const WEBPAGE_FEATURES = FEATURES.filter((f) => f.category === 'webpage');
export const PDF_FEATURES = FEATURES.filter((f) => f.category === 'pdf');

export function getFeatureBySlug(slug: string): FeatureConfig | undefined {
  return FEATURES.find((f) => f.slug === slug);
}

export { CHROME_STORE_URL };
