"use client";

import { useEffect, useRef, useCallback } from "react";
import { useState } from "react";
import { Textarea } from "@/components/textarea";
import { cn } from "@/lib/utils";
import {
    ImageIcon,
    FileUp,
    Figma,
    MonitorIcon,
    CircleUserRound,
    ArrowUpIcon,
    Paperclip,
    PlusIcon,
    Code,
    Calculator,
    Network
} from "lucide-react";

interface UseAutoResizeTextareaProps {
    minHeight: number;
    maxHeight?: number;
}

function useAutoResizeTextarea({
    minHeight,
    maxHeight,
}: UseAutoResizeTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(
        (reset?: boolean) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            if (reset) {
                textarea.style.height = `${minHeight}px`;
                return;
            }

            // Temporarily shrink to get the right scrollHeight
            textarea.style.height = `${minHeight}px`;

            // Calculate new height
            const newHeight = Math.max(
                minHeight,
                Math.min(
                    textarea.scrollHeight,
                    maxHeight ?? Number.POSITIVE_INFINITY
                )
            );

            textarea.style.height = `${newHeight}px`;
        },
        [minHeight, maxHeight]
    );

    useEffect(() => {
        // Set initial height
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = `${minHeight}px`;
        }
    }, [minHeight]);

    // Adjust height on window resize
    useEffect(() => {
        const handleResize = () => adjustHeight();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [adjustHeight]);

    return { textareaRef, adjustHeight };
}

import { useTheme } from "@/context/ThemeContext";

export function VercelV0Chat() {
    const { theme } = useTheme();
    const [value, setValue] = useState("");
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 60,
        maxHeight: 200,
    });

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) {
                setValue("");
                adjustHeight(true);
            }
        }
    };

    return (
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4 space-y-8">
            <h1 className={cn(
                "text-4xl font-bold mt-10 transition-colors",
                theme === 'dark' ? "text-white" : "text-gray-900"
            )}>
                ¿En qué te puedo ayudar hoy?
            </h1>

            <div className="w-full">
                <div className={cn(
                    "relative rounded-xl border shadow-lg transition-colors",
                    theme === 'dark' ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-200 shadow-xl"
                )}>
                    <div className="overflow-y-auto">
                        <Textarea
                            ref={textareaRef}
                            value={value}
                            onChange={(e) => {
                                setValue(e.target.value);
                                adjustHeight();
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Pregúntale algo a Archie..."
                            className={cn(
                                "w-full px-4 py-3",
                                "resize-none",
                                "bg-transparent",
                                "border-none",
                                theme === 'dark' ? "text-white" : "text-gray-800",
                                "focus:outline-none",
                                "focus-visible:ring-0 focus-visible:ring-offset-0",
                                "placeholder:text-neutral-500 placeholder:text-sm",
                                "min-h-[60px]"
                            )}
                            style={{
                                overflow: "hidden",
                            }}
                        />
                    </div>

                    <div className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                className={cn(
                                    "group p-2 rounded-lg transition-colors flex items-center gap-1",
                                    theme === 'dark' ? "hover:bg-neutral-800" : "hover:bg-gray-100"
                                )}
                            >
                                <Paperclip className={cn("w-4 h-4", theme === 'dark' ? "text-white" : "text-gray-500")} />
                                <span className="text-xs text-zinc-400 hidden group-hover:inline transition-opacity">
                                    Adjuntar
                                </span>
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                className={cn(
                                    "px-2 py-1 rounded-lg text-sm transition-colors border border-dashed flex items-center justify-between gap-1",
                                    theme === 'dark' ? "text-zinc-400 border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800" : "text-gray-500 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                                )}
                            >
                                <PlusIcon className="w-4 h-4" />
                                Proyecto
                            </button>
                            <button
                                type="button"
                                className={cn(
                                    "px-1.5 py-1.5 rounded-lg text-sm transition-colors border flex items-center justify-between gap-1",
                                    value.trim()
                                        ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                                        : theme === 'dark' ? "text-zinc-400 border-zinc-700 hover:bg-zinc-800" : "text-gray-400 border-gray-200 hover:bg-gray-50"
                                )}
                            >
                                <ArrowUpIcon
                                    className={cn(
                                        "w-4 h-4",
                                        value.trim()
                                            ? "text-white"
                                            : "text-zinc-400"
                                    )}
                                />
                                <span className="sr-only">Enviar</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
                    <ActionButton
                        icon={<Calculator className="w-4 h-4" />}
                        label="Aprende Matemáticas"
                        theme={theme}
                    />
                    <ActionButton
                        icon={<Code className="w-4 h-4" />}
                        label="Programación"
                        theme={theme}
                    />
                    <ActionButton
                        icon={<Network className="w-4 h-4" />}
                        label="Redes"
                        theme={theme}
                    />
                </div>
            </div>
        </div>
    );
}

interface ActionButtonProps {
    icon: React.ReactNode;
    label: string;
    theme: string;
}

function ActionButton({ icon, label, theme }: ActionButtonProps) {
    return (
        <button
            type="button"
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full border transition-all",
                theme === 'dark' 
                    ? "bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-400 hover:text-white" 
                    : "bg-white hover:bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-900 shadow-sm"
            )}
        >
            {icon}
            <span className="text-xs font-medium">{label}</span>
        </button>
    );
}
