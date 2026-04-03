import { useEffect } from 'react';
import { useAssessorStore } from '../store/useAssessorStore';

export const useCanvasHotkeys = () => {
  const deleteSelection = useAssessorStore((state) => state.deleteSelection);
  const duplicateSelection = useAssessorStore((state) => state.duplicateSelection);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete') {
        deleteSelection();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
        event.preventDefault();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v') {
        event.preventDefault();
        duplicateSelection();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deleteSelection, duplicateSelection]);
};
