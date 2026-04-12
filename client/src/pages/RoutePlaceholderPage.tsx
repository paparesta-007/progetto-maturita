import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, Sparkles } from 'lucide-react';

const ROUTE_COPY: Record<string, { title: string; subtitle: string }> = {
  '/roadmap': {
    title: 'Roadmap',
    subtitle: 'The next Smart AI milestones and upcoming classroom-first improvements.'
  },
  '/resources': {
    title: 'Resources',
    subtitle: 'Guides, starter materials, and study assets curated for students.'
  },
  '/changelog': {
    title: 'Changelog',
    subtitle: 'A running feed of product updates and feature improvements.'
  }
};

export default function RoutePlaceholderPage() {
  const { pathname } = useLocation();
  const page = ROUTE_COPY[pathname] ?? {
    title: 'Coming Soon',
    subtitle: 'This page is being prepared and will be available soon.'
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-mono text-stone-500 hover:text-orange-600 transition-colors"
        >
          <ChevronLeft size={16} />
          Back to landing
        </Link>

        <div className="mt-10 bg-white border border-stone-200 rounded-2xl p-8 md:p-12 shadow-sm">
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center mb-6">
            <Sparkles size={18} className="text-white" />
          </div>
          <p className="text-xs uppercase tracking-widest text-orange-600 font-mono mb-3">Temporary Route</p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">{page.title}</h1>
          <p className="text-stone-600 font-mono max-w-2xl">{page.subtitle}</p>
        </div>
      </div>
    </div>
  );
}
