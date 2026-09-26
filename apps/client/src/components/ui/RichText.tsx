import { Bold, Heading3, Italic, List, ListOrdered, Pilcrow, Underline } from 'lucide-react';
import { forwardRef, useEffect, useImperativeHandle, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';
import { sanitizeRichText } from '../../lib/sanitize';

type ToolKey = 'bold' | 'italic' | 'underline' | 'heading' | 'paragraph' | 'bullets' | 'numbers';

/** Toolbar buttons: static data, run through `exec` on click. */
const TOOLS: ReadonlyArray<{ key: ToolKey; icon: ReactNode; command: string; arg?: string }> = [
  { key: 'bold', icon: <Bold className="h-4 w-4" />, command: 'bold' },
  { key: 'italic', icon: <Italic className="h-4 w-4" />, command: 'italic' },
  { key: 'underline', icon: <Underline className="h-4 w-4" />, command: 'underline' },
  { key: 'heading', icon: <Heading3 className="h-4 w-4" />, command: 'formatBlock', arg: '<h3>' },
  { key: 'paragraph', icon: <Pilcrow className="h-4 w-4" />, command: 'formatBlock', arg: '<p>' },
  { key: 'bullets', icon: <List className="h-4 w-4" />, command: 'insertUnorderedList' },
  { key: 'numbers', icon: <ListOrdered className="h-4 w-4" />, command: 'insertOrderedList' },
];

/** Renders stored rich text (always re-sanitized in the browser). */
export function RichTextView({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={cn('rich-text', className)}
      dangerouslySetInnerHTML={{ __html: sanitizeRichText(html) }}
    />
  );
}

export interface RichTextEditorHandle {
  /** Inserts text (e.g. a `{{placeholder}}`) at the last caret position. */
  insertText: (text: string) => void;
}

/**
 * Minimal rich-text editor (bold, italic, underline, heading, lists) on contentEditable.
 * Output is sanitized to the shared allowlist on every change, so what is stored is
 * exactly what the server accepts.
 */
export const RichTextEditor = forwardRef<
  RichTextEditorHandle,
  {
    id: string;
    value: string;
    onChange: (html: string) => void;
    labelledBy?: string;
    minHeight?: string;
  }
>(function RichTextEditor({ id, value, onChange, labelledBy, minHeight = '10rem' }, ref) {
  const { t } = useTranslation();
  const editor = useRef<HTMLDivElement>(null);
  const lastHtml = useRef<string | null>(null);
  const savedRange = useRef<Range | null>(null);

  // Push outside changes into the DOM (but never rewrite what the user is typing).
  useEffect(() => {
    if (editor.current && value !== lastHtml.current) {
      editor.current.innerHTML = sanitizeRichText(value);
      lastHtml.current = value;
    }
  }, [value]);

  const emit = () => {
    if (!editor.current) return;
    const html = sanitizeRichText(editor.current.innerHTML);
    lastHtml.current = html;
    onChange(html);
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editor.current?.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    editor.current?.focus();
    const sel = window.getSelection();
    if (savedRange.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  };

  const exec = (command: string, arg?: string) => {
    restoreSelection();
    document.execCommand(command, false, arg);
    saveSelection();
    emit();
  };

  useImperativeHandle(ref, () => ({ insertText: (text: string) => exec('insertText', text) }));

  return (
    <div className="rounded-lg border border-gray-300 bg-white shadow-sm focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/30">
      <div
        role="toolbar"
        aria-label={t('prescriptions.editor.toolbar')}
        aria-controls={id}
        className="flex flex-wrap gap-0.5 border-b border-gray-200 p-1"
      >
        {TOOLS.map((tool) => (
          <button
            key={tool.key}
            type="button"
            title={t(`prescriptions.editor.${tool.key}`)}
            aria-label={t(`prescriptions.editor.${tool.key}`)}
            onMouseDown={(e) => e.preventDefault()} // keep the caret in the editor
            onClick={() => exec(tool.command, tool.arg)}
            className="rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            {tool.icon}
          </button>
        ))}
      </div>
      <div
        id={id}
        ref={editor}
        role="textbox"
        aria-multiline="true"
        aria-labelledby={labelledBy}
        contentEditable
        suppressContentEditableWarning
        onFocus={() => document.execCommand('defaultParagraphSeparator', false, 'p')}
        onInput={emit}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        onBlur={saveSelection}
        className="rich-text px-3 py-2 text-sm focus:outline-none"
        style={{ minHeight }}
      />
    </div>
  );
});

/** A list of short lines (recommendations, foods) edited as one textarea, one item per line. */
export function LinesEditor({
  id,
  value,
  onChange,
  rows = 4,
}: {
  id: string;
  value: string[];
  onChange: (lines: string[]) => void;
  rows?: number;
}) {
  return (
    <textarea
      id={id}
      rows={rows}
      defaultValue={value.join('\n')}
      onChange={(e) =>
        onChange(
          e.target.value
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean),
        )
      }
      className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30"
    />
  );
}
