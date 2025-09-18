"use client";
import clsx from "clsx";
import * as Icons from "lucide-react";
import { useMemo, useState } from "react";

interface IconPickerProps {
    value?: string | null;
    onChange: (name: string | null) => void;
    onClose: () => void;
}

// Lean curated set of lucide icons appropriate for CTA usage (contact, action, navigation, user/status, play)
// Removed dev/infra/general icons to keep decision surface small & purposeful
const CTA_ICONS = [
    // Contact / communication
    'MessageSquare','MessageCircle','Phone','PhoneCall','Mail','Send','HeartHandshake','Handshake',
    // Primary action / progression
    'ArrowRight','ArrowUpRight','ArrowRightCircle','ChevronRight','PlusCircle','Play','PlayCircle',
    // Launch / run / go
    'Rocket','FastForward','Forward','MoveRight','Flag','Timer','Activity','Zap',
    // Share / external
    'Share','Share2','ExternalLink',
    // Scheduling / clipboard (common action flows)
    'Calendar','CalendarPlus','ClipboardList','ClipboardCheck',
    // Location / targeting
    'MapPin','Target',
    // Commerce (if needed in future flows)
    'ShoppingCart','CreditCard',
    // User context
    'User','UserPlus','Users',
    // Social proof / favorite
    'Star','Heart',
    // Info / help
    'Info','HelpCircle'
];

export function IconPicker({ value, onChange, onClose }: IconPickerProps) {
    const [search, setSearch] = useState("");
    const icons = useMemo(() => CTA_ICONS.filter(n => n.toLowerCase().includes(search.toLowerCase())), [search]);
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative z-10 w-full max-w-3xl bg-white rounded-xl shadow-lg border border-neutral-200 flex flex-col h-[80vh] overflow-hidden">
                <div className="p-3 border-b border-neutral-200 flex items-center gap-2 bg-neutral-50/60 backdrop-blur-sm">
                    <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search icons..." className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm bg-white" />
                    {value && <button onClick={() => onChange(null)} className="text-xs px-3 py-2 rounded-md border border-neutral-300 bg-white hover:bg-neutral-100">Clear</button>}
                    <button onClick={onClose} className="text-xs px-3 py-2 rounded-md border border-neutral-300 bg-white hover:bg-neutral-100">Close</button>
                </div>
                <div className="overflow-auto p-5 grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(86px,1fr))" }}>
                    {icons.map(name => {
                        const Comp: any = (Icons as any)[name];
                        if (!Comp) return null;
                        return (
                            <button
                                key={name}
                                type="button"
                                onClick={() => { onChange(name); onClose(); }}
                                className={clsx(
                                    "group flex flex-col items-center gap-1 rounded-lg border px-2 py-3 hover:bg-neutral-50 text-[10px] transition shadow-sm cursor-pointer",
                                    value === name ? "border-primary ring-2 ring-primary/40 bg-primary/5" : "border-neutral-200"
                                )}
                            >
                                <div className="h-8 w-8 rounded-md flex items-center justify-center text-neutral-700 group-hover:text-neutral-900">
                                    <Comp size={22} strokeWidth={1.6} />
                                </div>
                                <span className="truncate w-full text-neutral-600 group-hover:text-neutral-800 leading-tight">{name}</span>
                            </button>
                        );
                    })}
                    {!icons.length && <div className="text-sm text-neutral-500">No icons</div>}
                </div>
            </div>
        </div>
    );
}
