"use client";

import React, { useCallback, useState, useEffect } from 'react';
import Image from 'next/image';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { AutoLinkPlugin } from '@lexical/react/LexicalAutoLinkPlugin';
import { HeadingNode, QuoteNode, $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { LinkNode, AutoLinkNode, $createLinkNode } from '@lexical/link';
import { 
  FORMAT_TEXT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $createTextNode,
  $getRoot
} from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import type { EditorState } from 'lexical';

const theme = {
  paragraph: 'text-gray-900 mb-1 leading-relaxed',
  quote: 'border-l-4 border-blue-300 pl-4 italic text-gray-700 mb-3 bg-blue-50 py-2 rounded-r',
  heading: {
    h1: 'text-3xl font-bold text-gray-900 mb-4 leading-tight',
    h2: 'text-2xl font-bold text-gray-900 mb-3 leading-tight',
    h3: 'text-xl font-bold text-gray-900 mb-2 leading-tight',
  },
  list: {
    nested: {
      listitem: 'list-none',
    },
    ol: 'list-decimal list-inside mb-2 ml-4 space-y-1',
    ul: 'list-disc list-inside mb-2 ml-4 space-y-1',
  },
  listitem: 'mb-1',
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
  },
  link: 'text-blue-600 underline hover:text-blue-800 cursor-pointer',
};

// Link Modal Component
function LinkModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialUrl = '',
  selectedText = ''
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (url: string) => void; 
  initialUrl?: string;
  selectedText?: string;
}) {
  const [url, setUrl] = useState(initialUrl);

  const handleSubmit = () => {
    if (url.trim()) {
      onSubmit(url.trim());
      onClose();
      setUrl(''); // Reset the URL field
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-lg p-6 w-96 max-w-90vw"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">Add Link</h3>
        {selectedText && (
          <div className="mb-3 p-2 bg-gray-100 rounded text-sm">
            <span className="text-gray-600">Link text: </span>
            <span className="font-medium">&ldquo;{selectedText}&rdquo;</span>
          </div>
        )}
        <div>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            autoFocus
          />
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced toolbar component with more features
function Toolbar() {
  const [editor] = useLexicalComposerContext();
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');

  const formatText = useCallback(
    (format: 'bold' | 'italic' | 'underline' | 'strikethrough') => {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
    },
    [editor]
  );

  const formatHeading = useCallback(
    (headingSize: 'h1' | 'h2' | 'h3') => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode(headingSize));
        }
      });
    },
    [editor]
  );

  const formatParagraph = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  }, [editor]);

  const formatQuote = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createQuoteNode());
      }
    });
  }, [editor]);

  const insertList = useCallback(
    (listType: 'ul' | 'ol') => {
      if (listType === 'ul') {
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
      } else {
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
      }
    },
    [editor]
  );

  const insertLink = useCallback(
    (url: string, selectedText?: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          if (selectedText) {
            // If we have selected text, replace it with a link
            const linkNode = $createLinkNode(url);
            linkNode.append($createTextNode(selectedText));
            selection.insertNodes([linkNode]);
          } else if (selection.isCollapsed()) {
            // If no text is selected, insert the URL as both text and link
            const linkNode = $createLinkNode(url);
            linkNode.append($createTextNode(url));
            selection.insertNodes([linkNode]);
          } else {
            // If text is selected but not passed, wrap the selection
            selection.insertNodes([$createLinkNode(url)]);
          }
        }
      });
    },
    [editor]
  );

  const openLinkModal = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection) && !selection.isCollapsed()) {
        setSelectedText(selection.getTextContent());
      } else {
        setSelectedText('');
      }
    });

    setIsLinkModalOpen(true);
  }, [editor, setSelectedText]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-1 p-3">
        {/* Undo/Redo */}
        <button
          type="button"
          onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
          className="px-2 py-1 text-sm rounded hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          title="Undo (Ctrl+Z)"
        >
          <Image src="/icons/icon-text-undo.svg" alt="Undo" width={20} height={20} />
        </button>
        <button
          type="button"
          onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
          className="px-2 py-1 text-sm rounded hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          title="Redo (Ctrl+Y)"
        >
          <Image src="/icons/icon-text-redo.svg" alt="Redo" width={20} height={20} />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Block Type Dropdown */}
        <select
          className="px-2 py-1 text-sm rounded hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          onChange={(e) => {
            const value = e.target.value;
            if (value === 'paragraph') formatParagraph();
            else if (value === 'h1') formatHeading('h1');
            else if (value === 'h2') formatHeading('h2');
            else if (value === 'h3') formatHeading('h3');
            else if (value === 'quote') formatQuote();
          }}
          defaultValue="paragraph"
        >
          <option value="paragraph">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="quote">Quote</option>
        </select>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Text Formatting */}
        <button
          type="button"
          onClick={() => formatText('bold')}
          className="px-2 py-1 text-sm rounded hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          title="Bold (Ctrl+B)"
        >
          <Image src="/icons/icon-text-bold.svg" alt="Bold" width={20} height={20} />
        </button>
        <button
          type="button"
          onClick={() => formatText('italic')}
          className="px-2 py-1 text-sm rounded hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          title="Italic (Ctrl+I)"
        >
          <Image src="/icons/icon-text-italic.svg" alt="Italic" width={20} height={20} />
        </button>
        <button
          type="button"
          onClick={() => formatText('underline')}
          className="px-2 py-1 text-sm rounded hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          title="Underline (Ctrl+U)"
        >
          <Image src="/icons/icon-text-underline.svg" alt="Underline" width={20} height={20} />
        </button>
        <button
          type="button"
          onClick={() => formatText('strikethrough')}
          className="px-2 py-1 text-sm rounded hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          title="Strikethrough"
        >
          <Image src="/icons/icon-text-strikethrough.svg" alt="Strikethrough" width={20} height={20} />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Link */}
        <button
          type="button"
          onClick={openLinkModal}
          className="px-2 py-1 text-sm rounded hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          title="Add Link"
        >
          <Image src="/icons/icon-text-link.svg" alt="Link" width={20} height={20} />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Lists */}
        <button
          type="button"
          onClick={() => insertList('ul')}
          className="px-2 py-1 text-sm rounded hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          title="Bullet List"
        >
          <Image src="/icons/icon-text-list-bulleted.svg" alt="Bullet List" width={20} height={20} />
        </button>
        <button
          type="button"
          onClick={() => insertList('ol')}
          className="px-2 py-1 text-sm rounded hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          title="Numbered List"
        >
          <Image src="/icons/icon-text-list-numbered.svg" alt="Numbered List" width={20} height={20} />
        </button>
      </div>

      <LinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onSubmit={(url) => insertLink(url, selectedText)}
        selectedText={selectedText}
      />
    </>
  );
}

interface EditorCapturePluginProps {
  onChange: (html: string) => void;
}

function EditorCapturePlugin({ onChange }: EditorCapturePluginProps) {
  const [editor] = useLexicalComposerContext();

  const handleEditorChange = useCallback(
    (editorState: EditorState) => {
      editorState.read(() => {
        const htmlString = $generateHtmlFromNodes(editor, null);
        onChange(htmlString);
      });
    },
    [editor, onChange]
  );

  return <OnChangePlugin onChange={handleEditorChange} />;
}

// Plugin to set initial HTML content and handle value updates
interface HTMLContentPluginProps {
  value?: string;
}

function HTMLContentPlugin({ value }: HTMLContentPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [hasInitialized, setHasInitialized] = useState(false);
  const [lastExternalValue, setLastExternalValue] = useState<string | undefined>(value);
  const [isUserEditing, setIsUserEditing] = useState(false);

  useEffect(() => {
    // Only initialize/update the editor content if:
    // 1. It hasn't been initialized yet, OR
    // 2. The value changed externally (not from user typing) and the user is not currently editing
    const shouldUpdateContent = !hasInitialized || 
      (value !== lastExternalValue && !isUserEditing && value !== undefined && value !== null);

    if (shouldUpdateContent) {
      editor.update(() => {
        try {
          const root = $getRoot();
          root.clear();
          
          // Handle the initial value or updated value
          if (value !== undefined && value !== null) {
            const trimmedValue = String(value).trim();
            
            if (trimmedValue) {
              // If the value looks like HTML, try to parse it
              if (trimmedValue.includes('<') && trimmedValue.includes('>')) {
                try {
                  const parser = new DOMParser();
                  const dom = parser.parseFromString(trimmedValue, 'text/html');
                  const nodes = $generateNodesFromDOM(editor, dom);
                  
                  // Filter out invalid nodes and ensure we only add element nodes
                  const validNodes = nodes.filter(node => {
                    // Only allow element nodes (paragraphs, lists, etc.) not text nodes at root level
                    return node.getType() !== 'text' && (
                      node.getType() === 'paragraph' ||
                      node.getType() === 'heading' ||
                      node.getType() === 'list' ||
                      node.getType() === 'listitem' ||
                      node.getType() === 'quote'
                    );
                  });
                  
                  if (validNodes.length > 0) {
                    root.append(...validNodes);
                    setLastExternalValue(value);
                    setHasInitialized(true);
                    setIsUserEditing(false);
                    return;
                  }
                } catch (htmlError) {
                  console.warn('Error parsing HTML content:', htmlError);
                  // Fall through to plain text handling
                }
              }
              
              // Fallback: treat as plain text and create a paragraph
              const plainText = trimmedValue.replace(/<[^>]*>/g, '').trim();
              if (plainText) {
                const paragraph = $createParagraphNode();
                const textNode = $createTextNode(plainText);
                paragraph.append(textNode);
                root.append(paragraph);
                setLastExternalValue(value);
                setHasInitialized(true);
                setIsUserEditing(false);
                return;
              }
            }
          }
          
          // Default: add empty paragraph for empty values or when no content is provided
          const paragraph = $createParagraphNode();
          root.append(paragraph);
          setLastExternalValue(value);
          setHasInitialized(true);
          setIsUserEditing(false);
          
        } catch (error) {
          console.error('Error setting content:', error);
          // Ultimate fallback: empty paragraph
          const root = $getRoot();
          root.clear();
          const paragraph = $createParagraphNode();
          root.append(paragraph);
          setLastExternalValue(value);
          setHasInitialized(true);
          setIsUserEditing(false);
        }
      });
    }
  }, [editor, value, hasInitialized, lastExternalValue, isUserEditing]);

  // Track when user starts editing
  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    const handleInput = () => {
      setIsUserEditing(true);
    };

    const handleFocus = () => {
      setIsUserEditing(true);
    };

    const handleBlur = () => {
      // Reset editing state after a short delay to allow for final onChange events
      setTimeout(() => {
        setIsUserEditing(false);
      }, 100);
    };

    rootElement.addEventListener('input', handleInput);
    rootElement.addEventListener('focus', handleFocus);
    rootElement.addEventListener('blur', handleBlur);

    return () => {
      rootElement.removeEventListener('input', handleInput);
      rootElement.removeEventListener('focus', handleFocus);
      rootElement.removeEventListener('blur', handleBlur);
    };
  }, [editor]);

  return null;
}

// Plugin to prevent auto-focus issues
function FocusControlPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (rootElement) {
      // Prevent the editor from auto-focusing on state changes
      rootElement.setAttribute('contentEditable', 'true');
      rootElement.setAttribute('role', 'textbox');
      rootElement.setAttribute('spellCheck', 'false');
      rootElement.setAttribute('data-lexical-editor', 'true');
      
      // Override focus behavior
      const originalFocus = rootElement.focus;
      rootElement.focus = function(options?: FocusOptions) {
        // Only focus if the user explicitly clicked in the editor
        const activeElement = document.activeElement;
        if (activeElement && activeElement.tagName === 'INPUT') {
          return; // Don't steal focus from input fields
        }
        originalFocus.call(this, options);
      };
    }

    return () => {
      if (rootElement) {
        // Cleanup
        rootElement.focus = HTMLElement.prototype.focus;
      }
    };
  }, [editor]);

  return null;
}

interface RichTextEditorProps {
  label: string;
  value?: string;
  onChange: (html: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  minHeight?: number;
}

export default function RichTextEditor({
  label,
  value,
  onChange,
  error,
  placeholder = 'Enter your message...',
  required = false,
  minHeight = 120
}: RichTextEditorProps) {
  const initialConfig = {
    namespace: 'RichTextEditor',
    theme,
    onError: (error: Error) => {
      console.error('Lexical error:', error);
    },
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, AutoLinkNode],
    editorState: null, // Don't auto-focus
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className={`border rounded-lg overflow-hidden ${error ? 'border-red-300' : 'border-gray-300'} focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500`}>
        <LexicalComposer initialConfig={initialConfig}>
          <Toolbar />
          <div className="relative">
            <RichTextPlugin
              contentEditable={
                <ContentEditable 
                  className="max-h-[380px] overflow-y-auto p-3 text-sm text-gray-900 focus:outline-none resize-none"
                  style={{ minHeight: `${minHeight}px` }}
                  suppressContentEditableWarning={true}
                />
              }
              placeholder={
                <div className="absolute top-3 left-3 text-sm text-gray-400 pointer-events-none">
                  {placeholder}
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <ListPlugin />
            <HTMLContentPlugin value={value} />
            <FocusControlPlugin />
            <AutoLinkPlugin 
              matchers={[
                (text: string) => {
                  const match = /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&=]*)/gi.exec(text);
                  if (match === null) {
                    return null;
                  }
                  const fullMatch = match[0];
                  return {
                    index: match.index,
                    length: fullMatch.length,
                    text: fullMatch,
                    url: fullMatch.startsWith('http') ? fullMatch : `https://${fullMatch}`,
                  };
                }
              ]}
            />
            <EditorCapturePlugin onChange={onChange} />
          </div>
        </LexicalComposer>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
