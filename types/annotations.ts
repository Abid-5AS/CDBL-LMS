/**
 * Developer Annotation Mode Types
 * Provides type definitions for the annotation system that helps developers
 * understand component purposes and backend connections
 */

export type AnnotationType =
  | "component"
  | "api"
  | "hook"
  | "service"
  | "utility"
  | "database"
  | "workflow";

export type AnnotationCategory =
  | "data-flow"
  | "user-action"
  | "state-management"
  | "api-integration"
  | "business-logic"
  | "ui-presentation";

export interface Annotation {
  /** Unique identifier for the annotation */
  id: string;

  /** Display title */
  title: string;

  /** Detailed description of what this component/function does */
  description: string;

  /** Type of annotation */
  type: AnnotationType;

  /** Functional category */
  category: AnnotationCategory;

  /** File path relative to project root */
  filePath: string;

  /** Line number in the file (optional) */
  lineNumber?: number;

  /** Backend API endpoints this connects to */
  apiEndpoints?: string[];

  /** Database tables/models this interacts with */
  dbModels?: string[];

  /** Related components or files */
  relatedFiles?: string[];

  /** Key functions or hooks used */
  keyFunctions?: string[];

  /** Business logic or workflow description */
  workflow?: string;

  /** Data flow description */
  dataFlow?: string;

  /** Important notes for developers */
  notes?: string[];

  /** Tags for filtering */
  tags?: string[];
}

export interface AnnotationPosition {
  /** X coordinate in pixels or percentage */
  x: number | string;

  /** Y coordinate in pixels or percentage */
  y: number | string;

  /** Positioning strategy */
  strategy?: "absolute" | "fixed" | "relative";
}

export interface AnnotationMarker {
  /** Associated annotation */
  annotation: Annotation;

  /** Visual position on screen */
  position: AnnotationPosition;

  /** Whether this marker is currently visible */
  visible: boolean;

  /** Element ID to attach to (optional) */
  elementId?: string;

  /** CSS selector to attach to (optional) */
  selector?: string;
}

export interface AnnotationModeConfig {
  /** Whether annotation mode is active */
  enabled: boolean;

  /** Which categories to show */
  visibleCategories: AnnotationCategory[];

  /** Which types to show */
  visibleTypes: AnnotationType[];

  /** Whether to show all annotations or only on hover */
  showMode: "always" | "hover" | "click";

  /** Keyboard shortcut to toggle (default: Ctrl+Shift+A) */
  toggleShortcut?: string;

  /** Opacity of annotation overlays (0-1) */
  opacity?: number;

  /** Filter by tags */
  filterTags?: string[];
}
