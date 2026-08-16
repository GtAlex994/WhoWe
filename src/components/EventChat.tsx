"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, BarChart3, X, Plus } from "lucide-react";
import { sendChatMessage, createPoll, votePoll } from "@/app/actions";
import type { ChatMessageDTO } from "@/lib/chat";

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

function PollCard({
  poll,
  onVote,
}: {
  poll: NonNullable<ChatMessageDTO["poll"]>;
  onVote: (pollId: string, optionId: string) => void;
}) {
  return (
    <div className="bg-surface border-2 border-foreground rounded-lg p-3 shadow-[3px_3px_0_0_var(--foreground)] max-w-xs">
      <div className="flex items-center gap-1.5 text-xs font-medium text-accent uppercase tracking-wide mb-2">
        <BarChart3 size={14} />
        Poll
      </div>
      <div className="font-medium mb-2">{poll.question}</div>
      <div className="flex flex-col gap-1.5">
        {poll.options.map((opt) => {
          const pct = poll.totalVotes > 0 ? Math.round((opt.voteCount / poll.totalVotes) * 100) : 0;
          const mine = opt.id === poll.myVoteOptionId;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onVote(poll.id, opt.id)}
              className={`relative w-full text-left rounded-md px-3 py-1.5 overflow-hidden border-2 cursor-pointer ${
                mine ? "border-primary" : "border-border"
              }`}
            >
              <span
                className="absolute inset-y-0 left-0 bg-accent-soft transition-all"
                style={{ width: `${pct}%` }}
                aria-hidden
              />
              <span className="relative flex items-center justify-between gap-2 text-sm">
                <span className={mine ? "font-semibold" : ""}>
                  {mine && "✓ "}
                  {opt.label}
                </span>
                <span className="text-muted shrink-0">{pct}%</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="text-xs text-muted mt-2">
        {poll.totalVotes} {poll.totalVotes === 1 ? "vote" : "votes"}
      </div>
    </div>
  );
}

export function EventChat({
  eventId,
  currentUserId,
  initialMessages,
}: {
  eventId: string;
  currentUserId: string;
  initialMessages: ChatMessageDTO[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [showPollForm, setShowPollForm] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/messages`);
        if (!res.ok) return;
        const data = await res.json();
        setMessages(data.messages);
      } catch {
        // Silently skip a missed refresh, next interval will retry.
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [eventId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    setDraft("");
    try {
      await sendChatMessage(eventId, content);
      const res = await fetch(`/api/events/${eventId}/messages`);
      if (res.ok) setMessages((await res.json()).messages);
    } finally {
      setSending(false);
    }
  }

  async function handleCreatePoll(e: FormEvent) {
    e.preventDefault();
    const cleanOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (!pollQuestion.trim() || cleanOptions.length < 2 || sending) return;
    setSending(true);
    try {
      await createPoll(eventId, pollQuestion.trim(), cleanOptions);
      setPollQuestion("");
      setPollOptions(["", ""]);
      setShowPollForm(false);
      const res = await fetch(`/api/events/${eventId}/messages`);
      if (res.ok) setMessages((await res.json()).messages);
    } finally {
      setSending(false);
    }
  }

  async function handleVote(pollId: string, optionId: string) {
    setMessages((prev) =>
      prev.map((m) =>
        m.poll?.id === pollId
          ? {
              ...m,
              poll: {
                ...m.poll,
                myVoteOptionId: optionId,
                options: m.poll.options.map((o) => {
                  const wasMine = o.id === m.poll!.myVoteOptionId;
                  const isNew = o.id === optionId;
                  let voteCount = o.voteCount;
                  if (wasMine && !isNew) voteCount -= 1;
                  if (isNew && !wasMine) voteCount += 1;
                  return { ...o, voteCount };
                }),
              },
            }
          : m,
      ),
    );
    await votePoll(eventId, pollId, optionId);
  }

  return (
    <div className="bg-surface border-2 border-foreground rounded-lg shadow-[3px_3px_0_0_var(--foreground)] flex flex-col">
      <div ref={scrollRef} className="flex flex-col gap-3 p-4 max-h-96 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-sm text-muted text-center py-6">
            No messages yet. Say hi to the group.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender.id === currentUserId;
          return (
            <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              <span className="text-xs text-muted mb-0.5">
                {mine ? "You" : m.sender.name} · {formatTime(m.createdAt)}
              </span>
              {m.poll ? (
                <PollCard poll={m.poll} onVote={handleVote} />
              ) : (
                <div
                  className={`max-w-xs sm:max-w-sm rounded-lg px-3 py-2 border-2 border-foreground text-sm ${
                    mine ? "bg-primary text-primary-foreground" : "bg-surface"
                  }`}
                >
                  {m.content}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t-2 border-foreground p-3">
        <AnimatePresence>
          {showPollForm && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleCreatePoll}
              className="flex flex-col gap-2 mb-3 overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-accent">New poll</span>
                <button
                  type="button"
                  onClick={() => setShowPollForm(false)}
                  className="text-muted hover:text-foreground cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
              <input
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="Ask a question…"
                className="border-2 border-foreground bg-surface rounded-md px-3 py-2 text-sm outline-none"
              />
              {pollOptions.map((opt, i) => (
                <input
                  key={i}
                  value={opt}
                  onChange={(e) =>
                    setPollOptions((prev) => prev.map((o, idx) => (idx === i ? e.target.value : o)))
                  }
                  placeholder={`Option ${i + 1}`}
                  className="border-2 border-foreground bg-surface rounded-md px-3 py-2 text-sm outline-none"
                />
              ))}
              <div className="flex items-center justify-between gap-2">
                {pollOptions.length < 6 ? (
                  <button
                    type="button"
                    onClick={() => setPollOptions((prev) => [...prev, ""])}
                    className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} /> Add option
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="submit"
                  disabled={sending}
                  className="bg-primary text-primary-foreground text-sm font-medium rounded-md px-3 py-1.5 border-2 border-foreground disabled:opacity-50 cursor-pointer"
                >
                  Create poll
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <form onSubmit={handleSend} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPollForm((v) => !v)}
            aria-label="Add poll"
            className={`shrink-0 p-2 rounded-md border-2 cursor-pointer ${
              showPollForm ? "border-primary text-primary" : "border-border text-muted hover:border-foreground hover:text-foreground"
            }`}
          >
            <BarChart3 size={18} />
          </button>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Say something…"
            className="flex-1 border-2 border-foreground bg-surface rounded-md px-3 py-2 text-sm outline-none min-w-0"
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending}
            aria-label="Send"
            className="shrink-0 bg-primary text-primary-foreground p-2 rounded-md border-2 border-foreground disabled:opacity-50 cursor-pointer"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
