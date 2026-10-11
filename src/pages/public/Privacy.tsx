export default function Privacy() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 prose-sm">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-fg/50">Royal School – CBSE · KAIRO</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-fg/75">
        <section>
          <h2 className="text-lg font-semibold text-fg">What we store</h2>
          <p>KAIRO stores teacher and administrator accounts, the school's approved curriculum
          materials, and the resources teachers generate (explanations, activities, worksheets,
          quizzes). Curriculum files are kept in private storage and are never public.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-fg">Who can see what</h2>
          <p>Teachers can only access materials for the classes and subjects they are assigned, and
          only their own generated resources and conversations. Administrators manage accounts and
          curriculum but do not have access to individual teachers' private conversations.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-fg">AI processing</h2>
          <p>When a teacher asks a question, only the relevant authorized passages are sent to the
          configured AI provider to produce an answer. We do not use uploaded curriculum to train
          external models.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-fg">Data retention</h2>
          <p>Generated resources and conversations are retained so teachers can reopen them, and can
          be deleted by the owning teacher at any time.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-fg">Contact</h2>
          <p>Questions? Email <a className="text-accent" href="mailto:contact@royalschool.example">contact@royalschool.example</a>.</p>
        </section>
      </div>
    </article>
  );
}
