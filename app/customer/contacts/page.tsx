"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ChevronRight,
  MessageSquare,
  Plus,
  Send,
} from "lucide-react";
import { useRoleAuth } from "@/contexts";
import { PageLoader } from "@/components";
import { CustomerSiteNavigation } from "@/components/navigation";
import { ELEGANZA } from "@/lib/publicBrand";
import {
  getMyTickets,
  getMyTicket,
  replyToMyTicket,
  submitTicket,
} from "@/services";
import { Ticket, TicketDetail, TicketMessage, TicketStatus } from "@/types";

type View = "list" | "detail" | "new";

const STATUS_META: Record<
  TicketStatus,
  { label: string; bg: string; color: string }
> = {
  Open: { label: "Open", bg: "rgba(129, 123, 100, 0.15)", color: ELEGANZA.accent },
  InProgress: { label: "In Progress", bg: "rgba(59, 130, 246, 0.12)", color: "#2563EB" },
  WaitingForCustomer: {
    label: "Awaiting Your Reply",
    bg: "rgba(217, 119, 6, 0.14)",
    color: "#B45309",
  },
  Resolved: { label: "Resolved", bg: "rgba(34, 197, 94, 0.12)", color: "#2F855A" },
  Closed: { label: "Closed", bg: "rgba(118, 118, 118, 0.14)", color: ELEGANZA.inkMuted },
};

function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Tickets list may arrive as data[] or { data: { data[] } } depending on the envelope. */
function unwrapTickets(raw: unknown): Ticket[] {
  if (Array.isArray(raw)) return raw as Ticket[];
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    if (Array.isArray(r.data)) return r.data as Ticket[];
    if (r.data && typeof r.data === "object") {
      const inner = (r.data as Record<string, unknown>).data;
      if (Array.isArray(inner)) return inner as Ticket[];
    }
  }
  return [];
}

function unwrapTicket(raw: unknown): TicketDetail | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (r.id) return r as unknown as TicketDetail;
  if (r.data && typeof r.data === "object") {
    const d = r.data as Record<string, unknown>;
    if (d.id) return d as unknown as TicketDetail;
  }
  return null;
}

export default function CustomerContactsPage() {
  const router = useRouter();
  const { getSession, isLoading: authLoading } = useRoleAuth();
  const { user, token } = getSession("Customer");

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");

  // Detail state
  const [activeTicket, setActiveTicket] = useState<TicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  // New ticket state
  const [subject, setSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [creating, setCreating] = useState(false);

  const businessSlug =
    typeof window !== "undefined"
      ? localStorage.getItem("customer_businessSiteSlug")
      : null;
  const envSlug = process.env.NEXT_PUBLIC_BUSINESS_SLUG || null;
  const resolvedSlug = businessSlug || envSlug;

  useEffect(() => {
    if (!authLoading && !token) {
      router.replace("/auth/login/customer");
    }
  }, [authLoading, token, router]);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMyTickets({ page: 1, limit: 50 });
      setTickets(unwrapTickets(res?.data));
    } catch (err) {
      toast.error("Failed to load your messages. Please try again.");
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) fetchTickets();
  }, [token, fetchTickets]);

  const openTicket = useCallback(async (id: string) => {
    setView("detail");
    setActiveTicket(null);
    setReplyText("");
    try {
      setDetailLoading(true);
      const res = await getMyTicket(id);
      setActiveTicket(unwrapTicket(res?.data));
    } catch (err) {
      toast.error("Couldn't open this conversation. Please try again.");
      // eslint-disable-next-line no-console
      console.error(err);
      setView("list");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleReply = async () => {
    const message = replyText.trim();
    if (!activeTicket || !message) return;
    try {
      setReplying(true);
      const res = await replyToMyTicket(activeTicket.id, message);
      const updated = unwrapTicket(res?.data);
      if (updated) setActiveTicket(updated);
      setReplyText("");
      await fetchTickets();
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      if (status === 400) {
        toast.error(
          "This conversation is closed. Please start a new message instead.",
        );
      } else {
        toast.error("Could not send your reply. Please try again.");
      }
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setReplying(false);
    }
  };

  const handleCreate = async () => {
    const trimmedSubject = subject.trim();
    const trimmedMessage = newMessage.trim();
    if (!trimmedSubject || !trimmedMessage) {
      toast.error("Please add a subject and a message.");
      return;
    }
    try {
      setCreating(true);
      const res = await submitTicket({
        subject: trimmedSubject,
        message: trimmedMessage,
        ...(resolvedSlug ? { businessSlug: resolvedSlug } : {}),
      });
      const created = unwrapTicket(res?.data);
      toast.success("Message sent! We'll get back to you soon.");
      setSubject("");
      setNewMessage("");
      await fetchTickets();
      if (created) {
        await openTicket(created.id);
      } else {
        setView("list");
      }
    } catch (err) {
      toast.error("Could not send your message. Please try again.");
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const sortedTickets = useMemo(
    () =>
      [...tickets].sort((a, b) => {
        const aTime = new Date(a.lastReplyAt || a.updatedAt || 0).getTime();
        const bTime = new Date(b.lastReplyAt || b.updatedAt || 0).getTime();
        return bTime - aTime;
      }),
    [tickets],
  );

  if (authLoading) return <PageLoader />;
  if (!user || !token) return null;

  return (
    <div
      className="min-h-screen text-[#222222]"
      style={{ backgroundColor: ELEGANZA.background }}
    >
      {/* Shared site navigation — keeps Home / Contact / My Bookings reachable */}
      <CustomerSiteNavigation />

      <main className="pt-18 md:pt-20 lg:pt-22">
        {/* Hero */}
        <section
          className="py-12 px-6 lg:px-16"
          style={{ backgroundColor: ELEGANZA.surfaceMuted }}
        >
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
            >
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-[0.4em] mb-3"
                  style={{ color: ELEGANZA.inkMuted }}
                >
                  Support
                </p>
                <h1
                  className="font-black uppercase mb-3"
                  style={{
                    fontSize: "clamp(1.75rem, 4vw, 3rem)",
                    letterSpacing: "0.04em",
                    color: ELEGANZA.ink,
                  }}
                >
                  Messages
                </h1>
                <p style={{ color: ELEGANZA.inkMuted }} className="text-base">
                  Get in touch and keep track of your conversations.
                </p>
              </div>
              {view === "list" && (
                <button
                  onClick={() => {
                    setSubject("");
                    setNewMessage("");
                    setView("new");
                  }}
                  className="flex items-center gap-2 px-6 py-3 rounded text-white text-sm font-semibold uppercase tracking-[0.2em] transition-colors self-start"
                  style={{ backgroundColor: ELEGANZA.cta }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = ELEGANZA.ctaHover)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = ELEGANZA.cta)
                  }
                >
                  <Plus className="w-4 h-4" />
                  New Message
                </button>
              )}
            </motion.div>
          </div>
        </section>

        <section className="py-10 px-6 lg:px-16">
          <div className="max-w-4xl mx-auto">
            {view === "list" && (
              <TicketList
                loading={loading}
                tickets={sortedTickets}
                onOpen={openTicket}
                onNew={() => {
                  setSubject("");
                  setNewMessage("");
                  setView("new");
                }}
              />
            )}

            {view === "detail" && (
              <TicketThread
                loading={detailLoading}
                ticket={activeTicket}
                replyText={replyText}
                onReplyChange={setReplyText}
                onReply={handleReply}
                replying={replying}
                onBack={() => {
                  setView("list");
                  setActiveTicket(null);
                }}
              />
            )}

            {view === "new" && (
              <NewTicketForm
                subject={subject}
                message={newMessage}
                onSubjectChange={setSubject}
                onMessageChange={setNewMessage}
                onSubmit={handleCreate}
                submitting={creating}
                onCancel={() => setView("list")}
              />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

// ─── List ────────────────────────────────────────────────────────────────────

function TicketList({
  loading,
  tickets,
  onOpen,
  onNew,
}: {
  loading: boolean;
  tickets: Ticket[];
  onOpen: (id: string) => void;
  onNew: () => void;
}) {
  if (loading) {
    return (
      <div
        className="rounded p-16 text-center"
        style={{
          backgroundColor: ELEGANZA.surface,
          border: `1px solid ${ELEGANZA.border}`,
        }}
      >
        <p className="text-sm" style={{ color: ELEGANZA.inkMuted }}>
          Loading your messages...
        </p>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div
        className="rounded p-16 text-center"
        style={{
          backgroundColor: ELEGANZA.surface,
          border: `1px solid ${ELEGANZA.border}`,
        }}
      >
        <div
          className="w-16 h-16 rounded flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: ELEGANZA.surfaceMuted }}
        >
          <MessageSquare
            className="h-8 w-8"
            style={{ color: ELEGANZA.inkMuted }}
          />
        </div>
        <h3 className="text-xl font-bold mb-2" style={{ color: ELEGANZA.ink }}>
          No messages yet
        </h3>
        <p className="text-sm mb-8" style={{ color: ELEGANZA.inkMuted }}>
          Have a question? Start a conversation and we&apos;ll get back to you.
        </p>
        <button
          onClick={onNew}
          className="inline-flex items-center gap-2 px-6 py-3 rounded text-white text-sm font-semibold uppercase tracking-[0.2em] transition-colors"
          style={{ backgroundColor: ELEGANZA.cta }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = ELEGANZA.ctaHover)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = ELEGANZA.cta)
          }
        >
          <Plus className="w-4 h-4" />
          New Message
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map((t, idx) => {
        const meta = STATUS_META[t.status] ?? STATUS_META.Open;
        return (
          <motion.button
            key={t.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(idx * 0.03, 0.3) }}
            onClick={() => onOpen(t.id)}
            className="group w-full text-left rounded-lg p-5 transition-all hover:shadow-sm"
            style={{
              backgroundColor: ELEGANZA.surface,
              border: `1px solid ${ELEGANZA.border}`,
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div
                  className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest mb-1.5"
                  style={{ color: ELEGANZA.inkMuted }}
                >
                  <span>#{t.ticketNumber}</span>
                </div>
                <h3
                  className="text-base font-bold truncate"
                  style={{ color: ELEGANZA.ink }}
                >
                  {t.subject}
                </h3>
                <p
                  className="text-xs mt-2"
                  style={{ color: ELEGANZA.inkMuted }}
                >
                  Last activity {formatDateTime(t.lastReplyAt || t.updatedAt)}
                </p>
              </div>
              <span
                className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex-shrink-0"
                style={{ backgroundColor: meta.bg, color: meta.color }}
              >
                {meta.label}
              </span>
            </div>

            <div
              className="mt-4 pt-3 flex justify-end"
              style={{ borderTop: `1px solid ${ELEGANZA.border}` }}
            >
              <span
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded text-[11px] font-bold uppercase tracking-[0.2em] transition-colors group-hover:bg-black/5"
                style={{
                  border: `1px solid ${ELEGANZA.ink}`,
                  color: ELEGANZA.ink,
                }}
              >
                View Conversation
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── Auto-growing textarea ──────────────────────────────────────────────────

/**
 * Textarea that grows with its content so the user always sees what they're
 * typing, up to `maxHeight` (then it scrolls). Replaces fixed-row boxes.
 */
function AutoTextarea({
  value,
  onChange,
  minRows = 3,
  maxHeight = 260,
  className = "",
  ...rest
}: {
  value: string;
  onChange: (v: string) => void;
  minRows?: number;
  maxHeight?: number;
} & Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "value" | "onChange" | "rows"
>) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [value, maxHeight]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={minRows}
      className={`resize-none overflow-y-auto ${className}`}
      {...rest}
    />
  );
}

// ─── Thread / detail ───────────────────────────────────────────────────────

function TicketThread({
  loading,
  ticket,
  replyText,
  onReplyChange,
  onReply,
  replying,
  onBack,
}: {
  loading: boolean;
  ticket: TicketDetail | null;
  replyText: string;
  onReplyChange: (v: string) => void;
  onReply: () => void;
  replying: boolean;
  onBack: () => void;
}) {
  const isClosed = ticket?.status === "Closed";
  const meta = ticket
    ? STATUS_META[ticket.status] ?? STATUS_META.Open
    : STATUS_META.Open;

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-5 transition-colors"
        style={{ color: ELEGANZA.inkMuted }}
        onMouseEnter={(e) => (e.currentTarget.style.color = ELEGANZA.ink)}
        onMouseLeave={(e) => (e.currentTarget.style.color = ELEGANZA.inkMuted)}
      >
        <ArrowLeft className="w-4 h-4" />
        All messages
      </button>

      {loading || !ticket ? (
        <div
          className="rounded p-16 text-center"
          style={{
            backgroundColor: ELEGANZA.surface,
            border: `1px solid ${ELEGANZA.border}`,
          }}
        >
          <p className="text-sm" style={{ color: ELEGANZA.inkMuted }}>
            Loading conversation...
          </p>
        </div>
      ) : (
        <div
          className="rounded-lg overflow-hidden"
          style={{
            backgroundColor: ELEGANZA.surface,
            border: `1px solid ${ELEGANZA.border}`,
          }}
        >
          {/* Header */}
          <div
            className="p-5 flex items-start justify-between gap-4"
            style={{ borderBottom: `1px solid ${ELEGANZA.border}` }}
          >
            <div className="min-w-0">
              <p
                className="text-[11px] font-semibold uppercase tracking-widest mb-1"
                style={{ color: ELEGANZA.inkMuted }}
              >
                #{ticket.ticketNumber}
              </p>
              <h2
                className="text-lg font-bold"
                style={{ color: ELEGANZA.ink }}
              >
                {ticket.subject}
              </h2>
            </div>
            <span
              className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex-shrink-0"
              style={{ backgroundColor: meta.bg, color: meta.color }}
            >
              {meta.label}
            </span>
          </div>

          {/* Messages */}
          <div
            className="p-5 space-y-4 max-h-[55vh] overflow-y-auto"
            style={{ backgroundColor: ELEGANZA.background }}
          >
            {ticket.messages?.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
          </div>

          {/* Reply box */}
          <div
            className="p-5"
            style={{ borderTop: `1px solid ${ELEGANZA.border}` }}
          >
            {isClosed ? (
              <p
                className="text-sm text-center"
                style={{ color: ELEGANZA.inkMuted }}
              >
                This conversation is closed. Start a new message if you still
                need help.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                <AutoTextarea
                  value={replyText}
                  onChange={onReplyChange}
                  minRows={3}
                  placeholder="Write a reply..."
                  className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: ELEGANZA.surface,
                    color: ELEGANZA.ink,
                    border: `1px solid ${ELEGANZA.border}`,
                  }}
                />
                <div className="flex justify-end">
                  <button
                    onClick={onReply}
                    disabled={replying || !replyText.trim()}
                    className="flex items-center gap-2 px-6 py-2.5 rounded text-white text-xs font-semibold uppercase tracking-[0.2em] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ backgroundColor: ELEGANZA.cta }}
                    onMouseEnter={(e) => {
                      if (!replying && replyText.trim())
                        e.currentTarget.style.backgroundColor =
                          ELEGANZA.ctaHover;
                    }}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = ELEGANZA.cta)
                    }
                  >
                    <Send className="w-3.5 h-3.5" />
                    {replying ? "Sending..." : "Send Reply"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: TicketMessage }) {
  const isCustomer = message.authorType === "Customer";
  const isSystem = message.authorType === "System";

  if (isSystem) {
    return (
      <div className="text-center">
        <span
          className="inline-block text-[11px] italic px-3 py-1"
          style={{ color: ELEGANZA.inkMuted }}
        >
          {message.body}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[80%]">
        <div
          className="rounded-lg px-4 py-3"
          style={{
            backgroundColor: isCustomer ? ELEGANZA.ink : ELEGANZA.surface,
            color: isCustomer ? "white" : ELEGANZA.ink,
            border: isCustomer ? "none" : `1px solid ${ELEGANZA.border}`,
          }}
        >
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.body}
          </p>
        </div>
        <p
          className={`text-[10px] mt-1 ${isCustomer ? "text-right" : "text-left"}`}
          style={{ color: ELEGANZA.inkMuted }}
        >
          {message.authorName} · {formatDateTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

// ─── New ticket ──────────────────────────────────────────────────────────────

function NewTicketForm({
  subject,
  message,
  onSubjectChange,
  onMessageChange,
  onSubmit,
  submitting,
  onCancel,
}: {
  subject: string;
  message: string;
  onSubjectChange: (v: string) => void;
  onMessageChange: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  onCancel: () => void;
}) {
  return (
    <div>
      <button
        onClick={onCancel}
        className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-5 transition-colors"
        style={{ color: ELEGANZA.inkMuted }}
        onMouseEnter={(e) => (e.currentTarget.style.color = ELEGANZA.ink)}
        onMouseLeave={(e) => (e.currentTarget.style.color = ELEGANZA.inkMuted)}
      >
        <ArrowLeft className="w-4 h-4" />
        All messages
      </button>

      <div
        className="rounded-lg p-6"
        style={{
          backgroundColor: ELEGANZA.surface,
          border: `1px solid ${ELEGANZA.border}`,
        }}
      >
        <h2
          className="text-lg font-bold mb-6"
          style={{ color: ELEGANZA.ink }}
        >
          New Message
        </h2>

        <div className="space-y-5">
          <div>
            <label
              className="block text-[11px] font-bold uppercase tracking-widest mb-2"
              style={{ color: ELEGANZA.inkMuted }}
            >
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => onSubjectChange(e.target.value)}
              placeholder="What's this about?"
              className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{
                backgroundColor: ELEGANZA.surface,
                color: ELEGANZA.ink,
                border: `1px solid ${ELEGANZA.border}`,
              }}
            />
          </div>

          <div>
            <label
              className="block text-[11px] font-bold uppercase tracking-widest mb-2"
              style={{ color: ELEGANZA.inkMuted }}
            >
              Message
            </label>
            <AutoTextarea
              value={message}
              onChange={onMessageChange}
              minRows={6}
              maxHeight={360}
              placeholder="Tell us how we can help..."
              className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{
                backgroundColor: ELEGANZA.surface,
                color: ELEGANZA.ink,
                border: `1px solid ${ELEGANZA.border}`,
              }}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onCancel}
              disabled={submitting}
              className="px-6 py-3 rounded text-xs font-semibold uppercase tracking-[0.2em] border transition-colors disabled:opacity-60"
              style={{
                borderColor: ELEGANZA.border,
                color: ELEGANZA.ink,
                backgroundColor: "transparent",
              }}
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={submitting || !subject.trim() || !message.trim()}
              className="flex items-center gap-2 px-6 py-3 rounded text-white text-xs font-semibold uppercase tracking-[0.2em] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: ELEGANZA.cta }}
              onMouseEnter={(e) => {
                if (!submitting && subject.trim() && message.trim())
                  e.currentTarget.style.backgroundColor = ELEGANZA.ctaHover;
              }}
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = ELEGANZA.cta)
              }
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? "Sending..." : "Send Message"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
