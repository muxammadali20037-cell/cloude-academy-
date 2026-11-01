import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * Dars matnini ko'rsatadi. Xavfsizlik: xom HTML bajarilmaydi (react-markdown
 * standart holatda HTML'ni e'tiborsiz qoldiradi), havolalar yangi oynada,
 * `noopener noreferrer` bilan ochiladi.
 */
const components: Components = {
  h2: ({ children }) => <h2 className="mt-8 text-xl font-semibold tracking-tight text-fg first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-6 text-lg font-semibold text-fg first:mt-0">{children}</h3>,
  p: ({ children }) => <p className="mt-4 leading-[1.7] text-fg first:mt-0">{children}</p>,
  ul: ({ children }) => <ul className="mt-4 list-disc space-y-1.5 pl-5 marker:text-fg-subtle">{children}</ul>,
  ol: ({ children }) => <ol className="mt-4 list-decimal space-y-1.5 pl-5 marker:text-fg-subtle">{children}</ol>,
  li: ({ children }) => <li className="pl-1 leading-[1.7]">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-accent-fg underline decoration-accent-fg/40 underline-offset-4 hover:decoration-accent-fg"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold text-fg">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="mt-4 border-l-2 border-primary pl-4 text-fg-muted">{children}</blockquote>
  ),
  code: ({ className, children }) =>
    className ? (
      <code className={className}>{children}</code>
    ) : (
      <code className="rounded-[0.375rem] bg-surface-2 px-1.5 py-0.5 font-mono text-[0.875em]">{children}</code>
    ),
  pre: ({ children }) => (
    <pre
      tabIndex={0}
      className="mt-4 overflow-x-auto rounded-control bg-surface p-4 font-mono text-sm leading-relaxed ring-1 ring-line"
    >
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border-b border-line px-3 py-2 text-left font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-b border-line px-3 py-2 align-top">{children}</td>,
  hr: () => <hr className="my-8 border-line" />,
  img: () => null,
};

export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("max-w-[68ch] text-[1.0625rem]", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components} skipHtml>
        {children}
      </ReactMarkdown>
    </div>
  );
}
