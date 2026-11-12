import {
  AlertCircle,
  AlignCenter,
  AlignLeft,
  AlignRight,
  AppWindow,
  ArrowLeft,
  ArrowRight,
  Ban,
  Bold,
  Check,
  ChevronDown,
  CloudOff,
  CornerDownLeft,
  Download,
  EllipsisVertical,
  Eye,
  EyeOff,
  Forward,
  Inbox,
  IndentDecrease,
  IndentIncrease,
  Italic,
  LayoutGrid,
  Link,
  Link2Off,
  List,
  ListOrdered,
  LogOut,
  Mail,
  Menu,
  Palette,
  Paperclip,
  Pencil,
  Plus,
  RemoveFormatting,
  Reply,
  ReplyAll,
  RotateCw,
  Save,
  Send,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Strikethrough,
  Subscript,
  Superscript,
  Trash2,
  TriangleAlert,
  Type,
  Underline,
  WifiOff,
  X,
} from 'lucide-react'
import type { LucideIcon as LucideIconType } from 'lucide-react'
import React from 'react'

export type LucideIcon = LucideIconType

/*
 * The only module in src/ that imports lucide-react. Lucide name -> export name:
 *
 * AlertCircle       ->  AlertCircleIcon
 * AlignCenter       ->  AlignCenterIcon
 * AlignLeft         ->  AlignLeftIcon
 * AlignRight        ->  AlignRightIcon
 * AppWindow         ->  AppWindowIcon
 * ArrowLeft         ->  ArrowLeftIcon
 * ArrowRight        ->  ArrowRightIcon
 * Ban               ->  BanIcon
 * Bold              ->  BoldIcon
 * Check             ->  CheckIcon
 * ChevronDown       ->  ChevronDownIcon
 * X                 ->  CloseIcon
 * CloudOff          ->  CloudOffIcon
 * CornerDownLeft   ->  CornerDownLeftIcon
 * Download          ->  DownloadIcon
 * EllipsisVertical  ->  EllipsisVerticalIcon
 * Eye               ->  EyeIcon
 * EyeOff            ->  EyeOffIcon
 * Forward           ->  ForwardIcon
 * Inbox             ->  InboxIcon
 * IndentDecrease    ->  IndentDecreaseIcon
 * IndentIncrease    ->  IndentIncreaseIcon
 * Italic            ->  ItalicIcon
 * LayoutGrid        ->  LayoutGridIcon
 * Link              ->  LinkIcon
 * Link2Off          ->  LinkOffIcon
 * List              ->  ListIcon
 * ListOrdered       ->  ListOrderedIcon
 * LogOut            ->  LogOutIcon
 * Mail              ->  MailIcon
 * Menu              ->  MenuIcon
 * Palette           ->  PaletteIcon
 * Paperclip         ->  PaperclipIcon
 * Pencil            ->  PencilIcon
 * Plus              ->  PlusIcon
 * RemoveFormatting  ->  RemoveFormattingIcon
 * Reply             ->  ReplyIcon
 * ReplyAll          ->  ReplyAllIcon
 * RotateCw          ->  RotateCwIcon
 * Save              ->  SaveIcon
 * Send              ->  SendIcon
 * Settings          ->  SettingsIcon
 * Shield            ->  ShieldIcon
 * ShieldAlert       ->  ShieldAlertIcon
 * ShieldCheck       ->  ShieldCheckIcon
 * Smartphone        ->  SmartphoneIcon
 * Strikethrough     ->  StrikethroughIcon
 * Subscript         ->  SubscriptIcon
 * Superscript       ->  SuperscriptIcon
 * Trash2            ->  TrashIcon
 * TriangleAlert     ->  TriangleAlertIcon
 * Type              ->  TypeIcon
 * Underline         ->  UnderlineIcon
 * WifiOff           ->  WifiOffIcon
 *
 * Hand-drawn SVGs replaced (install-offer/elements.tsx, offline-notice/index.tsx):
 *   DownloadIcon -> DownloadIcon, WindowIcon -> AppWindowIcon, AppsIcon -> LayoutGridIcon,
 *   OfflineIcon (install-offer) -> CloudOffIcon, ShieldIcon (check mark) -> ShieldCheckIcon,
 *   ChevronDownIcon -> ChevronDownIcon, MenuDotsIcon -> EllipsisVerticalIcon,
 *   PhoneIcon -> SmartphoneIcon, RefreshIcon -> RotateCwIcon, OfflineIcon (offline-notice) -> WifiOffIcon.
 */

export type IconSize = 9 | 10 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 20 | 24 | 28

export interface IconProps {
  className?: string
  label?: string
  size?: IconSize
  style?: React.CSSProperties
}

// Stroke policy: heavier strokes on small icons, where thin ones are hard to read.
const strokeWidthFor = (size: IconSize): number => (size <= 13 ? 2 : 1.5)

export const createIcon = (Lucide: LucideIcon) => {
  const Icon = ({ className, label, size = 16, style }: IconProps): React.ReactNode => {
    const accessibility = label
      ? { 'aria-label': label, role: 'img' as const }
      : { 'aria-hidden': true as const, focusable: false as const }
    return (
      <Lucide
        {...accessibility}
        className={className}
        color="currentColor"
        size={size}
        strokeWidth={strokeWidthFor(size)}
        style={style}
      />
    )
  }
  Icon.displayName = Lucide.displayName
  return Icon
}

export const AlertCircleIcon = createIcon(AlertCircle)
export const AlignCenterIcon = createIcon(AlignCenter)
export const AlignLeftIcon = createIcon(AlignLeft)
export const AlignRightIcon = createIcon(AlignRight)
export const AppWindowIcon = createIcon(AppWindow)
export const ArrowLeftIcon = createIcon(ArrowLeft)
export const ArrowRightIcon = createIcon(ArrowRight)
export const BanIcon = createIcon(Ban)
export const BoldIcon = createIcon(Bold)
export const CheckIcon = createIcon(Check)
export const ChevronDownIcon = createIcon(ChevronDown)
export const CloseIcon = createIcon(X)
export const CloudOffIcon = createIcon(CloudOff)
export const CornerDownLeftIcon = createIcon(CornerDownLeft)
export const DownloadIcon = createIcon(Download)
export const EllipsisVerticalIcon = createIcon(EllipsisVertical)
export const EyeIcon = createIcon(Eye)
export const EyeOffIcon = createIcon(EyeOff)
export const ForwardIcon = createIcon(Forward)
export const InboxIcon = createIcon(Inbox)
export const IndentDecreaseIcon = createIcon(IndentDecrease)
export const IndentIncreaseIcon = createIcon(IndentIncrease)
export const ItalicIcon = createIcon(Italic)
export const LayoutGridIcon = createIcon(LayoutGrid)
export const LinkIcon = createIcon(Link)
export const LinkOffIcon = createIcon(Link2Off)
export const ListIcon = createIcon(List)
export const ListOrderedIcon = createIcon(ListOrdered)
export const LogOutIcon = createIcon(LogOut)
export const MailIcon = createIcon(Mail)
export const MenuIcon = createIcon(Menu)
export const PaletteIcon = createIcon(Palette)
export const PaperclipIcon = createIcon(Paperclip)
export const PencilIcon = createIcon(Pencil)
export const PlusIcon = createIcon(Plus)
export const RemoveFormattingIcon = createIcon(RemoveFormatting)
export const ReplyIcon = createIcon(Reply)
export const ReplyAllIcon = createIcon(ReplyAll)
export const RotateCwIcon = createIcon(RotateCw)
export const SaveIcon = createIcon(Save)
export const SendIcon = createIcon(Send)
export const SettingsIcon = createIcon(Settings)
export const ShieldIcon = createIcon(Shield)
export const ShieldAlertIcon = createIcon(ShieldAlert)
export const ShieldCheckIcon = createIcon(ShieldCheck)
export const SmartphoneIcon = createIcon(Smartphone)
export const StrikethroughIcon = createIcon(Strikethrough)
export const SubscriptIcon = createIcon(Subscript)
export const SuperscriptIcon = createIcon(Superscript)
export const TrashIcon = createIcon(Trash2)
export const TriangleAlertIcon = createIcon(TriangleAlert)
export const TypeIcon = createIcon(Type)
export const UnderlineIcon = createIcon(Underline)
export const WifiOffIcon = createIcon(WifiOff)
