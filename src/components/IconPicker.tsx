"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import clsx from "clsx";
import type { LucideProps } from "lucide-react";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import dynamic from "next/dynamic";
import React, {
  FC,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface IconPickerProps {
  value?: string | null;
  onChange: (name: string | null) => void;
  onClose: () => void;
}

type IconName = keyof typeof dynamicIconImports;
type IconComponent = FC<LucideProps>;

/**
 * Cache for dynamically created icon components to avoid recreating components for the same icon name.
 */
const iconComponentCache = new Map<IconName, IconComponent>();

/**
 * Skeleton for icon while loading. Sized to match icon area for visual continuity.
 */
function IconSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="animate-pulse rounded bg-neutral-200"
      style={{ width: 22, height: 22 }}
    />
  );
}

/**
 * Build icon component on demand and cache it.
 */
function getIconComponent(name: IconName): IconComponent {
  let Comp = iconComponentCache.get(name);
  if (!Comp) {
    Comp = dynamic(async () => {
      const mod = await dynamicIconImports[name]();
      return mod.default;
    }, {
      ssr: false,
      loading: () => <IconSkeleton />,
    }) as unknown as IconComponent;

    iconComponentCache.set(name, Comp);
  }
  return Comp;
}

/**
 * Exported helper that returns a Lucide Icon element by its name.
 * - If name is invalid or empty, returns null.
 * - Props are forwarded to the icon component.
 */
export function getIcon(
  name: string,
  props?: LucideProps
): React.ReactElement {
  if (!Object.prototype.hasOwnProperty.call(dynamicIconImports, name)) {
    return <></>;
  }

  const Comp = getIconComponent(name as IconName);
  return <Comp {...props} />;
}

/**
 * Precompute and sort all icon names once.
 */
const ALL_ICON_NAMES = Object.keys(dynamicIconImports).sort() as IconName[];

/**
 * Constants for visual sizing.
 * ITEM_SIZE controls the inner button size. GAP must match the CSS grid gap.
 */
const ITEM_SIZE = 52; // px, button width/height
const GAP = 4;        // px, must match the grid gap

/**
 * Utility: read computed number of grid columns from an element using CSS Grid.
 * This counts the resolved tracks from getComputedStyle(grid).gridTemplateColumns.
 * If it cannot be read, it falls back to a calculation based on width, item size, and gap.
 */
function readComputedGridColumnCount(el: HTMLElement | null): number {
  if (!el) return 1;
  const cs = getComputedStyle(el);
  const tmpl = cs.gridTemplateColumns || "";
  // When resolved, gridTemplateColumns becomes a list of track sizes like "80px 80px 80px ..."
  const tracks = tmpl.trim().split(/\s+/).filter(Boolean);
  let count = tracks.length;

  if (count === 0 || tmpl === "none") {
    // Fallback: compute from width if template is not resolved
    const width = el.clientWidth;
    count = Math.max(1, Math.floor((width + GAP) / (ITEM_SIZE + GAP)));
  }
  return count;
}

/**
 * A memoized icon button to avoid unnecessary rerenders.
 * Keep size fixed and avoid heavy CSS effects to reduce paint cost.
 */
const IconButton = React.memo(function IconButton(props: {
  name: IconName;
  selected: boolean;
  onSelect: (name: IconName) => void;
}) {
  const { name, selected, onSelect } = props;
  const Comp = getIconComponent(name);

  const handleClick = useCallback(() => {
    onSelect(name);
  }, [name, onSelect]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={clsx(
        "group flex items-center justify-center btn btn-ghost !transition-none",
        selected
          ? "!bg-primary/5 !border-primary"
          : "!bg-[var(--surface)] !border-none hover:!bg-neutral-200"
      )}
      aria-label={name}
      title={name}
      style={{
        width: ITEM_SIZE,
        height: ITEM_SIZE,
      }}
    >
      <Comp size={22} strokeWidth={1.6} />
    </button>
  );
}, (prev, next) => prev.name === next.name && prev.selected === next.selected);

/**
 * Observe size with ResizeObserver.
 */
function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const cr = entry.contentRect;
      setSize({ width: cr.width, height: cr.height });
    });

    ro.observe(el);
    setSize({ width: el.clientWidth, height: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  return { ref, size };
}

export function IconPicker({ value, onChange, onClose }: IconPickerProps) {
  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput), 150);
    return () => clearTimeout(id);
  }, [searchInput]);

  // Filter icons
  const filteredIcons: IconName[] = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return ALL_ICON_NAMES;
    return ALL_ICON_NAMES.filter((n) => n.includes(s));
  }, [search]);

  // Escape to close
  useEffect(() => {
    if (typeof window === "undefined") return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSelect = useCallback(
    (name: IconName) => {
      onChange(name);
      onClose();
    },
    [onChange, onClose]
  );

  const handleClear = useCallback(() => onChange(null), [onChange]);

  // Scroll container and grid refs
  const { ref: panelRef, size: panelSize } = useElementSize<HTMLDivElement>();
  const gridRef = useRef<HTMLDivElement | null>(null);

  // Track actual column count resolved by CSS Grid (repeat(auto-fill, minmax(...)))
  const [columnCount, setColumnCount] = useState(1);

  // Recompute column count when container resizes or after mount
  useLayoutEffect(() => {
    const gridEl = gridRef.current;
    if (!gridEl) return;

    const update = () => setColumnCount(readComputedGridColumnCount(gridEl));
    update();

    // Observe size changes of the grid element as well
    const ro = new ResizeObserver(() => update());
    ro.observe(gridEl);
    return () => ro.disconnect();
  }, [panelSize.width, panelSize.height, search]);

  // Compute row count from filtered icons and current column count
  const rowCount = useMemo(() => {
    if (columnCount <= 0) return 0;
    return Math.ceil(filteredIcons.length / columnCount);
  }, [filteredIcons.length, columnCount]);

  // Row height estimation for virtualization
  const rowHeight = ITEM_SIZE + GAP;

  // Virtualizer by rows. Overscan to avoid blank gaps while fast-scrolling.
  const scrollElRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    scrollElRef.current = panelRef.current;
  }, [panelRef]);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollElRef.current,
    estimateSize: () => rowHeight,
    overscan: 6,
  });

  // Compute visible range in terms of item indices
  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualItems.length ? virtualItems[0].start : 0;
  const paddingBottom = virtualItems.length
    ? totalSize - virtualItems[virtualItems.length - 1].end
    : 0;

  const startRow = virtualItems.length ? virtualItems[0].index : 0;
  const endRow = virtualItems.length ? virtualItems[virtualItems.length - 1].index : -1;

  const startIndex = startRow * columnCount;
  const endIndexExclusive =
    endRow >= startRow ? Math.min(filteredIcons.length, (endRow + 1) * columnCount) : 0;

  const visibleIcons =
    endIndexExclusive > startIndex
      ? filteredIcons.slice(startIndex, endIndexExclusive)
      : [];

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 modal-open">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl bg-white rounded-xl shadow-lg border border-neutral-200 flex flex-col h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex items-center gap-2 bg-neutral-50/60 backdrop-blur-sm">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search icons..."
            className="input input-secondary flex-1 text-sm"
            aria-label="Search icons"
          />
          {value && (
            <button
              onClick={handleClear}
              className="btn btn-ghost !text-xs !px-3"
              type="button"
            >
              Clear
            </button>
          )}
          <button onClick={onClose} className="btn btn-ghost !text-xs !px-3">
            Close
          </button>
        </div>

        <div
          ref={panelRef}
          className="flex-1 overflow-auto p-4"
        >
          {filteredIcons.length ? (
            <div
              // This is the scrollable content area whose height equals total virtual size.
              style={{ height: totalSize, position: "relative" }}
            >
              {/* Top spacer */}
              <div style={{ height: paddingTop }} />

              {/* Grid for visible items only.
                  It uses CSS Grid auto-fill, min 42px, and gap without hardcoding column count. */}
              <div
                ref={gridRef}
                className="grid"
                style={{
                  display: "grid",
                  gap: GAP,
                  gridTemplateColumns: `repeat(auto-fill, minmax(${ITEM_SIZE}px, 1fr))`,
                }}
              >
                {visibleIcons.map((name, i) => (
                  <IconButton
                    key={name}
                    name={name}
                    selected={value === name}
                    onSelect={handleSelect}
                  />
                ))}
              </div>

              {/* Bottom spacer */}
              <div style={{ height: paddingBottom }} />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-neutral-500">No icons</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}