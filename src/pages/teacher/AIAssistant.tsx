import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { useTenant } from "@/lib/tenant";
import { sendPedagogicalQuery, CONTROLLED_REFUSAL_MESSAGE } from "@/services/aiAssistant";
import { Spinner } from "@/components/ui";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

// Module-scope id generator: keeps the impure Date.now()/counter out of the
// component body (React purity rules) and avoids collisions within one ms.
let msgSeq = 0;
function newMessageId(prefix: string): string {
  msgSeq += 1;
  return `${prefix}-${Date.now()}-${msgSeq}`;
}

const SAMPLE_PROMPTS = [
  "How can I introduce fractions using classroom objects to Class 3?",
  "Suggest a 15-minute hands-on science experiment for plant parts.",
  "What is an effective strategy to handle student misconceptions about gravity?",
  "Help me structure a 45-minute lesson plan on photosynthesis.",
];

export default function TeacherAIAssistant() {
  const { profile } = useAuth();
  const { school } = useTenant();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro",
      role: "assistant",
      content: `Hello ${profile?.full_name || "Teacher"}. I am your Kairo Pedagogical Assistant for ${school?.name || "your school"}.\n\nI can assist with lesson preparation, classroom explanations, pedagogical strategies, student engagement techniques, and curriculum alignment. What educational concept are we exploring today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (userText?: string) => {
    const textToSend = userText || input;
    if (!textToSend.trim() || loading || !school || !profile) return;

    const userMsg: Message = {
      id: newMessageId("usr"),
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      const reply = await sendPedagogicalQuery({
        schoolId: school.id,
        teacherId: profile.id,
        messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
      });

      const assistantMsg: Message = {
        id: newMessageId("asst"),
        role: "assistant",
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: newMessageId("asst-err"),
          role: "assistant",
          content: "I encountered an error connecting to the educational model. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-fg/10 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent text-xl">
            🤖
          </div>
          <div>
            <h1 className="text-xl font-bold text-fg">Pedagogical AI Assistant</h1>
            <p className="text-xs text-fg/60">
              Grounded exclusively in teaching, lesson prep, and student-learning strategies
            </p>
          </div>
        </div>

        <span className="badge bg-emerald-50 text-emerald-700 text-xs font-semibold">
          Topic Guardrails Active
        </span>
      </div>

      {/* Controlled scope notice */}
      <div className="bg-surface/50 border border-fg/5 rounded-lg px-3 py-2 text-xs text-fg/70 flex items-center justify-between">
        <span>
          💡 <strong>Controlled Scope:</strong> This assistant handles educational and pedagogical inquiries only. Off-topic queries receive a controlled refusal.
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-2xl bg-surface/30 border border-fg/5">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
          >
            <div className="flex items-center gap-1.5 text-[10px] text-fg/40 mb-1 px-1">
              <span>{m.role === "user" ? "You" : "Kairo AI"}</span>
              <span>·</span>
              <span>{m.timestamp}</span>
            </div>

            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line shadow-sm ${
                m.role === "user"
                  ? "bg-accent text-white rounded-br-none"
                  : m.content === CONTROLLED_REFUSAL_MESSAGE
                  ? "bg-amber-50 text-amber-900 border border-amber-200 rounded-bl-none font-medium"
                  : "bg-bg border border-fg/10 text-fg rounded-bl-none"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 p-3 text-xs text-fg/50 italic">
            <Spinner label="Formulating pedagogical response…" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
        {SAMPLE_PROMPTS.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            className="rounded-full bg-surface hover:bg-surface/80 border border-fg/10 px-3 py-1 text-[11px] text-fg/75 hover:text-fg whitespace-nowrap transition cursor-pointer"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2 pt-1"
      >
        <input
          type="text"
          placeholder="Ask a question about lesson prep, classroom strategies, or pedagogical explanations…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 rounded-xl border border-fg/15 bg-bg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="btn-primary text-sm px-5 rounded-xl flex items-center gap-1.5"
        >
          <span>Send</span> →
        </button>
      </form>
    </div>
  );
}
