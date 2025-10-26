"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import type { DashboardSectionId } from "@/hooks/useDashboardLayout";
import { GripVertical } from "lucide-react";

type DashboardContainerProps = {
  layout: DashboardSectionId[];
  customizeMode: boolean;
  saveLayout: (layout: DashboardSectionId[]) => void;
  sections: Record<DashboardSectionId, React.ReactNode>;
};

type DashboardSectionProps = {
  id: DashboardSectionId;
  customizeMode: boolean;
  children: React.ReactNode;
};

function DashboardSection({ id, customizeMode, children }: DashboardSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !customizeMode,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 ease-in-out",
        "hover:shadow-md",
        customizeMode && "border-dashed border-2 border-blue-300",
        isDragging && "opacity-80",
      )}
    >
      <div className={cn("relative", customizeMode && "cursor-grab")}>
        {customizeMode && (
          <button
            type="button"
            className="absolute right-0 top-0 -mt-3 -mr-2 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-slate-600"
            {...attributes}
            {...listeners}
            aria-label="Drag section"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

export function DashboardContainer({ layout, customizeMode, saveLayout, sections }: DashboardContainerProps) {
  const [items, setItems] = useState<DashboardSectionId[]>(layout);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    setItems(layout);
  }, [layout]);

  const activeSections = useMemo(
    () => items.filter((id) => sections[id]),
    [items, sections],
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.indexOf(active.id as DashboardSectionId);
    const newIndex = items.indexOf(over.id as DashboardSectionId);
    if (oldIndex === -1 || newIndex === -1) return;
    const newLayout = arrayMove(items, oldIndex, newIndex);
    setItems(newLayout);
    saveLayout(newLayout);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={activeSections} strategy={verticalListSortingStrategy}>
        <div className="space-y-6">
          {activeSections.map((id) => (
            <DashboardSection key={id} id={id} customizeMode={customizeMode}>
              {sections[id]}
            </DashboardSection>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
