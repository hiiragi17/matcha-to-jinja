import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ShareButtons from "@/components/common/ShareButtons";

describe("ShareButtons", () => {
  it("マウント後に X / LINE のシェアリンクを表示する", async () => {
    render(<ShareButtons title="中村藤吉本店" />);

    const twitter = await screen.findByLabelText("X（Twitter）でシェア");
    const line = screen.getByLabelText("LINEでシェア");

    const url = window.location.href;
    expect(twitter).toHaveAttribute(
      "href",
      `https://twitter.com/intent/tweet?text=${encodeURIComponent("中村藤吉本店")}&url=${encodeURIComponent(url)}`,
    );
    expect(line).toHaveAttribute(
      "href",
      `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`,
    );
  });

  it("シェアリンクは別タブ・noopener で開く", async () => {
    render(<ShareButtons title="伏見稲荷大社" />);

    const twitter = await screen.findByLabelText("X（Twitter）でシェア");
    expect(twitter).toHaveAttribute("target", "_blank");
    expect(twitter).toHaveAttribute("rel", "noopener noreferrer");
  });
});
