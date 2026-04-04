import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';


const isTypingTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
};


export const useDiagramShortcuts = () => {
  const selectedNodeId = useAppStore((state) => state.selectedNodeId);
  const setClipboardNode = useAppStore((state) => state.setClipboardNode);
  const clipboardNode = useAppStore((state) => state.clipboardNode);
  const nodes = useAppStore((state) => state.nodes);
  const duplicateAssetNodeInstance = useAppStore((state) => state.duplicateAssetNodeInstance);
  const removeSelectedElement = useAppStore((state) => state.removeSelectedElement);
  const undo = useAppStore((state) => state.undo);
  const redo = useAppStore((state) => state.redo);
  const exportDocumentJson = useAppStore((state) => state.exportDocumentJson);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const ctrl = event.ctrlKey || event.metaKey;
      const typing = isTypingTarget(event.target);

      if ((event.key === 'Delete' || event.key === 'Backspace') && !ctrl && !typing) {
        event.preventDefault();
        removeSelectedElement();
        return;
      }

      if (ctrl && event.key.toLowerCase() === 'c' && !typing) {
        event.preventDefault();
        const node = nodes.find((n) => n.id === selectedNodeId);
        if (node?.type === 'asset') {
          setClipboardNode(node);
        }
        return;
      }

      if (ctrl && event.key.toLowerCase() === 'v' && !typing) {
        event.preventDefault();
        if (clipboardNode?.type === 'asset') {
          duplicateAssetNodeInstance(clipboardNode.id);
        }
        return;
      }

      if (ctrl && event.key.toLowerCase() === 'z' && !event.shiftKey && !typing) {
        event.preventDefault();
        undo();
        return;
      }

      if (((ctrl && event.key.toLowerCase() === 'y') || (ctrl && event.shiftKey && event.key.toLowerCase() === 'z')) && !typing) {
        event.preventDefault();
        redo();
        return;
      }

      if (ctrl && event.key.toLowerCase() === 's') {
        event.preventDefault();
        exportDocumentJson();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [clipboardNode, duplicateAssetNodeInstance, exportDocumentJson, nodes, redo, removeSelectedElement, selectedNodeId, setClipboardNode, undo]);
};
