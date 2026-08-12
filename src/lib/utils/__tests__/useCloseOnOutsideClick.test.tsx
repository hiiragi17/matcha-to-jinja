import { fireEvent, render } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it } from "vitest";
import { useCloseOnOutsideClick } from "@/lib/utils/useCloseOnOutsideClick";

function TestMenu() {
  const ref = useRef<HTMLDetailsElement>(null);
  useCloseOnOutsideClick(ref);
  return (
    <details ref={ref} data-testid="details">
      <summary>toggle</summary>
      <div>content</div>
    </details>
  );
}

describe("useCloseOnOutsideClick", () => {
  it("開いている状態で外側をクリックすると閉じる", () => {
    const { getByTestId } = render(<TestMenu />);
    const details = getByTestId("details") as HTMLDetailsElement;
    details.open = true;

    fireEvent.click(document.body);

    expect(details.open).toBe(false);
  });

  it("要素内側のクリックでは閉じない", () => {
    const { getByTestId, getByText } = render(<TestMenu />);
    const details = getByTestId("details") as HTMLDetailsElement;
    details.open = true;

    fireEvent.click(getByText("content"));

    expect(details.open).toBe(true);
  });

  it("もともと閉じている状態では何もしない", () => {
    const { getByTestId } = render(<TestMenu />);
    const details = getByTestId("details") as HTMLDetailsElement;
    expect(details.open).toBe(false);

    fireEvent.click(document.body);

    expect(details.open).toBe(false);
  });
});
