// Vitest setup file with Testing Library and jest-dom
import "@testing-library/jest-dom/vitest";

// Extend Vitest matchers with jest-dom
import { expect } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);
