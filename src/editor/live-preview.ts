import { ViewPlugin, ViewUpdate, Decoration, DecorationSet } from '@codemirror/view';
import { EditorView } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';

const livePreviewViewPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    destroy() {
      // Your cleanup logic goes here
    }

    buildDecorations(view: EditorView): DecorationSet {
      const builder = new RangeSetBuilder<Decoration>();
      for (const { from, to } of view.visibleRanges) {
        syntaxTree(view.state).iterate({
          from,
          to,
          enter: (node) => {
            const nodeName = node.name;
            const nodeFrom = node.from;
            const nodeTo = node.to;

            // Handle strong/bold
            if (nodeName === 'StrongEmphasis') {
              builder.add(nodeFrom, nodeTo, Decoration.mark({ class: 'cm-strong' }));
            }
            // Handle emphasis/italic
            if (nodeName === 'Emphasis') {
              builder.add(nodeFrom, nodeTo, Decoration.mark({ class: 'cm-em' }));
            }
            // Handle strikethrough
            if (nodeName === 'Strikethrough') {
              builder.add(nodeFrom, nodeTo, Decoration.mark({ class: 'cm-strikethrough' }));
            }
            // Handle inline code
            if (nodeName === 'InlineCode') {
              builder.add(nodeFrom, nodeTo, Decoration.mark({ class: 'cm-inline-code' }));
            }
            // Handle headings
            for (let i = 1; i <= 6; i++) {
              if (nodeName === `ATXHeading${i}` || nodeName === `SetextHeading${i}`) {
                builder.add(nodeFrom, nodeTo, Decoration.mark({ class: `cm-h${i}` }));
              }
            }
            // Handle lists
            if (nodeName === 'BulletList' || nodeName === 'OrderedList') {
              builder.add(nodeFrom, nodeTo, Decoration.mark({ class: 'cm-list-1' }));
            }
            // Handle blockquotes
            if (nodeName === 'Blockquote') {
              builder.add(nodeFrom, nodeTo, Decoration.mark({ class: 'cm-blockquote' }));
            }
            // Handle code blocks
            if (nodeName === 'FencedCode' || nodeName === 'CodeBlock') {
              builder.add(nodeFrom, nodeTo, Decoration.mark({ class: 'cm-code-block' }));
            }
          },
        });
      }
      return builder.finish();
    }
  },
  {
    decorations: (v) => v.decorations,
  },
);

export default livePreviewViewPlugin;
