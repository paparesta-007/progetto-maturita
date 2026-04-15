/**
 * parseGenerativeUI.ts
 * 
 * Splits an AI response string into alternating chunks of plain text
 * and structured UI component data.
 * 
 * The AI wraps rich components in XML-like tags:
 *   <ui-component type="info-card">{ ... JSON ... }</ui-component>
 * 
 * Everything outside those tags is treated as standard Markdown text.
 */

export interface ParsedChunk {
    type: 'text' | 'component';
    /** Raw markdown text (only when type === 'text') */
    content?: string;
    /** Identifier used to look up the React component (only when type === 'component') */
    componentType?: string;
    /** Parsed JSON payload for the component (only when type === 'component') */
    data?: any;
}

/**
 * Parse a raw AI response and split it into renderable chunks.
 * Falls back gracefully — if JSON inside a tag is malformed the
 * whole tag is returned as plain text so nothing is lost.
 */
export function parseGenerativeUI(text: string): ParsedChunk[] {
    if (!text) return [{ type: 'text', content: '' }];

    const uiRegex = /<ui-component\s+type="([^"]+)">([\s\S]*?)<\/ui-component>/g;
    const chunks: ParsedChunk[] = [];

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = uiRegex.exec(text)) !== null) {
        // ── Text before the component ──
        if (match.index > lastIndex) {
            const before = text.substring(lastIndex, match.index).trim();
            if (before) {
                chunks.push({ type: 'text', content: before });
            }
        }

        // ── The component itself ──
        try {
            const data = JSON.parse(match[2].trim());
            chunks.push({ type: 'component', componentType: match[1], data });
        } catch {
            // JSON broken → render the raw tag as markdown so nothing disappears
            chunks.push({ type: 'text', content: match[0] });
        }

        lastIndex = uiRegex.lastIndex;
    }

    // ── Remaining text after the last component ──
    if (lastIndex < text.length) {
        const remaining = text.substring(lastIndex);
        if (remaining.trim()) {
            chunks.push({ type: 'text', content: remaining });
        }
    }

    // If nothing was found at all, just return the whole text
    if (chunks.length === 0) {
        chunks.push({ type: 'text', content: text });
    }

    return chunks;
}

/**
 * Quick check: does the text contain at least one <ui-component> block?
 * Useful for skipping the full parse when not needed.
 */
export function hasUIComponents(text: string): boolean {
    return /<ui-component\s+type="[^"]+">/i.test(text);
}
