"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, BarChart3, X, Plus } from "lucide-react";
import { sendChatMessage, createPoll, votePoll, toggleReaction } from "@/app/actions";
import type { ChatMessageDTO } from "@/lib/chat";
import { REACTION_EMOJI } from "@/lib/reactions";

function ReactionPicker({
  align,
  onPick,
  onClose,
}: {
  align: "left" | "right";
  onPick: (emoji: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      {/* Full-screen backdrop to catch a tap-away and close the picker. */}
      <div className="fixed inset-0 z-30" onClick={onClose} onTouchStart={onClose} />
      <div
        className={`absolute z-40 -top-12 ${align === "left" ? "left-0" : "right-0"} flex gap-1 bg-surface border-2 border-foreground rounded-full px-2 py-1.5 shadow-[3px_3px_0_0_var(--foreground)]`}
      >
        {REACTION_EMOJI.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onPick(emoji)}
            className="text-lg leading-none hover:scale-125 transition-transform cursor-pointer"
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
}

function ReactionBadge({
  reactions,
  align,
  onToggle,
}: {
  reactions: ChatMessageDTO["reactions"];
  align: "left" | "right";
  onToggle: (emoji: string) => void;
}) {
  const active = reactions.filter((r) => r.count > 0);
  if (active.length === 0) return null;

  return (
    <div className={`absolute -bottom-2.5 ${align === "left" ? "-left-1.5" : "-right-1.5"} flex gap-0.5 z-20`}>
      {active.map((r) => (
        <button
          key={r.emoji}
          type="button"
          onClick={() => onToggle(r.emoji)}
          className={`flex items-center gap-0.5 text-[11px] rounded-full border-2 bg-background px-1.5 py-0.5 cursor-pointer ${
            r.mine ? "border-primary" : "border-border"
          }`}
        >
          <span>{r.emoji}</span>
          {r.count > 1 && <span className="text-muted">{r.count}</span>}
        </button>
      ))}
    </div>
  );
}

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
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showPollForm, setShowPollForm] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [sending, setSending] = useState(false);
  // Reasons from the pre-send shield: confirmNotice is a soft warning the
  // user can send past ("Send anyway"); blockedNotice has no override — the
  // message wasn't sent and the user needs to edit it. Both clear as soon as
  // the draft changes, since they describe a scan of the text as it was.
  const [confirmNotice, setConfirmNotice] = useState<string[] | null>(null);
  const [blockedNotice, setBlockedNotice] = useState<string[] | null>(null);
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

  async function refreshMessages() {
    const res = await fetch(`/api/events/${eventId}/messages`);
    if (res.ok) setMessages((await res.json()).messages);
  }

  async function submitDraft(acknowledged: boolean) {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const result = await sendChatMessage(eventId, content, { acknowledged });
      if (result.status === "sent") {
        setDraft("");
        setConfirmNotice(null);
        setBlockedNotice(null);
        await refreshMessages();
      } else if (result.status === "confirm") {
        setConfirmNotice(result.reasons);
        setBlockedNotice(null);
      } else {
        setBlockedNotice(result.reasons);
        setConfirmNotice(null);
      }
    } finally {
      setSending(false);
    }
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    await submitDraft(false);
  }

  function handleDraftChange(value: string) {
    setDraft(value);
    // A prior warning/block described a scan of the old text — it no longer
    // applies once the user starts editing.
    if (confirmNotice) setConfirmNotice(null);
    if (blockedNotice) setBlockedNotice(null);
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

  async function handleToggleReaction(messageId: string, emoji: string) {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              reactions: m.reactions.map((r) =>
                r.emoji === emoji
                  ? { ...r, mine: !r.mine, count: r.mine ? r.count - 1 : r.count + 1 }
                  : r,
              ),
            }
          : m,
      ),
    );
    await toggleReaction(eventId, messageId, emoji);
  }

  function startPress(messageId: string) {
    pressTimer.current = setTimeout(() => setPickerFor(messageId), 450);
  }

  function cancelPress() {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div ref={scrollRef} className="flex-1 flex flex-col gap-3 p-4 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-sm text-muted text-center py-6">
            No messages yet. Say hi to the group.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender.id === currentUserId;
          const align = mine ? "left" : "right";
          return (
            <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              <span className="text-xs text-muted mb-0.5">
                {mine ? "You" : m.sender.name} · {formatTime(m.createdAt)}
              </span>
              <div
                className="relative select-none"
                onTouchStart={() => startPress(m.id)}
                onTouchEnd={cancelPress}
                onTouchMove={cancelPress}
                onMouseDown={() => startPress(m.id)}
                onMouseUp={cancelPress}
                onMouseLeave={cancelPress}
                onContextMenu={(e) => e.preventDefault()}
              >
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
                <ReactionBadge
                  reactions={m.reactions}
                  align={align}
                  onToggle={(emoji) => handleToggleReaction(m.id, emoji)}
                />
                {pickerFor === m.id && (
                  <ReactionPicker
                    align={align}
                    onPick={(emoji) => {
                      handleToggleReaction(m.id, emoji);
                      setPickerFor(null);
                    }}
                    onClose={() => setPickerFor(null)}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t-2 border-foreground p-3 shrink-0">
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

        {blockedNotice && (
          <div className="mb-2 rounded-md border-2 border-[#8c2f2f] bg-[#8c2f2f]/5 px-3 py-2 text-sm">
            <p className="font-medium text-[#8c2f2f]">This message wasn&apos;t sent</p>
            <p className="text-muted mt-0.5">
              {blockedNotice[0]} For everyone&apos;s safety, keep contact details and links inside WhoWe
              chat — edit your message to continue.
            </p>
          </div>
        )}

        {confirmNotice && (
          <div className="mb-2 rounded-md border-2 border-foreground bg-surface px-3 py-2 text-sm">
            <p>{confirmNotice[0]} Send it anyway?</p>
            <div className="flex items-center gap-3 mt-1.5">
              <button
                type="button"
                onClick={() => submitDraft(true)}
                disabled={sending}
                className="text-primary font-medium hover:underline cursor-pointer disabled:opacity-50"
              >
                Send anyway
              </button>
              <button
                type="button"
                onClick={() => setConfirmNotice(null)}
                className="text-muted hover:text-foreground cursor-pointer"
              >
                Edit message
              </button>
            </div>
          </div>
        )}

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
            onChange={(e) => handleDraftChange(e.target.value)}
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
        <p className="text-[11px] text-muted mt-1.5 text-center">
          Messages are screened for shared contact info and unsafe content.
        </p>
      </div>
    </div>
  );
}
