import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';

const MarkdownMessage = ({ content }) => {
    const navigate = useNavigate();
    if (!content) return null;

    return (
        <div className="text-[13px] leading-relaxed text-slate-800 break-words space-y-1.5">
            <ReactMarkdown
                components={{
                    h1: ({ node, ...props }) => (
                        <h1 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1 mt-2.5 mb-1.5 flex items-center gap-1.5" {...props} />
                    ),
                    h2: ({ node, ...props }) => (
                        <h2 className="text-[13.5px] font-bold text-slate-900 border-b border-slate-100 pb-1 mt-2 mb-1" {...props} />
                    ),
                    h3: ({ node, ...props }) => (
                        <h3 className="text-[13px] font-bold text-red-600 mt-2 mb-1 flex items-center gap-1" {...props} />
                    ),
                    p: ({ node, ...props }) => (
                        <p className="mb-1.5 leading-relaxed text-slate-800 last:mb-0" {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                        <ul className="list-disc pl-4 space-y-1 mb-2 text-slate-700" {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                        <ol className="list-decimal pl-4 space-y-1.5 mb-2 font-medium text-slate-800" {...props} />
                    ),
                    li: ({ node, ...props }) => (
                        <li className="leading-snug" {...props} />
                    ),
                    strong: ({ node, ...props }) => (
                        <strong className="font-semibold text-slate-900 text-red-700 bg-red-50/60 px-1 py-0.5 rounded" {...props} />
                    ),
                    hr: () => (
                        <hr className="my-2.5 border-t border-slate-200" />
                    ),
                    blockquote: ({ node, ...props }) => (
                        <blockquote className="border-l-2 border-red-500 pl-2.5 italic text-slate-600 my-1.5 bg-slate-50 py-0.5 rounded-r" {...props} />
                    ),
                    code: ({ node, inline, ...props }) => (
                        inline
                            ? <code className="bg-slate-100 text-red-600 font-mono text-[11px] px-1 py-0.5 rounded border border-slate-200" {...props} />
                            : <code className="block bg-slate-900 text-slate-100 font-mono text-xs p-2.5 rounded-lg overflow-x-auto my-1.5" {...props} />
                    ),
                    table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-2 rounded-lg border border-slate-200 shadow-xs">
                            <table className="min-w-full divide-y divide-slate-200 text-xs text-left" {...props} />
                        </div>
                    ),
                    th: ({ node, ...props }) => (
                        <th className="bg-slate-100 px-2 py-1.5 font-bold text-slate-700 uppercase tracking-wider text-[11px]" {...props} />
                    ),
                    td: ({ node, ...props }) => (
                        <td className="px-2 py-1.5 border-t border-slate-100" {...props} />
                    ),
                    a: ({ node, href, children, ...props }) => {
                        // Tự động chuẩn hoá các link localhost thành relative route
                        const cleanHref = href ? href.replace(/^https?:\/\/localhost(:\d+)?/, '') : href;
                        const isInternal = cleanHref && cleanHref.startsWith('/');

                        return (
                            <a
                                href={cleanHref || href}
                                onClick={(e) => {
                                    if (isInternal) {
                                        e.preventDefault();
                                        navigate(cleanHref);
                                    }
                                }}
                                target={isInternal ? undefined : "_blank"}
                                rel={isInternal ? undefined : "noopener noreferrer"}
                                className="text-red-600 hover:text-red-700 underline font-medium cursor-pointer"
                                {...props}
                            >
                                {children}
                            </a>
                        );
                    }
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownMessage;
