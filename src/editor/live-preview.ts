import { ViewPlugin, ViewUpdate, Decoration, DecorationSet } from '@codemirror/view';
import { EditorView } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';
import { tokenClassNodeProp } from '@codemirror/stream-parser';

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
          enter: (type, from, to) => {
            const tokenProps = type.prop(tokenClassNodeProp);
            if (tokenProps) {
              const props = new Set(tokenProps.split(' '));

              if (props.has('strong')) {
                builder.add(from, to, Decoration.mark({ class: 'cm-strong' }));
              }
              if (props.has('em')) {
                builder.add(from, to, Decoration.mark({ class: 'cm-em' }));
              }
              if (props.has('strikethrough')) {
                builder.add(from, to, Decoration.mark({ class: 'cm-strikethrough' }));
              }
              if (props.has('inline-code')) {
                builder.add(from, to, Decoration.mark({ class: 'cm-inline-code' }));
                builder.add(from, from + 1, Decoration.replace({}));
                builder.add(to - 1, to, Decoration.replace({}));
              }
              if (props.has('formatting-list-ol') || props.has('formatting-list-ul')) {
                builder.add(from, to, Decoration.replace({}));
              }
              if (props.has('formatting-header')) {
                builder.add(from, to, Decoration.replace({}));
              }
              if (props.has('formatting-quote')) {
                builder.add(from, to, Decoration.replace({}));
              }
              if (props.has('formatting-code-block')) {
                builder.add(from, to, Decoration.replace({}));
              }

              for (let i = 1; i <= 6; i++) {
                if (props.has(`h${i}`)) {
                  builder.add(from, to, Decoration.mark({ class: `cm-h${i}` }));
                }
              }

              if (props.has('list-1')) {
                builder.add(from, to, Decoration.mark({ class: 'cm-list-1' }));
              }
              if (props.has('quote')) {
                builder.add(from, to, Decoration.mark({ class: 'cm-blockquote' }));
              }
              if (props.has('code-block')) {
                builder.add(from, to, Decoration.mark({ class: 'cm-code-block' }));
              }
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
