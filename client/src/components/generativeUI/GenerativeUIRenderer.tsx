/**
 * GenerativeUIRenderer.tsx
 *
 * Orchestrator component that replaces MarkdownRender when the AI response
 * contains <ui-component> tags. It splits the text into alternating
 * Markdown and rich React component chunks.
 *
 * If no <ui-component> tags are found, it passes through to MarkdownRender
 * with zero overhead (short-circuit).
 */
import React from 'react';
import MarkdownRender from '../../library/markdownRender';
import { parseGenerativeUI, hasUIComponents } from '../../utils/parseGenerativeUI';

// ── Component Registry ──
import DynamicCanvas from './DynamicCanvas';
import Sandbox from './Sandbox';

interface GenerativeUIRendererProps {
    text: string;
    isStreaming?: boolean;
}

/**
 * Maps a componentType string (from the AI) to a React component.
 * Dynamic layout system is the primary visual renderer.
 */
const COMPONENT_REGISTRY: Record<string, React.FC<{ data: any }>> = {
    'dynamic': DynamicCanvas,
    'sandbox': Sandbox,
};

const GenerativeUIRenderer: React.FC<GenerativeUIRendererProps> = ({ text, isStreaming }) => {
    // ── Short-circuit: if no UI tags, just render markdown directly ──
    if (!hasUIComponents(text)) {
        return <MarkdownRender text={text} isStreaming={isStreaming} />;
    }

    const chunks = parseGenerativeUI(text);

    return (
        <div className="flex flex-col gap-0">
            {chunks.map((chunk, idx) => {
                if (chunk.type === 'text' && chunk.content) {
                    return (
                        <MarkdownRender
                            key={`text-${idx}`}
                            text={chunk.content}
                            isStreaming={isStreaming}
                        />
                    );
                }

                if (chunk.type === 'component' && chunk.componentType) {
                    const Component = COMPONENT_REGISTRY[chunk.componentType];

                    if (Component) {
                        return <Component key={`ui-${idx}`} data={chunk.data} />;
                    }

                    // Unknown component type → render a subtle warning
                    return (
                        <div
                            key={`unknown-${idx}`}
                            className="text-[11px] text-amber-500/70 italic my-1 px-2"
                        >
                            ⚠ Componente sconosciuto: <code>{chunk.componentType}</code>
                        </div>
                    );
                }

                return null;
            })}
        </div>
    );
};

export default React.memo(GenerativeUIRenderer);
