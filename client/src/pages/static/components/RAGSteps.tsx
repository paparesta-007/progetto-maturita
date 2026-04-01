import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Scissors,
  Binary,
  Database,
  Search,
  BrainCircuit,
  MessageSquare,
  ArrowDown,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Step {
  id: number;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  description: string;
  detail: string;
  color: string;
  bgColor: string;
  borderColor: string;
  visual: React.ReactNode;
}

/* ─── Visual Demos for each step ─── */

const ChunkingVisual = () => {
  const chunks = [
    'Machine learning is a subset of AI...',
    'Neural networks consist of layers...',
    'Gradient descent optimizes weights...',
    'Transformers use attention to...',
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{
        padding: '10px 14px',
        background: 'rgba(250, 250, 250, 1)',
        border: '1px solid rgba(99, 102, 241, 0.15)',
        borderRadius: '10px',
        fontSize: '12px',
        color: '#6366f1',
        fontFamily: "'JetBrains Mono', monospace",
        lineHeight: 1.6,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          {chunks.map((chunk, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15, duration: 0.4 }}
              style={{
                padding: '4px 8px',
                marginBottom: '4px',
                background: i % 2 === 0 ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                borderRadius: '4px',
                borderLeft: '2px solid',
                borderColor: ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd'][i],
              }}
            >
              {chunk}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const EmbeddingVisual = () => {
  const vectors = [
    [0.82, -0.15, 0.43, 0.91, -0.33],
    [0.11, 0.76, -0.28, 0.55, 0.44],
    [-0.42, 0.33, 0.88, -0.12, 0.67],
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {vectors.map((vec, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.2, duration: 0.4 }}
          style={{
            display: 'flex',
            gap: '4px',
            alignItems: 'center',
          }}
        >
          <span style={{
            fontSize: '10px',
            color: '#818cf8',
            fontWeight: 600,
            minWidth: '18px',
          }}>
            v{i + 1}
          </span>
          <div style={{
            display: 'flex',
            gap: '2px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
          }}>
            <span style={{ color: 'rgba(0, 0, 0, 0.3)' }}>[</span>
            {vec.map((n, j) => (
              <span key={j} style={{
                padding: '2px 4px',
                borderRadius: '3px',
                background: n > 0 ? `rgba(99, 102, 241, ${Math.abs(n) * 0.2})` : `rgba(244, 63, 94, ${Math.abs(n) * 0.2})`,
                color: n > 0 ? '#6366f1' : '#fda4af',
              }}>
                {n.toFixed(2)}
              </span>
            ))}
            <span style={{ color: 'rgba(0, 0, 0, 0.3)' }}>]</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const VectorDBVisual = () => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px',
  }}>
    {[
      { id: 'idx_001', sim: '0.94' },
      { id: 'idx_042', sim: '0.87' },
      { id: 'idx_015', sim: '0.82' },
      { id: 'idx_108', sim: '0.31' },
    ].map((item, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.1, duration: 0.3 }}
        style={{
          padding: '8px 10px',
          background: i < 3 ? 'rgba(34, 211, 238, 0.06)' : 'rgba(255, 255, 255, 0.02)',
          border: `1px solid ${i < 3 ? 'rgba(34, 211, 238, 0.2)' : 'rgba(255, 255, 255, 0.05)'}`,
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          opacity: i < 3 ? 1 : 0.4,
        }}
      >
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '10px',
          color: '#525252',
        }}>
          {item.id}
        </span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '10px',
          fontWeight: 700,
          color: i < 3 ? '#22d3ee' : '#a3a3a3',
        }}>
          {item.sim}
        </span>
      </motion.div>
    ))}
  </div>
);

const PromptVisual = () => (
  <div style={{
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px',
    lineHeight: 1.8,
    color: '#525252',
  }}>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0 }}>
      <span style={{ color: '#c084fc' }}>system:</span>{' '}
      <span style={{ color: '#737373' }}>"You are a helpful assistant."</span>
    </motion.div>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
      <span style={{ color: '#22d3ee' }}>context:</span>{' '}
      <span style={{ color: '#6366f1' }}>[ retrieved_doc_1, retrieved_doc_2 ]</span>
    </motion.div>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
      <span style={{ color: '#4ade80' }}>user:</span>{' '}
      <span style={{ color: '#737373' }}>"How do transformers work?"</span>
    </motion.div>
  </div>
);

/* ─── Steps Data ─── */
const STEPS: Step[] = [
  {
    id: 1,
    icon: FileText,
    title: 'Document Ingestion',
    subtitle: 'Load your knowledge',
    description: 'Your documents (PDFs, text files, web pages) are loaded into the system. This is the raw knowledge base that the AI will draw from.',
    detail: 'The system accepts multiple formats: PDF, DOCX, TXT, Markdown, HTML, and even URLs. Each source is parsed and normalized into plain text for processing.',
    color: '#818cf8',
    bgColor: 'rgba(99, 102, 241, 0.08)',
    borderColor: 'rgba(99, 102, 241, 0.2)',
    visual: <div />,
  },
  {
    id: 2,
    icon: Scissors,
    title: 'Text Chunking',
    subtitle: 'Split into digestible pieces',
    description: 'Documents are split into smaller, overlapping chunks. This ensures that each piece of text carries enough context to be useful on its own.',
    detail: 'Common strategies include fixed-size chunking (e.g., 512 tokens), sentence-based splitting, and recursive splitting. Overlap between chunks (typically 10-20%) prevents losing context at boundaries.',
    color: '#a78bfa',
    bgColor: 'rgba(167, 139, 250, 0.08)',
    borderColor: 'rgba(167, 139, 250, 0.2)',
    visual: <ChunkingVisual />,
  },
  {
    id: 3,
    icon: Binary,
    title: 'Embedding Generation',
    subtitle: 'Convert text to vectors',
    description: 'Each text chunk is transformed into a high-dimensional vector (embedding) using a neural network. Semantically similar texts end up close together in vector space.',
    detail: 'Models like OpenAI text-embedding-3-small or Sentence-BERT generate dense vectors of 768 to 3072 dimensions. These capture semantic meaning, not just keywords.',
    color: '#c084fc',
    bgColor: 'rgba(192, 132, 252, 0.08)',
    borderColor: 'rgba(192, 132, 252, 0.2)',
    visual: <EmbeddingVisual />,
  },
  {
    id: 4,
    icon: Database,
    title: 'Vector Storage',
    subtitle: 'Index for fast retrieval',
    description: 'Embeddings are stored in a specialized vector database optimized for similarity search. This enables lightning-fast nearest-neighbor lookups.',
    detail: 'Popular vector databases include Pinecone, Weaviate, Qdrant, and pgvector for PostgreSQL. They use algorithms like HNSW or IVF for approximate nearest-neighbor search.',
    color: '#22d3ee',
    bgColor: 'rgba(34, 211, 238, 0.08)',
    borderColor: 'rgba(34, 211, 238, 0.2)',
    visual: <div />,
  },
  {
    id: 5,
    icon: Search,
    title: 'Query & Retrieval',
    subtitle: 'Find the most relevant chunks',
    description: 'When a user asks a question, it is also embedded. The system finds the K nearest vectors in the database — these are the most semantically relevant documents.',
    detail: 'Similarity is computed using cosine similarity or dot product. The top-K results (typically 3-5) are retrieved and ranked by relevance score.',
    color: '#2dd4bf',
    bgColor: 'rgba(45, 212, 191, 0.08)',
    borderColor: 'rgba(45, 212, 191, 0.2)',
    visual: <VectorDBVisual />,
  },
  {
    id: 6,
    icon: BrainCircuit,
    title: 'Augmented Prompting',
    subtitle: 'Context + Question → LLM',
    description: 'The retrieved documents are injected into the prompt alongside the user\'s question. The LLM now has relevant context to generate an accurate, grounded answer.',
    detail: 'The prompt is carefully structured: system instructions, retrieved context with source metadata, and the user query. This "augmented" prompt gives the LLM grounded knowledge.',
    color: '#f472b6',
    bgColor: 'rgba(244, 114, 182, 0.08)',
    borderColor: 'rgba(244, 114, 182, 0.2)',
    visual: <PromptVisual />,
  },
  {
    id: 7,
    icon: MessageSquare,
    title: 'Response Generation',
    subtitle: 'Accurate, sourced answers',
    description: 'The LLM generates a response grounded in the retrieved documents. Unlike vanilla LLMs, RAG answers are factual, traceable, and up-to-date.',
    detail: 'The response can include citations pointing back to the source documents, enabling users to verify the information. This dramatically reduces hallucination.',
    color: '#fb923c',
    bgColor: 'rgba(251, 146, 60, 0.08)',
    borderColor: 'rgba(251, 146, 60, 0.2)',
    visual: <div />,
  },
];

/* ─── Step Card ─── */
function StepCard({ step, index }: { step: Step; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        style={{
          background: step.bgColor,
          border: `1px solid ${step.borderColor}`,
          borderRadius: '16px',
          padding: '24px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
        onClick={() => setExpanded(!expanded)}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = step.color;
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = step.borderColor;
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1 }}>
            {/* Step number + icon */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: `linear-gradient(135deg, ${step.color}20, ${step.color}08)`,
                border: `1px solid ${step.color}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Icon size={22} color={step.color} strokeWidth={1.5} />
              </div>
              <div style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                width: '20px',
                height: '20px',
                borderRadius: '6px',
                background: step.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 800,
                color: '#fff',
                fontFamily: "'Inter', sans-serif",
              }}>
                {step.id}
              </div>
            </div>

            {/* Text */}
            <div>
              <div style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.1em',
                color: step.color,
                marginBottom: '4px',
                fontFamily: "'Inter', sans-serif",
              }}>
                {step.subtitle}
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#171717',
                margin: 0,
                fontFamily: "'Inter', sans-serif",
              }}>
                {step.title}
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#525252',
                lineHeight: 1.6,
                margin: '8px 0 0 0',
                fontFamily: "'Inter', sans-serif",
              }}>
                {step.description}
              </p>
            </div>
          </div>

          {/* Expand toggle */}
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            style={{ flexShrink: 0, marginTop: '4px' }}
          >
            <ChevronDown size={18} color="#a3a3a3" />
          </motion.div>
        </div>

        {/* Expandable detail */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{
                marginTop: '20px',
                paddingTop: '20px',
                borderTop: `1px solid ${step.borderColor}`,
                display: 'grid',
                gridTemplateColumns: step.visual ? '1fr 1fr' : '1fr',
                gap: '20px',
              }}>
                <div>
                  <div style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.1em',
                    color: '#a3a3a3',
                    marginBottom: '8px',
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    Technical Detail
                  </div>
                  <p style={{
                    fontSize: '13px',
                    color: '#525252',
                    lineHeight: 1.7,
                    margin: 0,
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    {step.detail}
                  </p>
                </div>
                {step.visual && (
                  <div>{step.visual}</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Connector arrow */}
      {index < STEPS.length - 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '8px 0',
        }}>
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <ArrowDown size={18} color="#334155" strokeWidth={1.5} />
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Exported Component ─── */
export default function RAGSteps() {
  return (
    <div style={{
      maxWidth: '680px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {STEPS.map((step, i) => (
        <StepCard key={step.id} step={step} index={i} />
      ))}
    </div>
  );
}
