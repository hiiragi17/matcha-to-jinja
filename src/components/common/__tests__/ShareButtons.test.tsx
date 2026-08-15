import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ShareButtons from "@/components/common/ShareButtons";

describe("ShareButtons", () => {
  it("マウント後に X / LINE のシェアリンクを表示する", async () => {
    render(<ShareButtons title="中村藤吉本店" hashtags={["抹茶スイーツ"]} />);

    const twitter = await screen.findByLabelText("X（Twitter）でシェア");
    const line = screen.getByLabelText("LINEでシェア");

    const url = window.location.href;
    const text = "抹茶と神社で見つけた素敵なスポット『中村藤吉本店』をシェアします🍵";
    expect(twitter).toHaveAttribute(
      "href",
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=${encodeURIComponent("抹茶と神社,抹茶スイーツ")}`,
    );
    expect(line).toHaveAttribute(
      "href",
      `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`,
    );
  });

  it("hashtags を指定しない場合は「抹茶と神社」のみが付与される", async () => {
    render(<ShareButtons title="伏見稲荷大社" />);

    const twitter = await screen.findByLabelText("X（Twitter）でシェア");
    expect(twitter.getAttribute("href")).toContain(
      `hashtags=${encodeURIComponent("抹茶と神社")}`,
    );
  });

  it("シェアリンクは別タブ・noopener で開く", async () => {
    render(<ShareButtons title="伏見稲荷大社" />);

    const twitter = await screen.findByLabelText("X（Twitter）でシェア");
    const line = screen.getByLabelText("LINEでシェア");
    expect(twitter).toHaveAttribute("target", "_blank");
    expect(twitter).toHaveAttribute("rel", "noopener noreferrer");
    expect(line).toHaveAttribute("target", "_blank");
    expect(line).toHaveAttribute("rel", "noopener noreferrer");
  });
});
