import { Link } from "react-router-dom";
import { useTenant } from "@/lib/tenant";

export default function TeacherLearning() {
  const { school } = useTenant();

  const learningModules = [
    {
      title: "Active Learning & Scaffolding Strategies",
      category: "Pedagogy",
      level: "Intermediate",
      description: "Techniques for transitioning from passive lecture delivery to student-centered inquiry in primary classrooms.",
      icon: "🧠",
      duration: "45 mins",
    },
    {
      title: "Addressing Common STEM Misconceptions",
      category: "Science & Math",
      level: "Foundational",
      description: "Proven cognitive conflict exercises for correcting persistent student misunderstandings in Grades 1–5.",
      icon: "🔬",
      duration: "30 mins",
    },
    {
      title: "Formative Assessment & Exit Ticket Design",
      category: "Assessment",
      level: "All Levels",
      description: "Designing fast, 3-minute checks for understanding that reveal actual comprehension without grading overhead.",
      icon: "📊",
      duration: "25 mins",
    },
    {
      title: "Differentiated Instruction for Mixed-Ability Classes",
      category: "Classroom Strategy",
      level: "Advanced",
      description: "Practical tiering techniques for assignments and activities so every student stays challenged and supported.",
      icon: "🎯",
      duration: "40 mins",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="card p-8 bg-gradient-to-r from-accent-soft via-surface to-bg border border-accent/20 relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <span className="chip mb-3 bg-accent text-white font-semibold text-xs">
            Teacher Professional Development
          </span>
          <h1 className="text-3xl font-extrabold text-fg tracking-tight">
            Teacher Learning & Pedagogical Development
          </h1>
          <p className="mt-2 text-sm text-fg/70 leading-relaxed">
            Curated educational methodologies, teaching strategies, and curriculum grounding specifically for teaching staff at {school?.name || "your school"}.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/teacher/ai-assistant" className="btn-primary text-xs flex items-center gap-2">
              <span>🤖 Launch Pedagogical AI Assistant</span> →
            </Link>
            <Link to="/teacher/materials" className="btn-outline text-xs">
              View School Curriculum Materials
            </Link>
          </div>
        </div>
      </div>

      {/* Core Teaching Pillars */}
      <div>
        <h2 className="text-xl font-bold text-fg mb-4">Pedagogical Frameworks & Core Modules</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {learningModules.map((m) => (
            <div
              key={m.title}
              className="card p-5 border border-fg/10 flex flex-col justify-between hover:border-accent/40 hover:shadow-md transition"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{m.icon}</span>
                  <span className="badge bg-surface text-fg/70 text-[10px] font-semibold">
                    {m.category}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-fg mb-1.5">{m.title}</h3>
                <p className="text-xs text-fg/60 leading-relaxed">{m.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-fg/5 flex items-center justify-between text-[11px] text-fg/50">
                <span>⏱️ {m.duration}</span>
                <span className="text-accent font-semibold hover:underline cursor-pointer">
                  Start Module →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Teaching Resources & Lesson Prep Aid */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card p-6 border border-fg/10 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 text-xl font-bold">
              📚
            </div>
            <div>
              <h3 className="font-bold text-base text-fg">Curriculum-Grounded Generator</h3>
              <p className="text-xs text-fg/60">Generate activities, worksheets, and quizzes grounded in verified chapters</p>
            </div>
          </div>
          <p className="text-xs text-fg/70 leading-relaxed">
            All AI lesson resources draw directly from your school's approved textbooks with verifiable page citations. Hallucinated or unsourced concepts are systematically filtered out.
          </p>
          <div className="flex gap-2 pt-2">
            <Link to="/teacher/activities" className="btn-outline text-xs">
              Activities (13 types)
            </Link>
            <Link to="/teacher/worksheets" className="btn-outline text-xs">
              Worksheets + Answer Keys
            </Link>
            <Link to="/teacher/quizzes" className="btn-outline text-xs">
              Quizzes & Marks
            </Link>
          </div>
        </div>

        <div className="card p-6 border border-fg/10 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 text-xl font-bold">
              💬
            </div>
            <div>
              <h3 className="font-bold text-base text-fg">Pedagogical Consultation AI</h3>
              <p className="text-xs text-fg/60">Real-time classroom strategy and concept explanation assistant</p>
            </div>
          </div>
          <p className="text-xs text-fg/70 leading-relaxed">
            Need advice on how to explain a difficult concept, manage diverse pacing, or construct an inquiry hook? The Kairo Pedagogical Assistant is ready to collaborate with you.
          </p>
          <div className="pt-2">
            <Link to="/teacher/ai-assistant" className="btn-primary text-xs">
              Open Chat Assistant →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
