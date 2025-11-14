/**
 * Colors Barrel Export
 *
 * Central export for all color constants
 */

// Semantic colors
export {
  SEMANTIC_COLORS,
  FUNCTIONAL_COLORS,
  NEUTRAL_COLORS,
  COMPONENT_COLORS,
  INTERACTIVE_COLORS,
  ANIMATION_COLORS,
  getCSSVariable,
  getFunctionalColor,
} from "./semantic";

export type { };

// Role colors
export {
  ROLE_COLORS,
  getRoleColors,
  getRoleAccentColor,
  getRoleSoftColor,
  getRoleGradient,
  getRoleGradientClass,
  getAllRoleColors,
} from "./roles";

export type { RoleColorPalette } from "./roles";

// Status colors
export {
  StatusType,
  STATUS_COLORS,
  LEAVE_STATUS_COLORS,
  DATA_VIZ_COLORS,
  getStatusColor,
  getStatusBgColor,
  getStatusColorScheme,
  getLeaveStatusColor,
  mapLeaveStatusToType,
  getDataVizColor,
} from "./status";

export type { StatusColorScheme } from "./status";
