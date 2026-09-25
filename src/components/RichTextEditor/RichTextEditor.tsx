'use client';

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';
import {AutoFocusPlugin} from '@lexical/react/LexicalAutoFocusPlugin';
import {LexicalComposer} from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import {LexicalErrorBoundary} from '@lexical/react/LexicalErrorBoundary';
import {HistoryPlugin} from '@lexical/react/LexicalHistoryPlugin';
import {RichTextPlugin} from '@lexical/react/LexicalRichTextPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { $generateHtmlFromNodes } from '@lexical/html';

import {
  $isTextNode,
  DOMConversionMap,
  DOMExportOutput,
  DOMExportOutputMap,
  isHTMLElement,
  Klass,
  LexicalEditor,
  LexicalNode,
  ParagraphNode,
  TextNode,
  EditorState,
  $getRoot,
  $createParagraphNode,
} from 'lexical';

// Import link and list nodes
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { ListNode, ListItemNode } from '@lexical/list';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';

import ExampleTheme from './ExampleTheme';
import ToolbarPlugin from './plugins/ToolbarPlugin';
import { LinkPlugin, AutoLinkPlugin } from './plugins/LinkPlugin';
import { ListPlugin } from './plugins/ListPlugin';
import {parseAllowedColor, parseAllowedFontSize} from './styleConfig';

interface LexicalEditorState {
  root?: {
    children?: unknown[];
  };
}

interface RichTextEditorProps {
  label?: string;
  value?: string | object;
  onChange: (data: { html: string; editorState: object }) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  minHeight?: number;
  autoFocus?: boolean;
  maxLength?: number;
}

const removeStylesExportDOM = (
  editor: LexicalEditor,
  target: LexicalNode,
): DOMExportOutput => {
  const output = target.exportDOM(editor);
  if (output && isHTMLElement(output.element)) {
    // Remove all inline styles and classes if the element is an HTMLElement
    // Children are checked as well since TextNode can be nested
    // in i, b, and strong tags.
    for (const el of [
      output.element,
      ...output.element.querySelectorAll('[style],[class]'),
    ]) {
      el.removeAttribute('class');
      el.removeAttribute('style');
    }
  }
  return output;
};

const exportMap: DOMExportOutputMap = new Map<
  Klass<LexicalNode>,
  (editor: LexicalEditor, target: LexicalNode) => DOMExportOutput
>([
  [ParagraphNode, removeStylesExportDOM],
  [TextNode, removeStylesExportDOM],
]);

const getExtraStyles = (element: HTMLElement): string => {
  // Parse styles from pasted input, but only if they match exactly the
  // sort of styles that would be produced by exportDOM
  let extraStyles = '';
  const fontSize = parseAllowedFontSize(element.style.fontSize);
  const backgroundColor = parseAllowedColor(element.style.backgroundColor);
  const color = parseAllowedColor(element.style.color);
  if (fontSize !== '' && fontSize !== '15px') {
    extraStyles += `font-size: ${fontSize};`;
  }
  if (backgroundColor !== '' && backgroundColor !== 'rgb(255, 255, 255)') {
    extraStyles += `background-color: ${backgroundColor};`;
  }
  if (color !== '' && color !== 'rgb(0, 0, 0)') {
    extraStyles += `color: ${color};`;
  }
  return extraStyles;
};

const constructImportMap = (): DOMConversionMap => {
  const importMap: DOMConversionMap = {};

  // Wrap all TextNode importers with a function that also imports
  // the custom styles implemented by the playground
  for (const [tag, fn] of Object.entries(TextNode.importDOM() || {})) {
    importMap[tag] = (importNode) => {
      const importer = fn(importNode);
      if (!importer) {
        return null;
      }
      return {
        ...importer,
        conversion: (element) => {
          const output = importer.conversion(element);
          if (
            output === null ||
            output.forChild === undefined ||
            output.after !== undefined ||
            output.node !== null
          ) {
            return output;
          }
          const extraStyles = getExtraStyles(element);
          if (extraStyles) {
            const {forChild} = output;
            return {
              ...output,
              forChild: (child, parent) => {
                const textNode = forChild(child, parent);
                if ($isTextNode(textNode)) {
                  textNode.setStyle(textNode.getStyle() + extraStyles);
                }
                return textNode;
              },
            };
          }
          return output;
        },
      };
    };
  }

  return importMap;
};

// Component that has access to the editor context
function OnChangeComponent({ onChange }: { onChange: (data: { html: string; editorState: object }) => void }) {
  const [editor] = useLexicalComposerContext();
  
  const handleEditorChange = (editorState: EditorState) => {
    editorState.read(() => {
      // Generate HTML from the current editor state
      const html = $generateHtmlFromNodes(editor);
      
      // Serialize editor state to JSON
      const serializedState = editorState.toJSON();
      
      // Pass both HTML and editor state to the onChange callback
      onChange({
        html,
        editorState: serializedState
      });
    });
  };

  return <OnChangePlugin onChange={handleEditorChange} />;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&[a-z]+;/gi, ' ').trim();
}

export default function RichTextEditor({
  label,
  value = '',
  onChange,
  error,
  placeholder = 'Enter some rich text...',
  required = false,
  minHeight = 120,
  autoFocus = false,
  maxLength
}: RichTextEditorProps) {
  const plainTextLength = typeof value === 'string' ? stripHtml(value).length : 0;
  // Create a proper initial editor state function
  const createInitialEditorState = () => {
    return () => {
      const root = $getRoot();
      if (root.isEmpty()) {
        const paragraph = $createParagraphNode();
        root.append(paragraph);
      }
    };
  };

  // Check if the value has meaningful content
  const hasValidEditorState = () => {
    if (!value || typeof value !== 'object') return false;
    
    // Check if it has the expected structure and non-empty children
    const editorState = value as LexicalEditorState;
    if (editorState.root && editorState.root.children && Array.isArray(editorState.root.children)) {
      return editorState.root.children.length > 0;
    }
    
    // Fallback: check if it has any keys (for other editor state formats)
    return Object.keys(value).length > 0 && JSON.stringify(value) !== '{}';
  };

  const editorConfig = {
    html: {
      export: exportMap,
      import: constructImportMap(),
    },
    namespace: 'React.js Demo',
    nodes: [ParagraphNode, TextNode, LinkNode, AutoLinkNode, ListNode, ListItemNode, HeadingNode, QuoteNode],
    onError(error: Error) {
      throw error;
    },
    theme: ExampleTheme,
    editorState: hasValidEditorState() 
      ? JSON.stringify(value) 
      : createInitialEditorState(),
  };

  return (
    <div className="space-y-2">
      <label className={`block text-sm font-medium ${error ? 'text-red-700' : 'text-gray-700'}`}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className={`border rounded-md ${error ? 'border-red-300' : 'border-gray-300'} focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500`}>
        <LexicalComposer initialConfig={editorConfig}>
          <div className="editor-container">
            <ToolbarPlugin />
            <div className="editor-inner" style={{ minHeight }}>
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    className="editor-input"
                    aria-placeholder={placeholder}
                    placeholder={
                      <div className="editor-placeholder">{placeholder}</div>
                    }
                  />
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
              <OnChangeComponent onChange={onChange} />
              <HistoryPlugin />
              {autoFocus && <AutoFocusPlugin />}
              <LinkPlugin />
              <AutoLinkPlugin />
              <ListPlugin />
            </div>
          </div>
        </LexicalComposer>
      </div>
      
      <div className="flex justify-between items-start mt-1">
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <span />
        )}
        {maxLength !== undefined && (
          <p className={`text-xs ${plainTextLength >= maxLength ? 'text-red-500' : 'text-gray-400'}`}>
            {plainTextLength}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
}
