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
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4 space-y-4 md:space-y-8">
            <h1 className={cn(
                "text-2xl md:text-4xl font-bold mt-0 md:mt-10 mb-64 md:mb-0 transition-colors text-center",
                theme === 'dark' ? "text-white" : "text-gray-900"
            )}>
                ¿En qué te puedo ayudar hoy?
            </h1>

            <div className="w-full">
                <div className={cn(
                    "relative rounded-2xl border shadow-lg transition-colors overflow-hidden",
                    theme === 'dark' ? "bg-[#111111] border-white/10" : "bg-white border-gray-200 shadow-xl"
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
                                "w-full px-4 py-4 md:px-6 md:py-5",
                                "resize-none",
                                "bg-transparent",
                                "border-none",
                                theme === 'dark' ? "text-white" : "text-gray-800",
                                "focus:outline-none text-base md:text-lg",
                                "focus-visible:ring-0 focus-visible:ring-offset-0",
                                "placeholder:text-neutral-500 placeholder:text-sm md:placeholder:text-base",
                                "min-h-[60px]"
                            )}
                            style={{
                                overflow: "hidden",
                            }}
                        />
                    </div>

                    <div className="flex items-center justify-between p-2 md:p-3 bg-black/5 dark:bg-white/5">
                        <div className="flex items-center gap-1 md:gap-2">
                            <button
                                type="button"
                                className={cn(
                                    "p-2 rounded-xl transition-colors flex items-center gap-1.5",
                                    theme === 'dark' ? "hover:bg-white/10" : "hover:bg-black/5"
                                )}
                            >
                                <Paperclip className={cn("w-4 h-4 md:w-5 md:h-5", theme === 'dark' ? "text-white" : "text-gray-500")} />
                                <span className="text-xs font-medium text-zinc-400 hidden md:inline">
                                    Adjuntar
                                </span>
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                className={cn(
                                    "px-3 py-1.5 rounded-xl text-xs md:text-sm font-medium transition-all border border-dashed flex items-center gap-1.5",
                                    theme === 'dark' ? "text-zinc-400 border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800" : "text-gray-500 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                                )}
                            >
                                <PlusIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                <span>Proyecto</span>
                            </button>
                            <button
                                type="button"
                                className={cn(
                                    "p-2 md:p-2.5 rounded-xl transition-all border flex items-center justify-center",
                                    value.trim()
                                        ? "bg-[#0066cc] text-white border-[#0066cc] shadow-lg shadow-blue-500/20"
                                        : theme === 'dark' ? "text-zinc-500 border-white/10" : "text-gray-400 border-gray-200"
                                )}
                            >
                                <ArrowUpIcon
                                    className="w-4 h-4 md:w-5 md:h-5"
                                />
                                <span className="sr-only">Enviar</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-2 md:gap-3 mt-6 flex-wrap">
                    <ActionButton
                        icon={<Calculator className="w-4 h-4" />}
                        label="Matemáticas"
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
