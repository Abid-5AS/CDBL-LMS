/**
 * Unit Tests for SearchInput Component
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchInput } from "@/components/filters/SearchInput";

describe("SearchInput Component", () => {
  it("should render with placeholder", () => {
    const handleChange = vi.fn();
    render(
      <SearchInput
        value=""
        onChange={handleChange}
        placeholder="Search leaves..."
      />
    );

    const input = screen.getByPlaceholderText("Search leaves...");
    expect(input).toBeInTheDocument();
  });

  it("should call onChange when user types", () => {
    const handleChange = vi.fn();
    render(<SearchInput value="" onChange={handleChange} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "test query" } });

    expect(handleChange).toHaveBeenCalledWith("test query");
  });

  it("should display initial value when provided", () => {
    const handleChange = vi.fn();
    render(<SearchInput value="initial value" onChange={handleChange} />);

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("initial value");
  });

  it("should update value when typing", () => {
    const handleChange = vi.fn();
    render(<SearchInput value="test" onChange={handleChange} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "new value" } });

    expect(handleChange).toHaveBeenCalledWith("new value");
  });

  it("should show search icon", () => {
    const handleChange = vi.fn();
    const { container } = render(<SearchInput value="" onChange={handleChange} />);

    // Check for search icon (svg or icon element)
    const icon = container.querySelector("svg");
    expect(icon).toBeTruthy();
  });

  it("should apply custom className", () => {
    const handleChange = vi.fn();
    const { container } = render(
      <SearchInput value="" onChange={handleChange} className="custom-search" />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("custom-search");
  });

  it("should render default placeholder when not provided", () => {
    const handleChange = vi.fn();
    render(<SearchInput value="" onChange={handleChange} />);

    const input = screen.getByPlaceholderText("Search...");
    expect(input).toBeInTheDocument();
  });

  it("should handle empty string value", () => {
    const handleChange = vi.fn();
    render(<SearchInput value="" onChange={handleChange} />);

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("");
  });
});
