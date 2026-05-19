import chroma from "chroma-js";
import type { CSSProperties, HTMLAttributes } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import type { Components } from "react-markdown";
import {
  DEFAULT_TILE_COLOR,
  normalizeTileColor,
  tileColorAlpha,
  tileColorHex6,
} from "../features/settings/tileColor";

export interface TileProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "color" | "content" | "title"> {
  title?: string;
  content: string;
  color?: string;
  width?: number | string;
  rotation?: number;
  fontSize?: number;
  markdown?: boolean;
}

const MARK_SIZE = 8;
const MARK_OFFSET = 6;

const cornerPaths = [
  {
    pos: { top: MARK_OFFSET, left: MARK_OFFSET },
    d: `M0,${MARK_SIZE} L0,0 L${MARK_SIZE},0`,
  },
  {
    pos: { top: MARK_OFFSET, right: MARK_OFFSET },
    d: `M0,0 L${MARK_SIZE},0 L${MARK_SIZE},${MARK_SIZE}`,
  },
  {
    pos: { bottom: MARK_OFFSET, left: MARK_OFFSET },
    d: `M0,0 L0,${MARK_SIZE} L${MARK_SIZE},${MARK_SIZE}`,
  },
  {
    pos: { bottom: MARK_OFFSET, right: MARK_OFFSET },
    d: `M${MARK_SIZE},0 L${MARK_SIZE},${MARK_SIZE} L0,${MARK_SIZE}`,
  },
];

function CornerMarks({ color }: { color: string }) {
  return (
    <>
      {cornerPaths.map((mark, index) => (
        <svg
          key={index}
          className="absolute pointer-events-none"
          data-tile-corner-mark="true"
          style={mark.pos as CSSProperties}
          width={MARK_SIZE}
          height={MARK_SIZE}
          viewBox={`0 0 ${MARK_SIZE} ${MARK_SIZE}`}
        >
          <path
            d={mark.d}
            stroke={color}
            strokeWidth="0.8"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </>
  );
}

function tileMdComponents(): Components {
  return {
    h1: ({ children, style, ...props }) => (
      <h1 className="font-display font-bold mt-5 mb-3 tracking-wide" style={{ color: "var(--tile-accent-color)", fontSize: "calc(var(--tile-font-size) + 6px)", ...style }} {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, style, ...props }) => (
      <h2 className="font-display font-bold mt-4 mb-2 tracking-wide" style={{ color: "var(--tile-accent-color)", fontSize: "calc(var(--tile-font-size) + 3px)", ...style }} {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, style, ...props }) => (
      <h3 className="font-display font-bold mt-3 mb-1.5 tracking-wide" style={{ color: "var(--tile-accent-color)", fontSize: "calc(var(--tile-font-size) + 1px)", ...style }} {...props}>
        {children}
      </h3>
    ),
    h4: ({ children, style, ...props }) => (
      <h4 className="font-display font-semibold mt-3 mb-1 tracking-wide" style={{ color: "var(--tile-content-color)", fontSize: "var(--tile-font-size)", ...style }} {...props}>
        {children}
      </h4>
    ),
    p: ({ children, style, ...props }) => (
      <p className="leading-[1.8] mb-1.5" style={{ color: "var(--tile-content-color)", fontSize: "var(--tile-font-size)", ...style }} {...props}>
        {children}
      </p>
    ),
    strong: ({ children, style, ...props }) => (
      <strong className="font-semibold" style={{ color: "var(--tile-accent-color)", ...style }} {...props}>
        {children}
      </strong>
    ),
    em: ({ children, style, ...props }) => (
      <em className="italic" style={{ color: "var(--tile-muted-color)", ...style }} {...props}>
        {children}
      </em>
    ),
    blockquote: ({ children, style, ...props }) => (
      <blockquote className="border-l-2 pl-3 my-2 italic leading-[1.8]" style={{ borderColor: "var(--tile-border-color)", color: "var(--tile-muted-color)", fontSize: "var(--tile-font-size)", ...style }} {...props}>
        {children}
      </blockquote>
    ),
    ul: ({ children, style, ...props }) => (
      <ul className="ml-4 leading-[1.8] list-disc list-outside mb-1.5" style={{ color: "var(--tile-content-color)", fontSize: "var(--tile-font-size)", ...style }} {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, style, ...props }) => (
      <ol className="ml-4 leading-[1.8] list-decimal list-outside mb-1.5" style={{ color: "var(--tile-content-color)", fontSize: "var(--tile-font-size)", ...style }} {...props}>
        {children}
      </ol>
    ),
    li: ({ children, style, ...props }) => (
      <li className="leading-[1.8]" style={{ color: "var(--tile-content-color)", ...style }} {...props}>
        {children}
      </li>
    ),
    hr: () => (
      <hr className="my-3 border-none h-px" style={{ background: "var(--tile-border-color)" }} />
    ),
    code: ({ className, children, style, ...props }) => {
      const isBlock = className?.startsWith("language-") || String(children).includes("\n");
      if (isBlock) {
        return (
          <code className="text-[12px] font-mono leading-[1.7] whitespace-pre" style={{ color: "var(--tile-content-color)", ...style }} {...props}>
            {children}
          </code>
        );
      }
      return (
        <code className="px-1.5 py-0.5 text-[11px] font-mono rounded" style={{ backgroundColor: "var(--tile-code-bg)", color: "var(--tile-accent-color)", ...style }} {...props}>
          {children}
        </code>
      );
    },
    pre: ({ children, style, ...props }) => (
      <pre className="my-2 px-3 py-2 rounded overflow-x-auto" style={{ backgroundColor: "var(--tile-code-bg)", fontSize: "var(--tile-font-size)", ...style }} {...props}>
        {children}
      </pre>
    ),
    a: ({ href, children, style, ...props }) => (
      <a
        href={href}
        className="underline underline-offset-2 cursor-pointer"
        style={{ color: "var(--tile-accent-color)", ...style }}
        {...props}
        onClick={(e) => {
          e.preventDefault();
          if (href) {
            // Use native open for Tauri compatibility when available
            try {
              void import("@tauri-apps/plugin-opener").then(({ openUrl }) => openUrl(href));
            } catch {
              window.open(href, "_blank");
            }
          }
        }}
      >
        {children}
      </a>
    ),
    table: ({ children, style, ...props }) => (
      <div className="my-2 overflow-x-auto">
        <table className="w-full text-[12px] border-collapse" style={{ fontSize: "var(--tile-font-size)", ...style }} {...props}>
          {children}
        </table>
      </div>
    ),
    th: ({ children, style, ...props }) => (
      <th className="text-left px-2 py-1 font-semibold border-b" style={{ borderColor: "var(--tile-border-color)", color: "var(--tile-accent-color)", ...style }} {...props}>
        {children}
      </th>
    ),
    td: ({ children, style, ...props }) => (
      <td className="px-2 py-1 border-b" style={{ borderColor: "var(--tile-border-color)", color: "var(--tile-content-color)", ...style }} {...props}>
        {children}
      </td>
    ),
    input: ({ checked, style, ...props }) => (
      <input
        {...props}
        checked={checked}
        disabled
        className="mr-1.5"
        style={style}
      />
    ),
  };
}

function TileMarkdownContent({ content }: { content: string }) {
  if (!content.trim()) {
    return (
      <p className="leading-[1.8] font-body" style={{ color: "var(--tile-muted-color)", fontSize: "var(--tile-font-size)" }}>
        空
      </p>
    );
  }

  return (
    <div className="font-body" style={{ fontSize: "var(--tile-font-size)" }}>
      <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={tileMdComponents()}>
        {content}
      </Markdown>
    </div>
  );
}

export function Tile({
  title,
  content,
  color = DEFAULT_TILE_COLOR,
  width = 260,
  rotation = 0,
  fontSize = 14,
  markdown = false,
  className = "",
  style,
  children,
  ...divProps
}: TileProps) {
  const tileColor = normalizeTileColor(color);
  const alpha = tileColorAlpha(tileColor);
  const isTransparent = alpha < 1;
  const hex6 = tileColorHex6(tileColor);

  const isDarkTheme =
    typeof document !== "undefined" &&
    document.documentElement.getAttribute("data-theme") === "dark";

  // Theme-aware text colors for transparent backgrounds
  const themeContentColor = isDarkTheme ? "rgba(255,255,255,0.85)" : "rgba(26,26,24,0.85)";
  const themeMutedColor = isDarkTheme ? "rgba(255,255,255,0.55)" : "rgba(26,26,24,0.55)";
  const themeAccentColor = isDarkTheme ? "rgba(255,255,255,0.92)" : "rgba(26,26,24,0.92)";
  const themeCodeBg = isDarkTheme ? "rgba(255,255,255,0.08)" : "rgba(26,26,24,0.06)";
  const themeBorderColor = isDarkTheme ? "rgba(255,255,255,0.12)" : "rgba(26,26,24,0.12)";
  const themeTitleColor = isDarkTheme ? "rgba(255,255,255,0.45)" : "rgba(26,26,24,0.45)";
  const themeEmptyColor = isDarkTheme ? "rgba(255,255,255,0.3)" : "rgba(26,26,24,0.3)";
  const themeCornerColor = isDarkTheme ? "rgba(255,255,255,0.18)" : "rgba(26,26,24,0.18)";

  // Chroma-based colors for solid backgrounds
  const isLightBg = chroma(hex6).luminance() > 0.18;
  const mixTarget = isLightBg ? "#1a1a18" : "#ffffff";
  const solidBorderColor = chroma.mix(hex6, mixTarget, 0.18).alpha(0.3).css();
  const solidCornerColor = chroma.mix(hex6, mixTarget, 0.3).alpha(0.26).css();
  const solidTitleColor = chroma.mix(hex6, mixTarget, 0.4).alpha(0.5).css();
  const solidContentColor = chroma.mix(hex6, mixTarget, 0.65).alpha(0.85).css();
  const solidEmptyColor = chroma.mix(hex6, mixTarget, 0.25).alpha(0.4).css();
  const solidMutedColor = chroma.mix(hex6, mixTarget, 0.5).alpha(0.65).css();
  const solidAccentColor = chroma.mix(hex6, mixTarget, 0.75).alpha(0.95).css();
  const solidCodeBgColor = chroma.mix(hex6, mixTarget, 0.08).alpha(0.5).css();

  // Pick correct set based on transparency
  const borderColor = isTransparent ? themeBorderColor : solidBorderColor;
  const cornerColor = isTransparent ? themeCornerColor : solidCornerColor;
  const titleColor = isTransparent ? themeTitleColor : solidTitleColor;
  const contentColor = isTransparent ? themeContentColor : solidContentColor;
  const emptyColor = isTransparent ? themeEmptyColor : solidEmptyColor;
  const mutedColor = isTransparent ? themeMutedColor : solidMutedColor;
  const accentColor = isTransparent ? themeAccentColor : solidAccentColor;
  const codeBgColor = isTransparent ? themeCodeBg : solidCodeBgColor;

  const backgroundColor = isTransparent
    ? alpha === 0
      ? "transparent"
      : chroma(hex6).alpha(alpha).css()
    : hex6;

  const mergedStyle: CSSProperties = {
    width,
    backgroundColor,
    borderColor,
    transition: "box-shadow 0.3s ease",
    ...(isTransparent ? { backdropFilter: "blur(8px)" } : {}),
    ...(rotation ? { transform: `rotate(${rotation}deg)` } : {}),
    ...style,
  };

  const tileCssVars = {
    "--tile-content-color": contentColor,
    "--tile-muted-color": mutedColor,
    "--tile-accent-color": accentColor,
    "--tile-code-bg": codeBgColor,
    "--tile-border-color": borderColor,
    "--tile-font-size": `${fontSize}px`,
  } as CSSProperties;

  return (
    <div
      {...divProps}
      className={`relative rounded-xl border overflow-hidden select-none shadow-[0_1px_8px_rgba(26,26,24,0.04)] hover:shadow-[0_6px_24px_rgba(26,26,24,0.07)] ${className}`}
      style={{ ...mergedStyle, ...(markdown ? tileCssVars : {}) }}
    >
      <div className="px-4 pt-4 pb-4 h-full overflow-y-auto scrollbar-hidden">
        {title && (
          <div className="font-display tracking-wide mb-3 leading-snug" style={{ color: titleColor, fontSize: `${fontSize + 1}px` }}>
            {title}
          </div>
        )}
        {content ? (
          markdown ? (
            <TileMarkdownContent content={content} />
          ) : (
            <div className="leading-[1.8] whitespace-pre-wrap font-body" style={{ color: contentColor, fontSize: `${fontSize}px` }}>
              {content}
            </div>
          )
        ) : (
          <div className="font-body text-center py-6" style={{ color: emptyColor, fontSize: `${fontSize}px` }}>
            空
          </div>
        )}
      </div>

      <CornerMarks color={cornerColor} />
      {children}
    </div>
  );
}

