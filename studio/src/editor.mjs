import { Node, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown';
import { TableKit } from '@tiptap/extension-table';
import Image from '@tiptap/extension-image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';

export const AcademyBox = Node.create({
  name: 'academyBox', group: 'block', content: 'block+', defining: true,
  addAttributes() { return { kind: { default: 'info' }, title: { default: 'Gut zu wissen' } }; },
  parseHTML() { return [{ tag: 'aside[data-academy-box]', getAttrs: el => ({ kind: el.dataset.kind, title: el.dataset.title }) }]; },
  renderHTML({ HTMLAttributes }) { return ['aside', mergeAttributes(HTMLAttributes, { 'data-academy-box': '', 'data-kind': HTMLAttributes.kind, 'data-title': HTMLAttributes.title }), 0]; },
  markdownTokenName: 'academyBox',
  markdownTokenizer: {
    name: 'academyBox', level: 'block', start: src => src.indexOf(':::'),
    tokenize(src, tokens, lexer) {
      const match = /^(:{3,})\s*(info|tip|warning|danger|details)(?:[ \t]+([^\n]*))?\r?\n/.exec(src);
      if (!match) return;
      const rest = src.slice(match[0].length); const end = new RegExp(`^${match[1]}[ \\t]*\\r?$`, 'm').exec(rest);
      if (!end) return;
      const raw = src.slice(0, match[0].length + end.index + end[0].length);
      return { type: 'academyBox', raw, kind: match[2], title: match[3] || '', tokens: lexer.blockTokens(rest.slice(0, end.index).trim()) };
    }
  },
  parseMarkdown(token, helpers) { return { type: 'academyBox', attrs: { kind: token.kind, title: token.title }, content: helpers.parseChildren(token.tokens || []) }; },
  renderMarkdown(node, helpers) { return `::: ${node.attrs.kind} ${node.attrs.title}\n\n${helpers.renderChildren(node.content, '\n\n')}\n\n:::`; }
});
export function extensions(imageSource = src => src) {
  const StudioImage=Image.extend({renderHTML({HTMLAttributes}){return ['img',{...HTMLAttributes,src:imageSource(HTMLAttributes.src)}];}});
  return [StarterKit.configure({ heading: { levels: [1,2,3] }, link: { openOnClick: false, protocols: ['https', 'http'] } }), TableKit.configure({ table: { resizable: false } }), StudioImage.configure({ allowBase64: false }), TaskList, TaskItem.configure({ nested: true }), AcademyBox, Markdown];
}
