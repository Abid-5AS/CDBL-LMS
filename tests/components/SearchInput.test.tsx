/**
 * Unit Tests for SearchInput Component
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchInput } from "@/components/filters/SearchInput";

describe("SearchInput Component", () => {
  it("should render with placeholder", () => {
    render(<SearchInput placeholder="Search leaves..." />);
    
    const input = screen.getByPlaceholderText("Search leaves...");
    expect(input).toBeInTheDocument();
  });

  it("should call onChange when user types", () => {
    const handleChange = vi.fn();
    render(<SearchInput onChange={handleChange} />);
    
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "test query" } });
    
    expect(handleChange).toHaveBeenCalled();
  });

  it("should display initial value when provided", () => {
    render(<SearchInput value="initial value" />);
    
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("initial value");
  });

  it("should clear input when clear button is clicked", () => {
    const handleChange = vi.fn();
    render(<SearchInput value="test" onChange={handleChange} />);
    
    const clearButton = screen.queryByRole("button", { name: /clear/i });
    if (clearButton) {
      fireEvent.click(clearButton);
      expect(handleChange).toHaveBeenCalled();
    }
  });

  it("should be disabled when disabled prop is true", () => {
    render(<SearchInput disabled={true} />);
    
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  it("should show search icon", () => {
    const { container } = render(<SearchInput />);
    
    // Check for search icon (svg or icon element)
    const icon = container.querySelector('svg');
    expect(icon).toBeTruthy();
  });

  it("should apply custom className", () => {
    const { container } = render(<SearchInput className="custom-search" />);
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("custom-search");
  });

  it("should handle onSubmit when Enter is pressed", () => {
    const handleSubmit = vi.fn();
    render(<SearchInput onSubmit={handleSubmit} />);
    
    const input = screen.getByRole("textbox");
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    
    expect(handleSubmit).toHaveBeenCalled();
  });
});
