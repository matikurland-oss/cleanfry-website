// אייקוני קו (stroke 2px) של מערכת העיצוב — לפי קובץ הרפרנס. כולם דקורטיביים (aria-hidden).
import type { ReactNode, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const Svg = ({ size = 24, strokeWidth = 2, children, ...rest }: IconProps & { children: ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...rest}
  >
    {children}
  </svg>
);

export const BagIcon = (p: IconProps) => <Svg {...p}><path d="M6 7h12l-1 13H7L6 7z" /><path d="M9 7a3 3 0 0 1 6 0" /></Svg>;
export const LeafIcon = (p: IconProps) => <Svg {...p}><path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14z" /><path d="M5 19l7-7" /></Svg>;
export const DropIcon = (p: IconProps) => <Svg {...p}><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" /></Svg>;
export const CycleIcon = (p: IconProps) => <Svg {...p}><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></Svg>;
export const TruckIcon = (p: IconProps) => <Svg {...p}><path d="M3 7h11v9H3z" /><path d="M14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></Svg>;
export const ClockIcon = (p: IconProps) => <Svg {...p}><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2" /><path d="M9 2h6" /></Svg>;
export const CheckIcon = (p: IconProps) => <Svg strokeWidth={2.5} {...p}><path d="M5 12l5 5L20 7" /></Svg>;
export const FlameOffIcon = (p: IconProps) => <Svg {...p}><path d="M12 3c1 3 4 4.5 4 8.5a4 4 0 0 1-8 0C8 9 10 8 10 6" /><path d="M4 4l16 16" /></Svg>;
export const SpoonIcon = (p: IconProps) => <Svg {...p}><ellipse cx="8" cy="7" rx="4" ry="3" /><path d="M10.5 9.5L20 19" /></Svg>;
export const TrashIcon = (p: IconProps) => <Svg {...p}><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="M6 7l1 13h10l1-13" /></Svg>;
export const PipeIcon = (p: IconProps) => <Svg {...p}><path d="M4 10h10a4 4 0 0 1 4 4v6" /><path d="M4 6v8" /><path d="M15 20h6" /></Svg>;
export const GlassIcon = (p: IconProps) => <Svg {...p}><path d="M8 3h8l-1 5a4 4 0 0 1-6 0L8 3z" /><path d="M12 12v9" /><path d="M8 21h8" /></Svg>;
export const MenuIcon = (p: IconProps) => <Svg {...p}><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></Svg>;
export const CloseIcon = (p: IconProps) => <Svg {...p}><path d="M6 6l12 12" /><path d="M18 6L6 18" /></Svg>;
export const PlusIcon = (p: IconProps) => <Svg {...p}><path d="M12 5v14" /><path d="M5 12h14" /></Svg>;
export const MinusIcon = (p: IconProps) => <Svg {...p}><path d="M5 12h14" /></Svg>;
