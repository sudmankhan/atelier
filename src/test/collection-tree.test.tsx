import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Chandelier } from "@/components/Chandelier";

vi.mock("@/components/three/ChairPreview", () => ({
  default: ({ chair }: { chair: string }) => (
    <div data-testid="furniture-model-preview">{chair}</div>
  ),
}));

vi.mock("framer-motion", () => ({
  useReducedMotion: () => true,
  animate: (_from: number, to: number, options: { onUpdate: (value: number) => void }) => {
    options.onUpdate(to);
    return { stop: () => {} };
  },
}));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Collection branch tree", () => {
  it("opens model popups only from furniture endpoints and enters the working chair studies", async () => {
    const onOpen = vi.fn();
    render(<Chandelier onOpen={onOpen} />);
    for (const name of ["Chairs", "Tables", "Doors"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: "Modernist" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Winter" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Chairs" }));
    for (const name of ["Modernist", "Japanese", "Nordic", "Your own"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: "Kangaroo lounge chair" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Modernist" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Kangaroo lounge chair" }));
    expect(screen.getByRole("dialog", { name: "Kangaroo lounge chair" })).toBeInTheDocument();
    expect(await screen.findByTestId("furniture-model-preview")).toHaveTextContent("kangaroo");
    fireEvent.click(screen.getByRole("button", { name: "Set this piece on the bench" }));
    expect(onOpen).toHaveBeenLastCalledWith("kangaroo");
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    for (const [style, name, chair] of [
      ["Japanese", "Kuro spindle-back", "japanese"],
      ["Your own", "Component lab", "lab"],
    ] as const) {
      fireEvent.click(screen.getByRole("button", { name: style }));
      fireEvent.click(screen.getByRole("button", { name }));
      expect(screen.getByRole("dialog", { name })).toBeInTheDocument();
      expect(await screen.findByTestId("furniture-model-preview")).toHaveTextContent(chair);
      fireEvent.click(screen.getByRole("button", { name: "Set this piece on the bench" }));
      expect(onOpen).toHaveBeenLastCalledWith(chair);
      fireEvent.click(screen.getByRole("button", { name: "Close" }));
      fireEvent.click(screen.getByRole("button", { name: "Back" }));
      fireEvent.click(screen.getByRole("button", { name: "Back" }));
    }
  });

  it("unfolds preview collections without allowing entry to unavailable workshops", () => {
    const onOpen = vi.fn();
    render(<Chandelier onOpen={onOpen} />);
    for (const [category, style, title] of [
      ["Tables", "Dining", "Trestle dining table"],
      ["Beds", "Platform", "Low platform bed"],
      ["Doors", "Frame & panel", "Panelled oak door"],
    ]) {
      fireEvent.click(screen.getByRole("button", { name: `Show ${category} branch` }));
      fireEvent.click(screen.getByRole("button", { name: category }));
      fireEvent.click(screen.getByRole("button", { name: style }));
      fireEvent.click(screen.getByRole("button", { name: `${title}, preview only` }));
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
      const disabled = screen.getByRole("button", { name: "Coming soon · preview only" });
      expect(disabled).toBeDisabled();
      fireEvent.click(disabled);
      fireEvent.click(screen.getByRole("button", { name: "Close" }));
    }
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("zooms into selected branches and restores the full view", () => {
    render(<Chandelier onOpen={vi.fn()} />);
    const scene = screen.getByRole("group", { name: /^Atelier trunk/ });
    const width = () => Number(scene.getAttribute("viewBox")!.split(" ")[2]);
    const overview = width();
    fireEvent.click(screen.getByRole("button", { name: "Chairs" }));
    const categoryZoom = width();
    expect(categoryZoom).toBeLessThan(overview);
    fireEvent.click(screen.getByRole("button", { name: "Modernist" }));
    expect(width()).toBeLessThan(categoryZoom);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(width()).toBe(categoryZoom);
    fireEvent.click(screen.getByRole("button", { name: "Back to the collection" }));
    expect(width()).toBe(overview);
    fireEvent.click(screen.getByRole("button", { name: "Chairs" }));
    expect(width()).toBeLessThan(overview);
    fireEvent.click(screen.getByRole("button", { name: "Next branch" }));
    expect(width()).toBe(overview);
  });

  it("returns directly to an earlier category or style at its original zoom", () => {
    render(<Chandelier onOpen={vi.fn()} />);
    const scene = screen.getByRole("group", { name: /^Atelier trunk/ });
    fireEvent.click(screen.getByRole("button", { name: "Chairs" }));
    const categoryView = scene.getAttribute("viewBox");
    fireEvent.click(screen.getByRole("button", { name: "Modernist" }));
    const styleView = scene.getAttribute("viewBox");
    fireEvent.click(screen.getByRole("button", { name: "Return to Chairs" }));
    expect(scene).toHaveAttribute("viewBox", categoryView!);
    expect(screen.queryByRole("button", { name: "Kangaroo lounge chair" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Modernist" }));
    fireEvent.click(screen.getByRole("button", { name: "Kangaroo lounge chair" }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.click(screen.getByRole("button", { name: "Return to Modernist" }));
    expect(scene).toHaveAttribute("viewBox", styleView!);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("fades the category directly behind the front and removes it from keyboard focus", () => {
    render(<Chandelier onOpen={vi.fn()} />);
    const rear = screen.getByLabelText("Beds", { selector: "g" });
    expect(rear).toHaveAttribute("aria-hidden", "true");
    expect(rear).toHaveAttribute("tabindex", "-1");
    expect(Number(rear.getAttribute("opacity"))).toBeLessThan(0.08);
    fireEvent.click(screen.getByRole("button", { name: "Show Beds branch" }));
    expect(screen.getByRole("button", { name: "Beds" })).toHaveAttribute("aria-hidden", "false");
    expect(screen.getByLabelText("Chairs", { selector: "g" })).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("supports swipe, arrows and circular category navigation", () => {
    vi.stubGlobal("PointerEvent", MouseEvent);
    render(<Chandelier onOpen={vi.fn()} />);
    const tree = screen.getByRole("region", { name: /^Rotating branch tree/ });
    fireEvent.pointerDown(tree, { clientX: 240, clientY: 150, button: 0 });
    fireEvent.pointerMove(tree, { clientX: 150, clientY: 155 });
    fireEvent.pointerUp(tree);
    expect(screen.getByRole("button", { name: "Show Tables branch" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    fireEvent.keyDown(tree, { key: "ArrowLeft" });
    expect(screen.getByRole("button", { name: "Show Chairs branch" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "Previous branch" }));
    expect(screen.getByRole("button", { name: "Show Doors branch" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "Next branch" }));
    expect(screen.getByRole("button", { name: "Show Chairs branch" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });
});
