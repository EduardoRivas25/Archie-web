"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { Textarea } from "@/components/textarea";
import { cn } from "@/lib/utils";
import {
    ArrowUpIcon,
    Paperclip,
    Code,
    Calculator,
    Network,
    ChevronDown,
    Zap,
    Brain,
    Star,
    Check,
    ChevronRight,
    Sparkles,
    Copy,
    CheckCheck
} from "lucide-react";
import archieLogo from "@/assets/Archie logo blanco.png";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/dropdown-menu";
import * as chatService from "@/services/chatService";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    reasoning?: string;
    model?: string;
}

const MODELS = [
    { id: "facil", name: "Facil", description: "Responde de manera sencilla", icon: Zap, color: "text-blue-400" },
    { id: "medio", name: "Medio", description: "Resuelve problemas de manera clara", icon: Brain, color: "text-blue-500" },
    { id: "pro", name: "Pro", description: "Matemáticas y programación avanzada", icon: Sparkles, color: "text-blue-600", isDefault: true },
];

interface VercelV0ChatProps {
    activeSessionId?: string | null;
    onSessionCreated?: (sessionId: string) => void;
}

export function VercelV0Chat({ activeSessionId, onSessionCreated }: VercelV0ChatProps) {
    const { theme } = useTheme();
    const { user } = useAuth();
    const [value, setValue] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedModel, setSelectedModel] = useState(MODELS.find(m => m.isDefault) || MODELS[0]);
    const [isTyping, setIsTyping] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);

    const streamIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 60,
        maxHeight: 200,
    });

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, isStreaming]);

    // Cleanup streaming interval on unmount
    useEffect(() => {
        return () => {
            if (streamIntervalRef.current) {
                clearInterval(streamIntervalRef.current);
            }
        };
    }, []);

    // Load messages when activeSessionId changes
    useEffect(() => {
        if (activeSessionId) {
            // Stop any in-progress streaming
            if (streamIntervalRef.current) {
                clearInterval(streamIntervalRef.current);
                streamIntervalRef.current = null;
            }
            setIsStreaming(false);
            setStreamingMsgId(null);
            setCurrentSessionId(activeSessionId);
            loadSessionMessages(activeSessionId);
        } else if (activeSessionId === null) {
            // New chat
            if (streamIntervalRef.current) {
                clearInterval(streamIntervalRef.current);
                streamIntervalRef.current = null;
            }
            setIsStreaming(false);
            setStreamingMsgId(null);
            setCurrentSessionId(null);
            setMessages([]);
        }
    }, [activeSessionId]);

    const loadSessionMessages = async (sessionId: string) => {
        try {
            const msgs = await chatService.getMessagesBySession(sessionId);
            setMessages(msgs.map(m => ({
                id: m.id,
                role: m.role,
                content: m.content,
                model: m.model || undefined,
            })));
        } catch (err) {
            console.error('Error loading messages:', err);
        }
    };

    /**
     * Progressive rendering: reveals text word-by-word with adaptive speed.
     * Longer texts render faster so the user doesn't wait forever.
     */
    const startProgressiveRendering = (
        fullText: string,
        msgId: string,
        sessionId: string,
        userId: string,
        model: string
    ) => {
        // Split into "words" (preserving whitespace/newlines as separate tokens)
        const tokens = fullText.match(/\S+|\s+/g) || [fullText];
        let tokenIndex = 0;
        setIsStreaming(true);
        setStreamingMsgId(msgId);

        // Adaptive speed: longer texts → more words per tick
        const totalLen = fullText.length;
        const TICK_MS = 20; // interval speed in ms
        // Base words per tick scales with length
        const wordsPerTick = totalLen > 2000 ? 6
            : totalLen > 1000 ? 4
                : totalLen > 500 ? 3
                    : totalLen > 200 ? 2
                        : 1;

        streamIntervalRef.current = setInterval(() => {
            // Advance by wordsPerTick tokens, but also consume any trailing whitespace
            let advance = wordsPerTick;
            while (advance > 0 && tokenIndex < tokens.length) {
                const token = tokens[tokenIndex];
                tokenIndex++;
                // Whitespace tokens don't count toward our word budget
                if (token.trim().length > 0) {
                    advance--;
                }
            }

            const currentText = tokens.slice(0, tokenIndex).join('');

            setMessages(prev =>
                prev.map(m =>
                    m.id === msgId ? { ...m, content: currentText } : m
                )
            );

            // Done streaming
            if (tokenIndex >= tokens.length) {
                if (streamIntervalRef.current) {
                    clearInterval(streamIntervalRef.current);
                    streamIntervalRef.current = null;
                }
                setIsStreaming(false);
                setStreamingMsgId(null);

                // Save the complete assistant message to DB (fire-and-forget)
                chatService.saveAssistantMessage(sessionId, userId, fullText, model).catch(err => {
                    console.error('Error saving assistant message:', err);
                });
            }
        }, TICK_MS);
    };

    const handleSendMessage = async () => {
        if (!value.trim() || !user || isStreaming) return;

        const userContent = value.trim();
        const userId = user.id;

        // Optimistic UI update
        const tempUserMsg: Message = {
            id: `temp-${Date.now()}`,
            role: "user",
            content: userContent,
        };
        setMessages(prev => [...prev, tempUserMsg]);
        setValue("");
        adjustHeight(true);
        setIsTyping(true);

        try {
            let sessionId = currentSessionId;

            // Create new session if needed
            if (!sessionId) {
                const title = userContent.slice(0, 60) + (userContent.length > 60 ? '...' : '');
                const session = await chatService.createSession(userId, title, selectedModel.id);
                sessionId = session.id;
                setCurrentSessionId(sessionId);
                onSessionCreated?.(sessionId);
            }

            // Send to expert system — resolves via rules first, falls back to webhook
            const { userMsg, assistantContent } = await chatService.sendToExpertSystem(
                sessionId,
                userId,
                userContent,
                selectedModel.id
            );

            const streamMsgId = `stream-${Date.now()}`;

            // Replace temp user message with real one, and add empty assistant message
            setMessages(prev => {
                const withoutTemp = prev.filter(m => m.id !== tempUserMsg.id);
                return [
                    ...withoutTemp,
                    { id: userMsg.id, role: 'user' as const, content: userMsg.content },
                    { id: streamMsgId, role: 'assistant' as const, content: '', model: selectedModel.name },
                ];
            });

            setIsTyping(false);

            // Start progressive rendering of the assistant response
            startProgressiveRendering(
                assistantContent,
                streamMsgId,
                sessionId,
                userId,
                selectedModel.id
            );
        } catch (err) {
            console.error('Error sending message:', err);
            setMessages(prev => [
                ...prev,
                {
                    id: `error-${Date.now()}`,
                    role: 'assistant',
                    content: 'Lo siento, hubo un error al procesar tu mensaje. Intenta de nuevo.',
                    model: selectedModel.name,
                },
            ]);
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="flex flex-col w-full max-w-4xl mx-auto min-h-full">
            {/* Messages Area */}
            {messages.length > 0 ? (
                <div className="flex-1 space-y-8 pb-32">
                    {messages.map((msg) => (
                        <div key={msg.id} className={cn(
                            "flex flex-col gap-3 group animate-in fade-in slide-in-from-bottom-2 duration-300",
                            msg.role === "user" ? "items-end" : "items-start"
                        )}>
                            {msg.role === "assistant" && (
                                <div className="flex items-center gap-2.5 mb-1">
                                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                                        <img src={archieLogo} alt="Archie" className="w-7 h-7 object-contain" />
                                    </div>
                                    <span className="text-xs font-bold tracking-widest opacity-80 uppercase text-blue-500">Archie {msg.model && `· ${msg.model}`}</span>
                                </div>
                            )}

                            <div className={cn(
                                "max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 text-sm md:text-base transition-all",
                                msg.role === "user"
                                    ? "bg-[#2d2d2d] text-white rounded-tr-none shadow-sm"
                                    : "bg-transparent text-inherit"
                            )}>
                                {msg.role === "assistant" ? (
                                    <div className={cn(
                                        "markdown-prose",
                                        theme === 'dark' ? "text-gray-200" : "text-gray-800 markdown-prose-light"
                                    )}>
                                        <MarkdownRenderer content={msg.content} theme={theme} />
                                        {isStreaming && msg.id === streamingMsgId && (
                                            <span className="streaming-cursor" />
                                        )}
                                    </div>
                                ) : (
                                    <div className="leading-relaxed whitespace-pre-wrap">
                                        {msg.content}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex items-start gap-3 animate-pulse">
                            <div className="w-8 h-8 flex items-center justify-center shrink-0">
                                <img src={archieLogo} alt="Archie" className="w-7 h-7 object-contain" />
                            </div>
                            <div className="flex gap-1 py-4 px-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            ) : (
                <div className="flex flex-col items-center space-y-8 py-10 md:py-20">
                    <h1 className={cn(
                        "text-2xl md:text-5xl font-bold transition-colors text-center tracking-tight",
                        theme === 'dark' ? "text-white" : "text-gray-900"
                    )}>
                        ¿En qué te puedo ayudar hoy?
                    </h1>

                    <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap max-w-2xl">
                        <ActionButton
                            icon={<Calculator className="w-4 h-4" />}
                            label="Matemáticas"
                            theme={theme}
                            onClick={() => { setValue("Ayúdame con un problema de integrales"); }}
                        />
                        <ActionButton
                            icon={<Code className="w-4 h-4" />}
                            label="Programación"
                            theme={theme}
                            onClick={() => { setValue("Explícame cómo funciona un closure en JS"); }}
                        />
                        <ActionButton
                            icon={<Network className="w-4 h-4" />}
                            label="Redes"
                            theme={theme}
                            onClick={() => { setValue("¿Cuáles son las capas del modelo OSI?"); }}
                        />
                    </div>
                </div>
            )}

            {/* Input Section - Persistent at bottom */}
            <div className={cn(
                "sticky bottom-0 w-full pt-4 pb-6 transition-all",
                messages.length > 0 ? (theme === 'dark' ? "bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/95 to-transparent" : "bg-gradient-to-t from-gray-50 via-gray-50/95 to-transparent") : ""
            )}>
                <div className={cn(
                    "relative rounded-3xl border shadow-2xl transition-all duration-300 ring-offset-0",
                    theme === 'dark' ? "bg-[#161616]/95 border-white/10" : "bg-white border-gray-200"
                )}>
                    <div className="overflow-y-auto max-h-[200px]">
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
                                "w-full px-6 py-5",
                                "resize-none",
                                "bg-transparent",
                                "border-none",
                                theme === 'dark' ? "text-white" : "text-gray-800",
                                "focus:outline-none text-base md:text-lg",
                                "focus-visible:ring-0 focus-visible:ring-offset-0",
                                "placeholder:text-neutral-500 placeholder:text-base",
                                "min-h-[60px]"
                            )}
                            style={{ overflow: "hidden" }}
                        />
                    </div>

                    <div className="flex items-center justify-between px-3 pb-3">
                        <div className="flex items-center gap-2">
                            {/* Model Selector Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-2xl transition-all border font-bold text-sm",
                                        theme === 'dark' ? "bg-white/5 border-white/10 hover:bg-white/10 text-gray-300" : "bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-700"
                                    )}>
                                        <selectedModel.icon className={cn("w-4 h-4", selectedModel.color)} />
                                        <span>{selectedModel.name}</span>
                                        <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-[280px] p-2 rounded-2xl border-white/10 bg-[#1c1c1c] text-white">
                                    <div className="px-2 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Cambiar de modelo</div>
                                    {MODELS.map((model) => (
                                        <DropdownMenuItem
                                            key={model.id}
                                            onClick={() => setSelectedModel(model)}
                                            className={cn(
                                                "flex items-start gap-3 p-3 rounded-xl cursor-pointer hover:bg-white/5 transition-all",
                                                selectedModel.id === model.id ? "bg-white/10" : ""
                                            )}
                                        >
                                            <model.icon className={cn("w-5 h-5 shrink-0 mt-0.5", model.color)} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-sm">{model.name}</span>
                                                    {selectedModel.id === model.id && <Check className="w-4 h-4 text-blue-500" />}
                                                </div>
                                                <p className="text-[11px] text-gray-500 line-clamp-1">{model.description}</p>
                                            </div>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <button className={cn(
                                "p-2.5 rounded-full transition-colors",
                                theme === 'dark' ? "text-gray-400 hover:text-white hover:bg-white/5" : "text-gray-500 hover:text-gray-900 hover:bg-black/5"
                            )}>
                                <Paperclip className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleSendMessage}
                                disabled={!value.trim() || isTyping || isStreaming}
                                className={cn(
                                    "p-2.5 rounded-2xl transition-all flex items-center justify-center",
                                    value.trim() && !isTyping && !isStreaming
                                        ? "bg-[#0066cc] text-white shadow-lg shadow-blue-500/20"
                                        : theme === 'dark' ? "text-gray-600 bg-white/5" : "text-gray-400 bg-gray-100"
                                )}
                            >
                                <ArrowUpIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
                <p className="text-[10px] text-center mt-3 opacity-40 font-medium">Archie puede cometer errores. Considera verificar la información importante.</p>
            </div>
        </div>
    );
}

function CodeBlock({ language, children }: { language: string; children: string }) {
    const [copied, setCopied] = useState(false);
    const lineCount = children.split('\n').length;

    const handleCopy = () => {
        navigator.clipboard.writeText(children).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="code-block-wrapper">
            <div className="code-block-header">
                <div className="code-block-lang">
                    <span className="code-lang-dot" />
                    <span>{language || 'code'}</span>
                </div>
                <button onClick={handleCopy} className="code-copy-btn">
                    {copied ? (
                        <span className="flex items-center gap-1.5"><CheckCheck className="w-3.5 h-3.5" /> Copiado</span>
                    ) : (
                        <span className="flex items-center gap-1.5"><Copy className="w-3.5 h-3.5" /> Copiar</span>
                    )}
                </button>
            </div>
            <SyntaxHighlighter
                language={language || 'text'}
                style={vscDarkPlus}
                customStyle={{
                    margin: 0,
                    background: '#1e1e1e',
                    borderRadius: 0,
                    padding: '1em 1em 1em 0.5em',
                    fontSize: '0.875em',
                    lineHeight: '1.7',
                }}
                showLineNumbers={lineCount > 1}
                lineNumberStyle={{
                    minWidth: '2.5em',
                    paddingRight: '1em',
                    color: '#858585',
                    fontStyle: 'normal',
                    userSelect: 'none',
                }}
                wrapLongLines
            >
                {children.trimEnd()}
            </SyntaxHighlighter>
        </div>
    );
}

function MarkdownRenderer({ content, theme }: { content: string; theme: string }) {
    if (!content) return null;

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                code({ node, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match && !className;

                    if (isInline) {
                        return <code className={className} {...props}>{children}</code>;
                    }

                    return (
                        <CodeBlock language={match ? match[1] : ''}>
                            {String(children).replace(/\n$/, '')}
                        </CodeBlock>
                    );
                },
                pre({ children }: any) {
                    // Let CodeBlock handle the wrapping
                    return <>{children}</>;
                },
            }}
        >
            {content}
        </ReactMarkdown>
    );
}

function ReasoningBlock({ reasoning, theme }: { reasoning: string, theme: string }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="mb-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 text-xs font-bold transition-all py-1.5 px-3 rounded-lg border",
                    theme === 'dark' ? "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                )}
            >
                <ChevronRight className={cn("w-3.5 h-3.5 transition-transform duration-200", isOpen ? "rotate-90" : "")} />
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Mostrar razonamiento
            </button>
            {isOpen && (
                <div className={cn(
                    "mt-2 pl-4 py-3 border-l-2 text-xs md:text-sm leading-relaxed italic animate-in slide-in-from-top-1 duration-200",
                    theme === 'dark' ? "border-white/10 text-gray-500" : "border-gray-200 text-gray-400"
                )}>
                    {reasoning}
                </div>
            )}
        </div>
    );
}

function ActionButton({ icon, label, theme, onClick }: { icon: React.ReactNode; label: string; theme: string; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border transition-all active:scale-95",
                theme === 'dark'
                    ? "bg-[#1a1a1a] hover:bg-[#252525] border-white/10 text-gray-400 hover:text-white"
                    : "bg-white hover:bg-gray-50 border-gray-200 text-gray-600 hover:text-gray-900 shadow-sm"
            )}
        >
            <span className="opacity-70">{icon}</span>
            <span className="text-sm font-bold tracking-tight">{label}</span>
        </button>
    );
}

function useAutoResizeTextarea({ minHeight, maxHeight }: { minHeight: number; maxHeight?: number }) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const adjustHeight = useCallback((reset?: boolean) => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        if (reset) {
            textarea.style.height = `${minHeight}px`;
            return;
        }
        textarea.style.height = `${minHeight}px`;
        const newHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY));
        textarea.style.height = `${newHeight}px`;
    }, [minHeight, maxHeight]);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) textarea.style.height = `${minHeight}px`;
    }, [minHeight]);

    useEffect(() => {
        const handleResize = () => adjustHeight();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [adjustHeight]);

    return { textareaRef, adjustHeight };
}
