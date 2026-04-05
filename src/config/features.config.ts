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
    slug: 'translate-webpage',
    route: '/features/translate-webpage',
    category: 'webpage',
    navTitle: 'Translate Webpage',
    navDescription: 'Translate any page into 50+ languages instantly. Bilingual reading, native-feel translations — perfect for language learners.',
    heading: 'Translate Any Webpage — Native-Feel Reading in 50+ Languages',
    headingHighlight: 'Native-Feel Reading in 50+ Languages',
    description:
      'Instantly translate any webpage into your language with a single click. Experience bilingual reading mode to learn while you read, or switch to full translation that feels like a native-language page. Perfect for language learners, international researchers, and anyone reading foreign-language content.',
    tagline: 'Read the world\'s web in your language.',
    ctaLabel: 'Translate Any Page — Install Extension',
    ctaAction: 'extension',
    videoUrl: PROMO_VIDEO_URL,
    videoTitle: 'Translate Webpage — Xplaino AI Extension',
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
    videoUrl: 'https://bmicorrect.com/website/features/videos/chat_with_image_v2.webm',
    videoTitle: 'Chat with Web Images — Xplaino AI Extension',
    additionalChips: ['Custom AI Prompts'],
  },
  {
    slug: 'bookmarks-dashboard',
    route: '/features/bookmarks-dashboard',
    category: 'webpage',
    navTitle: 'Bookmarks & Dashboard',
    navDescription: 'Save pages, images & text. Track your learnings on a personal dashboard. Share and collaborate.',
    heading: 'Bookmarks & Dashboard — Save, Organise & Track Everything You Learn Online',
    headingHighlight: 'Save, Organise & Track Everything You Learn Online',
    description:
      'Save any page link, image, or paragraph from the web in one click. Everything lands in your personal knowledge dashboard, organised by source and category. Track your learnings, revisit key insights on demand, and share your curated collection with teammates.',
    tagline: 'Your second brain starts with a single save.',
    ctaLabel: 'Build your knowledge base — Install Extension',
    ctaAction: 'extension',
    videoUrl: 'https://bmicorrect.com/website/features/videos/bookmark_v2.webm',
    videoTitle: 'Bookmarks & Dashboard — Xplaino AI Extension',
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
