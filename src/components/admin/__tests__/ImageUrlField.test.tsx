import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ImageUrlField from "@/components/admin/ImageUrlField";

describe("ImageUrlField — 画像 URL 入力とプレビュー", () => {
  it("ラベルと入力欄を関連付けて描画する", () => {
    render(
      <ImageUrlField
        id="img"
        label="画像URL"
        value=""
        registration={{ name: "img" }}
      />,
    );

    expect(screen.getByLabelText("画像URL")).toHaveAttribute("type", "url");
  });

  it("値が空のときはプレビューを表示しない", () => {
    render(
      <ImageUrlField
        id="img"
        label="画像URL"
        value="   "
        registration={{ name: "img" }}
      />,
    );

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("http(s) 以外の値ではプレビューを表示しない", () => {
    render(
      <ImageUrlField
        id="img"
        label="画像URL"
        value="ftp://example.com/a.png"
        registration={{ name: "img" }}
      />,
    );

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("有効な URL のときはプレビュー画像を表示する", () => {
    render(
      <ImageUrlField
        id="img"
        label="画像URL"
        value="https://example.com/a.png"
        registration={{ name: "img" }}
      />,
    );

    expect(screen.getByRole("img", { name: "プレビュー" })).toHaveAttribute(
      "src",
      "https://example.com/a.png",
    );
  });

  it("画像読み込みに失敗すると案内文へ切り替える", () => {
    render(
      <ImageUrlField
        id="img"
        label="画像URL"
        value="https://example.com/broken.png"
        registration={{ name: "img" }}
      />,
    );

    fireEvent.error(screen.getByRole("img", { name: "プレビュー" }));

    expect(
      screen.getByText(/画像を読み込めませんでした/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("error があればアラートとして表示する", () => {
    render(
      <ImageUrlField
        id="img"
        label="画像URL"
        value=""
        error="URL の形式が不正です"
        registration={{ name: "img" }}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("URL の形式が不正です");
  });

  it("入力時に registration の onChange を呼び、broken 状態をリセットする", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ImageUrlField
        id="img"
        label="画像URL"
        value="https://example.com/broken.png"
        registration={{ name: "img", onChange }}
      />,
    );

    // 一度失敗させて broken 状態にする。
    fireEvent.error(screen.getByRole("img", { name: "プレビュー" }));
    expect(screen.getByText(/画像を読み込めませんでした/)).toBeInTheDocument();

    await user.type(screen.getByLabelText("画像URL"), "x");

    expect(onChange).toHaveBeenCalled();
    // broken がリセットされ、再び img（プレビュー）が描画される。
    expect(screen.getByRole("img", { name: "プレビュー" })).toBeInTheDocument();
  });
});
