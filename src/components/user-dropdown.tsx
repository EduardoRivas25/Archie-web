import React, { useState } from "react";
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
  user = {
    name: "Usuario Archie",
    username: "@usuario",
    avatar: "",
    status: "online",
  },
  onAction,
  promoDiscount = "20% desc.",
}: {
  user?: { name: string; username: string; avatar: string; status: string };
  onAction?: (action: string) => void;
  promoDiscount?: string;
}) {
  const navigate = useNavigate();

  const initials = getInitials(user.name);
  const statusColor = STATUS_COLOR[user.status.toLowerCase()] ?? STATUS_COLOR.online;

  const handleAction = (action: string) => {
    if (action === "upgrade") {
      navigate("/#pricing");
      return;
    }
    if (action === "logout") {
      navigate("/login");
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
            {user.avatar && <img src={user.avatar} alt={user.name} className="aspect-square h-full w-full object-cover rounded-full" />}
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
            {user.avatar && <img src={user.avatar} alt={user.name} className="aspect-square h-full w-full object-cover rounded-full" />}
            <AvatarFallback className="bg-[#0066cc] text-white text-sm font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.username}</p>
          </div>
          <Badge
            className={cn(
              "border text-[10px] px-1.5 py-0.5 rounded-full capitalize font-medium",
              statusColor
            )}
          >
            {user.status === "online" ? "en línea" : user.status === "busy" ? "ocupado" : "desconectado"}
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

          {/* Premium */}
          <DropdownMenuGroup>
            {MENU_ITEMS.premium.map((item, i) => (
              <MenuItem key={i} item={item} onAction={handleAction} promoDiscount={promoDiscount} />
            ))}
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="my-1.5 bg-white/10" />

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
