import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
// import { Table } from 'antd';
import type { CSSProperties } from 'react';

interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  'data-row-key': string;
  style?: CSSProperties;
}

export const DraggableBodyRow = ({
  style,
  ...restProps
}: RowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: restProps['data-row-key']
  });

  const finalStyle: CSSProperties = {
    ...style,
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? { 
      cursor: 'grabbing',
      backgroundColor: '#fafafa',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      zIndex: 9999 
    } : {
      cursor: 'grab'
    }),
  };

  return (
    <tr
      ref={setNodeRef}
      style={finalStyle}
      {...attributes}
      {...listeners}
      {...restProps}
    />
  );
};