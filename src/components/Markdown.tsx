/**
 * Markdown renderer used by lessons and quiz prompts.
 *
 * Supports GitHub-flavoured Markdown (tables, etc.) and syntax-highlighted
 * fenced code blocks via rehype-highlight. Content is trusted (it's our own
 * authored data), so we don't need extra sanitisation here.
 */
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

export default function Markdown({ children }: { children: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
