import type { ReactNode } from 'react';

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(!\[[^\]]*\]\([^)\s]+\)|`[^`]+`|\*\*[^*]+\*\*|\*[^*\n]+\*|\[[^\]]+\]\([^)\s]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${i++}`;
    if (token.startsWith('![')) {
      const img = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(token);
      if (img) nodes.push(<img key={key} src={img[2]} alt={img[1]} className="my-3 max-w-full rounded-xl border border-border" loading="lazy" />);
      else nodes.push(token);
    } else if (token.startsWith('`')) {
      nodes.push(<code key={key} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">{token.slice(1, -1)}</code>);
    } else if (token.startsWith('**')) {
      nodes.push(<strong key={key} className="font-semibold text-foreground">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('[')) {
      const linkMatch = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(token);
      if (linkMatch) {
        nodes.push(<a key={key} href={linkMatch[2]} target="_blank" rel="noreferrer" className="font-medium text-primary underline underline-offset-2">{linkMatch[1]}</a>);
      } else nodes.push(token);
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Markdown({ content, className = '' }: { content: string; className?: string }) {
  const blocks: ReactNode[] = [];
  const segments = content.split(/```(\w*)\n?([\s\S]*?)(?:```|$)/g);
  // segments: [text, lang, code, text, lang, code, ...]
  let key = 0;

  for (let s = 0; s < segments.length; s += 3) {
    const text = segments[s] ?? '';
    const lines = text.split('\n');
    let paragraph: string[] = [];
    let list: { ordered: boolean; items: string[] } | null = null;
    let table: string[][] | null = null;
    let quote: string[] = [];

    const flushTable = () => {
      if (table && table.length) {
        const [head, ...body] = table;
        blocks.push(
          <div key={key++} className="my-4 overflow-x-auto rounded-xl border border-border">
            <table className="w-full border-collapse text-sm">
              <thead><tr className="bg-muted">{head.map((c, i) => <th key={i} className="border-b border-border px-3 py-2 text-left font-semibold text-foreground">{renderInline(c, `th${key}-${i}`)}</th>)}</tr></thead>
              <tbody>{body.map((row, ri) => <tr key={ri} className="border-b border-border last:border-0">{row.map((c, ci) => <td key={ci} className="px-3 py-2 align-top text-foreground/90">{renderInline(c, `td${key}-${ri}-${ci}`)}</td>)}</tr>)}</tbody>
            </table>
          </div>
        );
        table = null;
      }
    };
    const flushQuote = () => {
      if (quote.length) {
        blocks.push(<blockquote key={key++} className="my-4 border-l-4 border-indigo-500/40 bg-indigo-500/5 px-4 py-2 text-sm leading-7 text-foreground/90">{quote.map((q, i) => <p key={i}>{renderInline(q, `q${key}-${i}`)}</p>)}</blockquote>);
        quote = [];
      }
    };

    const flushParagraph = () => {
      if (paragraph.length) {
        blocks.push(<p key={key++} className="text-sm leading-7 text-foreground/90">{renderInline(paragraph.join(' '), `p${key}`)}</p>);
        paragraph = [];
      }
    };
    const flushList = () => {
      if (list && list.items.length) {
        const items = list.items.map((item, idx) => (
          <li key={idx} className="text-sm leading-7 text-foreground/90">{renderInline(item, `li${key}-${idx}`)}</li>
        ));
        blocks.push(list.ordered
          ? <ol key={key++} className="list-decimal space-y-1.5 pl-6">{items}</ol>
          : <ul key={key++} className="list-disc space-y-1.5 pl-6">{items}</ul>);
        list = null;
      }
    };
    const flushAll = () => { flushParagraph(); flushList(); flushTable(); flushQuote(); };

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();
      const trimmed = line.trim();

      if (!trimmed) { flushAll(); continue; }

      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        flushParagraph(); flushList(); flushQuote();
        const cells = trimmed.slice(1, -1).split('|').map((c) => c.trim());
        if (!cells.every((c) => /^:?-{2,}:?$/.test(c))) {
          (table ??= []).push(cells);
        }
        continue;
      }
      flushTable();

      if (trimmed.startsWith('> ')) {
        flushParagraph(); flushList();
        quote.push(trimmed.slice(2));
        continue;
      }
      flushQuote();

      const heading = /^(#{1,4})\s+(.*)$/.exec(trimmed);
      if (heading) {
        flushAll();
        const level = heading[1].length;
        const cls = level <= 2
          ? 'mt-6 mb-2 text-lg font-bold tracking-tight text-foreground first:mt-0'
          : 'mt-4 mb-1.5 text-base font-semibold text-foreground';
        const Tag = level <= 2 ? 'h2' : 'h3';
        blocks.push(<Tag key={key++} className={cls}>{renderInline(heading[2], `h${key}`)}</Tag>);
        continue;
      }

      const bullet = /^[-*]\s+(.*)$/.exec(trimmed);
      const ordered = /^\d+[.)]\s+(.*)$/.exec(trimmed);
      if (bullet || ordered) {
        flushParagraph(); flushQuote();
        const isOrdered = Boolean(ordered);
        const itemText = (bullet ?? ordered)![1];
        if (!list || list.ordered !== isOrdered) { flushList(); list = { ordered: isOrdered, items: [] }; }
        list.items.push(itemText);
        continue;
      }

      flushList(); flushQuote();
      paragraph.push(trimmed);
    }
    flushAll();

    const code = segments[s + 2];
    if (code !== undefined) {
      blocks.push(
        <pre key={key++} className="my-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-[13px] leading-6 text-slate-100">
          <code>{code.replace(/\n$/, '')}</code>
        </pre>
      );
    }
  }

  return <div className={className}>{blocks}</div>;
}
