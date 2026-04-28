import React from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/avatar";
import { Badge } from "@/components/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/dropdown-menu";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { getRoleLabel } from "@/services/roleService";

const MENU_ITEMS = {
  profile: [
    { icon: "solar:user-circle-line-duotone",  label: "Tu perfil",        action: "profile" },
    { icon: "solar:sun-line-duotone",          label: "Apariencia",       action: "appearance" },
    { icon: "solar:settings-line-duotone",     label: "Configuración",    action: "settings" },
  ],
  premium: [
    {
      icon: "solar:star-bold",
      label: "Mejorar a Pro",
      action: "upgrade",
      iconClass: "text-amber-500",
      badge: { text: "20% desc.", className: "bg-amber-600 text-white text-[10px] px-1.5 py-0.5 rounded font-semibold" },
    },
  ],
  support: [
    { icon: "solar:letter-unread-line-duotone",   label: "¿Qué hay de nuevo?", action: "whats-new",  rightIcon: "solar:square-top-down-line-duotone" },
    { icon: "solar:question-circle-line-duotone", label: "¿Necesitas ayuda?",  action: "help",       rightIcon: "solar:square-top-down-line-duotone" },
  ],
  account: [
    { icon: "solar:logout-2-bold-duotone", label: "Cerrar sesión", action: "logout" },
  ],
};

const itemBase =
  "p-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors text-gray-200";

const STATUS_COLOR: Record<string, string> = {
  online:  "text-green-400 bg-green-900/30 border-green-500/50",
  offline: "text-gray-400 bg-gray-800 border-gray-600",
  busy:    "text-red-400 bg-red-900/30 border-red-500/50",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

interface Item {
  icon: string;
  label: string;
  action?: string;
  iconClass?: string;
  badge?: { text: string; className: string };
  rightIcon?: string;
}

function MenuItem({
  item,
  onAction,
  promoDiscount,
}: {
  item: Item;
  onAction: (a: string) => void;
  promoDiscount: string;
}) {
  const hasSideEl = item.badge || item.rightIcon;
  return (
    <DropdownMenuItem
      className={cn(itemBase, hasSideEl ? "justify-between" : "")}
      onClick={() => item.action && onAction(item.action)}
    >
      <span className="flex items-center gap-2 font-medium">
        <Icon
          icon={item.icon}
          className={`size-5 ${item.iconClass ?? "text-gray-400"}`}
        />
        {item.label}
      </span>
      {item.badge && (
        <span className={item.badge.className}>{promoDiscount || item.badge.text}</span>
      )}
      {item.rightIcon && (
        <Icon icon={item.rightIcon} className="size-4 text-gray-500" />
      )}
    </DropdownMenuItem>
  );
}

export function UserDropdown({
  onAction,
  onOpenProfile,
  promoDiscount = "20% desc.",
}: {
  onAction?: (action: string) => void;
  onOpenProfile?: () => void;
  promoDiscount?: string;
}) {
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  const { user, profile, signOut } = useAuth();

  // Derive display data from auth context
  const displayName = profile?.full_name || user?.profile?.name || user?.email?.split('@')[0] || 'Usuario';
  const displayEmail = user?.email || '';
  const avatarUrl = user?.profile?.avatar_url || '';
  const initials = getInitials(displayName);
  const roleLabel = profile?.role ? getRoleLabel(profile.role) : 'Free';

  const handleAction = async (action: string) => {
    if (action === "upgrade") {
      navigate("/#pricing");
      return;
    }
    if (action === "logout") {
      try {
        await signOut();
        navigate("/login");
      } catch (err) {
        console.error('Logout error:', err);
        navigate("/login");
      }
      return;
    }
    if (action === "appearance") {
      toggleTheme();
      return;
    }
    if (action === "profile") {
      onOpenProfile?.();
      return;
    }
    onAction?.(action);
  };

  return (
    <DropdownMenu>
      {/* ── Trigger ── */}
      <DropdownMenuTrigger asChild>
        <button className="relative outline-none group">
          <Avatar className="cursor-pointer size-9 border border-white/20 group-hover:ring-2 group-hover:ring-white/20 transition-all">
            {avatarUrl && <img src={avatarUrl} alt={displayName} className="aspect-square h-full w-full object-cover rounded-full" />}
            <AvatarFallback className="bg-[#0066cc] text-white text-sm font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {/* Dot de estado */}
          <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-green-400 border-2 border-[#0d0d0d]" />
        </button>
      </DropdownMenuTrigger>

      {/* ── Content ── */}
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[280px] rounded-2xl border border-white/10 bg-[#111111] p-0 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <Avatar className="size-10 border border-white/10">
            {avatarUrl && <img src={avatarUrl} alt={displayName} className="aspect-square h-full w-full object-cover rounded-full" />}
            <AvatarFallback className="bg-[#0066cc] text-white text-sm font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{displayName}</p>
            <p className="text-xs text-gray-400 truncate">{displayEmail}</p>
          </div>
          <Badge
            className={cn(
              "border text-[10px] px-1.5 py-0.5 rounded-full capitalize font-medium",
              profile?.role === 'superadmin' ? "text-red-400 bg-red-900/30 border-red-500/50" :
              profile?.role === 'pro' ? "text-blue-400 bg-blue-900/30 border-blue-500/50" :
              "text-green-400 bg-green-900/30 border-green-500/50"
            )}
          >
            {roleLabel}
          </Badge>
        </div>

        <div className="px-2 py-2 space-y-0.5">
          {/* Perfil */}
          <DropdownMenuGroup>
            {MENU_ITEMS.profile.map((item, i) => (
              <MenuItem key={i} item={item} onAction={handleAction} promoDiscount={promoDiscount} />
            ))}
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="my-1.5 bg-white/10" />

          {/* Premium - hide for pro/superadmin */}
          {profile?.role !== 'pro' && profile?.role !== 'superadmin' && (
            <>
              <DropdownMenuGroup>
                {MENU_ITEMS.premium.map((item, i) => (
                  <MenuItem key={i} item={item} onAction={handleAction} promoDiscount={promoDiscount} />
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="my-1.5 bg-white/10" />
            </>
          )}

          {/* Soporte */}
          <DropdownMenuGroup>
            {MENU_ITEMS.support.map((item, i) => (
              <MenuItem key={i} item={item} onAction={handleAction} promoDiscount={promoDiscount} />
            ))}
          </DropdownMenuGroup>
        </div>

        {/* Cerrar sesión */}
        <div className="px-2 pb-2 border-t border-white/10 pt-1">
          <DropdownMenuGroup>
            {MENU_ITEMS.account.map((item, i) => (
              <MenuItem key={i} item={item} onAction={handleAction} promoDiscount={promoDiscount} />
            ))}
          </DropdownMenuGroup>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserDropdown;
