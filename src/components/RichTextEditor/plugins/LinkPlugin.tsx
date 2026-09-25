/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';
import { AutoLinkPlugin as LexicalAutoLinkPlugin } from '@lexical/react/LexicalAutoLinkPlugin';
import { LinkPlugin as LexicalLinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $isLinkNode,
  TOGGLE_LINK_COMMAND,
} from '@lexical/link';
import {
  $getSelection,
  $isRangeSelection,
  LexicalNode,
} from 'lexical';
import { useCallback } from 'react';

const URL_MATCHER =
  /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

const EMAIL_MATCHER =
  /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

const MATCHERS = [
  (text: string) => {
    const match = URL_MATCHER.exec(text);
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
  },
  (text: string) => {
    const match = EMAIL_MATCHER.exec(text);
    if (match === null) {
      return null;
    }
    const fullMatch = match[0];
    return {
      index: match.index,
      length: fullMatch.length,
      text: fullMatch,
      url: `mailto:${fullMatch}`,
    };
  },
];

function validateUrl(url: string): boolean {
  // TODO: Let the user configure this.
  return url.startsWith('https://') || url.startsWith('http://') || url.startsWith('mailto:');
}

export function LinkPlugin() {
  return <LexicalLinkPlugin validateUrl={validateUrl} />;
}

export function AutoLinkPlugin() {
  return <LexicalAutoLinkPlugin matchers={MATCHERS} />;
}

export function useLinkToolbar() {
  const [editor] = useLexicalComposerContext();

  const insertLink = useCallback(() => {
    if (!editor.isEditable()) {
      return;
    }
    
    const url = prompt('Enter URL:');
    if (url !== null && url !== '') {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, validateUrl(url) ? url : null);
    }
  }, [editor]);

  const isLink = useCallback(() => {
    return editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        const focusNode = selection.focus.getNode();
        
        // Check if any of the selected nodes or their parents are link nodes
        const checkNodeForLink = (node: LexicalNode) => {
          if ($isLinkNode(node)) return true;
          const parent = node.getParent();
          if (parent && $isLinkNode(parent)) return true;
          return false;
        };
        
        return checkNodeForLink(anchorNode) || checkNodeForLink(focusNode);
      }
      return false;
    });
  }, [editor]);

  const removeLink = useCallback(() => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
  }, [editor]);

  return {
    insertLink,
    removeLink,
    isLink,
  };
}
