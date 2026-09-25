/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';
import { ListPlugin as LexicalListPlugin } from '@lexical/react/LexicalListPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $isListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from '@lexical/list';
import {
  $getSelection,
  $isRangeSelection,
  $isElementNode,
} from 'lexical';
import { useCallback } from 'react';

export function ListPlugin() {
  return <LexicalListPlugin />;
}

export function useListToolbar() {
  const [editor] = useLexicalComposerContext();

  const formatBulletList = useCallback(() => {
    if (!editor.isEditable()) {
      return;
    }
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
  }, [editor]);

  const formatNumberedList = useCallback(() => {
    if (!editor.isEditable()) {
      return;
    }
    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
  }, [editor]);

  const removeList = useCallback(() => {
    if (!editor.isEditable()) {
      return;
    }
    editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
  }, [editor]);

  const getListType = useCallback(() => {
    return editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        const element = 
          anchorNode.getKey() === 'root'
            ? anchorNode
            : $isElementNode(anchorNode)
            ? anchorNode
            : anchorNode.getParentOrThrow();
        
        const elementKey = element.getKey();
        const elementDOM = editor.getElementByKey(elementKey);
        
        if (elementDOM !== null) {
          const parent = element.getParent();
          if ($isListNode(parent)) {
            const listType = parent.getListType();
            return listType;
          }
          if ($isListNode(element)) {
            const listType = element.getListType();
            return listType;
          }
        }
      }
      return null;
    });
  }, [editor]);

  const isBulletList = useCallback(() => {
    return getListType() === 'bullet';
  }, [getListType]);

  const isNumberedList = useCallback(() => {
    return getListType() === 'number';
  }, [getListType]);

  return {
    formatBulletList,
    formatNumberedList,
    removeList,
    isBulletList,
    isNumberedList,
    getListType,
  };
}
