
import React from 'react';
import {useDroppable} from '@dnd-kit/core';

type DroppableProps = {
    id: string;
    children: React.ReactNode;
}

export function Droppable(props: DroppableProps) {
  const {isOver, setNodeRef} = useDroppable({
    id: props.id,
  });
  const style = {
    opacity: isOver ? 1 : 0.5,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {props.children}
    </div>
  );
}
  