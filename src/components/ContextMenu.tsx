import { useCallback, useEffect, useRef, useState } from "react";
import { requestSurfaceAction } from "../features/windows/surfaceActions";
import { tileContextMenuItems } from "../features/windows/tileContextMenu";

interface MenuState {
  x: number;
  y: number;
  hasSelection: boolean;
  type: "edit" | "tile";
}

interface MenuItemEntry {
  label: string;
  shortcut: string;
  action: () => void;
  disabled: boolean;
  tone?: "danger";
}

type RenderItem = MenuItemEntry | { separator: true };

export function ContextMenuProvider({ children }: { children: React.ReactNode }) {
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [menuClosing, setMenuClosing] = useState(false);
  const [focusIndex, setFocusIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  // Dismiss and track closed target for focus restoration
  const lastActiveElRef = useRef<Element | null>(null);

  useEffect(() => {
    function handleContextMenu(event: MouseEvent) {
      const target = event.target as HTMLElement;
      const isEditable =
        target.tagName === "TEXTAREA" ||
        target.tagName === "INPUT" ||
        target.isContentEditable;
      const tileTarget = target.closest<HTMLElement>('[data-context-menu="tile"]');

      if (!isEditable && !tileTarget) {
        event.preventDefault();
        return;
      }

      event.preventDefault();

      if (tileTarget && event.ctrlKey) {
        requestSurfaceAction("close");
        return;
      }
      const selection = window.getSelection()?.toString() || "";

      let x = event.clientX;
      let y = event.clientY;
      const menuWidth = 160;
      const menuHeight = tileTarget ? 150 : 170;
      if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 4;
      if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 4;

      lastActiveElRef.current = document.activeElement;

      if (tileTarget) {
        setMenuClosing(false);
        setMenu({ x, y, hasSelection: false, type: "tile" });
        setFocusIndex(0);
        return;
      }

      setMenuClosing(false);
      setMenu({ x, y, hasSelection: selection.length > 0, type: "edit" });
      setFocusIndex(0);
    }

    function handleClick() {
      setMenuClosing(true);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuClosing(true);
    }

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!menuClosing || !menu) return;
    const timer = window.setTimeout(() => {
      setMenu(null);
      setMenuClosing(false);
      // Restore focus to the previously active element
      if (lastActiveElRef.current instanceof HTMLElement) {
        lastActiveElRef.current.focus();
      }
    }, 150);
    return () => window.clearTimeout(timer);
  }, [menuClosing, menu]);

  const dismissMenu = useCallback(() => {
    setMenuClosing(true);
  }, []);

  // --- Clipboard API helpers (prefer over deprecated execCommand) ---
  const clipboardCopy = useCallback(() => {
    const selection = window.getSelection()?.toString() ?? "";
    if (selection) {
      void navigator.clipboard.writeText(selection).catch(() => {
        document.execCommand("copy");
      });
    }
    dismissMenu();
  }, [dismissMenu]);

  const clipboardCut = useCallback(() => {
    const selection = window.getSelection()?.toString() ?? "";
    if (selection) {
      void navigator.clipboard.writeText(selection).catch(() => {
        document.execCommand("cut");
      });
      // Delete selected text from focused element
      document.execCommand("delete");
    }
    dismissMenu();
  }, [dismissMenu]);

  const clipboardPaste = useCallback(() => {
    // execCommand('paste') is still the most reliable cross-browser way
    // Clipboard API readText() requires permissions in some contexts
    document.execCommand("paste");
    dismissMenu();
  }, [dismissMenu]);

  const selectAll = useCallback(() => {
    const el = document.activeElement;
    if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
      el.select();
    } else {
      document.execCommand("selectAll");
    }
    dismissMenu();
  }, [dismissMenu]);

  const runSurfaceAction = (
    action: (typeof tileContextMenuItems)[number]["action"],
  ) => {
    requestSurfaceAction(action);
    dismissMenu();
  };

  // Build items
  const flatItems: RenderItem[] = menu
    ? menu.type === "tile"
      ? tileContextMenuItems.map((item) => ({
          label: item.label,
          shortcut: "",
          action: () => runSurfaceAction(item.action),
          disabled: false,
          tone: item.tone,
        }))
      : [
          { label: "剪切", shortcut: "Ctrl+X", action: clipboardCut, disabled: !menu.hasSelection },
          { label: "复制", shortcut: "Ctrl+C", action: clipboardCopy, disabled: !menu.hasSelection },
          { label: "粘贴", shortcut: "Ctrl+V", action: clipboardPaste, disabled: false },
          { separator: true as const },
          { label: "全选", shortcut: "Ctrl+A", action: selectAll, disabled: false },
        ]
    : [];

  const actionItems = flatItems.filter(
    (item): item is MenuItemEntry => !("separator" in item),
  );

  // Keyboard navigation handler
  const handleMenuKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setFocusIndex((prev) => (prev + 1) % actionItems.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setFocusIndex((prev) => (prev - 1 + actionItems.length) % actionItems.length);
        return;
      }
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        const item = actionItems[focusIndex];
        if (item && !item.disabled) item.action();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        dismissMenu();
        return;
      }
    },
    [actionItems, focusIndex, dismissMenu],
  );

  // Focus the active menu item when focusIndex changes
  useEffect(() => {
    if (!menuRef.current || actionItems.length === 0) return;
    const buttons = menuRef.current.querySelectorAll<HTMLButtonElement>("button");
    let btnIdx = 0;
    for (const item of flatItems) {
      if ("separator" in item) continue;
      if (btnIdx === focusIndex && buttons[btnIdx]) {
        buttons[btnIdx].focus();
        break;
      }
      btnIdx++;
    }
  }, [focusIndex, flatItems, actionItems.length]);

  return (
    <>
      {children}
      {menu && (
        <div
          ref={menuRef}
          className={`fixed z-[9999] min-w-[152px] py-1.5 bg-cloud/95 backdrop-blur-sm border border-paper-deep/50 rounded-lg overflow-hidden select-none ${menuClosing ? "animate-menu-exit" : "animate-menu-enter"}`}
          style={{ left: menu.x, top: menu.y }}
          onMouseDown={(event) => event.stopPropagation()}
          onKeyDown={handleMenuKeyDown}
        >
          {flatItems.map((item, index) =>
            "separator" in item ? (
              <div key={`sep-${index}`} className="mx-2 my-1 h-px bg-paper-deep/40" />
            ) : (
              <button
                key={item.label}
                onClick={() => { if (!item.disabled) item.action(); }}
                disabled={item.disabled}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-[12px] font-body transition-colors cursor-pointer disabled:text-ink-ghost/40 disabled:cursor-default disabled:hover:bg-transparent focus:outline-none focus:bg-bamboo-mist/60 focus:text-bamboo ${
                  item.tone === "danger"
                    ? "text-red-400 hover:bg-danger-bg hover:text-red-500"
                    : "text-ink-soft hover:bg-bamboo-mist/60 hover:text-bamboo"
                }`}
              >
                <span>{item.label}</span>
                {item.shortcut && (
                  <span className="text-[10px] text-ink-ghost/60 font-mono ml-6">
                    {item.shortcut}
                  </span>
                )}
              </button>
            ),
          )}
        </div>
      )}
    </>
  );
}
