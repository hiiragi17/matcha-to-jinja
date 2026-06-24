import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// node:fs/promises を使うため Node.js ランタイムを明示する（Edge では動作しない）。
export const runtime = "nodejs";

export const alt = "抹茶と神社。";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// ロゴ（抹茶と神社。のタイトル文字を含む）を使うことで、
// Satori に日本語フォントを埋め込まずに OGP 画像を生成する。
export default async function OpengraphImage() {
  // ロゴが読めない場合でも 500 にせず、タイトル文字のフォールバックで描画する。
  let logoSrc = "";
  try {
    const logo = await readFile(join(process.cwd(), "public/brand/logo.png"));
    logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
  } catch {
    logoSrc = "";
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 48,
          background: "linear-gradient(135deg, #e4d8b5 0%, #f1e9cf 100%)",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 28,
            borderRadius: 28,
            border: "2px solid #d5c9a4",
            background: "#fbf6e5",
          }}
        >
          {logoSrc ? (
            <img
              src={logoSrc}
              alt=""
              width={360}
              height={360}
              style={{ objectFit: "contain" }}
            />
          ) : (
            <div style={{ fontSize: 64, letterSpacing: 8, color: "#3d3322" }}>
              MATCHA TO JINJA
            </div>
          )}
          <div
            style={{
              fontSize: 30,
              letterSpacing: 6,
              color: "#8a7a4e",
            }}
          >
            KYOTO MATCHA SWEETS &#215; SHRINES
          </div>
          <div
            style={{
              fontSize: 22,
              letterSpacing: 4,
              color: "#9c8b45",
            }}
          >
            unofficial guide
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
