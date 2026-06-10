"use client";

import { Mail } from "lucide-react";
import type { TicketMessage } from "@/types";
import { cn, formatDate } from "@/utils";

/**
 * Chat-style conversation thread for a support ticket. Staff messages sit on
 * the right, customer messages on the left, and System notes render centred and
 * muted.
 */
export function TicketConversation({ messages }: { messages: TicketMessage[] }) {
  if (messages.length === 0) {
    return (
      <p className="text-sm text-text-tertiary text-center py-8">
        No messages yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((msg) => {
        if (msg.authorType === "System") {
          return (
            <div key={msg.id} className="flex justify-center">
              <span className="text-xs text-text-tertiary bg-subtle/60 rounded-full px-3 py-1">
                {msg.body}
              </span>
            </div>
          );
        }

        const isStaff = msg.authorType === "Staff";
        return (
          <div
            key={msg.id}
            className={cn("flex", isStaff ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "flex flex-col max-w-[80%] min-w-0",
                isStaff ? "items-end" : "items-start",
              )}
            >
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-xs font-semibold text-text-secondary">
                  {msg.authorName}
                </span>
                <span className="text-[11px] text-text-quaternary tabular">
                  {formatDate(msg.createdAt, "MMM D, h:mm A")}
                </span>
              </div>
              <div
                className={cn(
                  "w-fit max-w-full rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words",
                  isStaff
                    ? "bg-primary-600 text-white rounded-tr-sm"
                    : "bg-subtle text-text-primary rounded-tl-sm",
                )}
              >
                {msg.body}
              </div>
              {msg.viaEmail && (
                <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-text-quaternary">
                  <Mail className="h-3 w-3" />
                  via email
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
