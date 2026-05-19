// icons.jsx — Inline SVG icons (lucide-style, 16px default)
// Brief restricts us to lucide statics; we hand-roll the few we need.

const Icon = ({ d, size = 16, stroke = 1.5, fill = "none", style = {}, children, ...rest }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke="currentColor" strokeWidth={stroke}
    strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0, ...style }}
    aria-hidden="true"
    {...rest}
  >
    {d ? <path d={d} /> : children}
  </svg>
);

const IconSearch    = (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></Icon>;
const IconSettings  = (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></Icon>;
const IconMoon      = (p) => <Icon {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></Icon>;
const IconSun       = (p) => <Icon {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></Icon>;
const IconChevR     = (p) => <Icon {...p}><path d="m9 18 6-6-6-6"/></Icon>;
const IconChevL     = (p) => <Icon {...p}><path d="m15 18-6-6 6-6"/></Icon>;
const IconCheck     = (p) => <Icon {...p}><path d="M20 6 9 17l-5-5"/></Icon>;
const IconX         = (p) => <Icon {...p}><path d="M18 6 6 18M6 6l12 12"/></Icon>;
const IconBan       = (p) => <Icon {...p}><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 14.14 14.14"/></Icon>;
const IconCircle    = (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/></Icon>;
const IconArrowR    = (p) => <Icon {...p}><path d="M5 12h14M13 5l7 7-7 7"/></Icon>;
const IconArrowL    = (p) => <Icon {...p}><path d="M19 12H5M12 5l-7 7 7 7"/></Icon>;
const IconChevDown  = (p) => <Icon {...p}><path d="m6 9 6 6 6-6"/></Icon>;
const IconDots      = (p) => <Icon {...p}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></Icon>;
const IconLayers    = (p) => <Icon {...p}><path d="m12 2 9 5-9 5-9-5 9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/></Icon>;
const IconAlert     = (p) => <Icon {...p}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></Icon>;
const IconClock     = (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>;
const IconPlay      = (p) => <Icon {...p} fill="currentColor" stroke="none"><path d="M8 5v14l11-7z"/></Icon>;
const IconKBD       = (p) => <Icon {...p}><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/></Icon>;
const IconCorner    = (p) => <Icon {...p}><path d="m9 10-5 5 5 5"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></Icon>;
const IconFlag      = (p) => <Icon {...p}><path d="M4 22V4"/><path d="M4 4h13l-2 4 2 4H4"/></Icon>;
const IconFilter    = (p) => <Icon {...p}><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></Icon>;
const IconUser      = (p) => <Icon {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/></Icon>;
const IconSparkle   = (p) => <Icon {...p}><path d="M12 3l1.6 4.6L18 9l-4.4 1.4L12 15l-1.6-4.6L6 9l4.4-1.4L12 3z"/></Icon>;

Object.assign(window, {
  Icon,
  IconSearch, IconSettings, IconMoon, IconSun, IconChevR, IconChevL,
  IconCheck, IconX, IconBan, IconCircle, IconArrowR, IconArrowL,
  IconChevDown, IconDots, IconLayers, IconAlert, IconClock,
  IconPlay, IconKBD, IconCorner, IconFlag, IconFilter, IconUser, IconSparkle,
});
