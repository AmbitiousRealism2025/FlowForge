export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-neutral-slate to-gray-900 p-24">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-flow-green">FlowForge</h1>
        <p className="mb-8 text-xl text-gray-300">
          Your AI Productivity Companion for Vibe Coding
        </p>
        <div className="flex gap-4 justify-center">
          <div className="rounded-lg bg-flow-green/10 border border-flow-green p-6 text-left">
            <h2 className="mb-2 text-lg font-semibold text-flow-green">🚀 Track Flow States</h2>
            <p className="text-sm text-gray-400">
              Monitor your creative flow and protect deep work sessions
            </p>
          </div>
          <div className="rounded-lg bg-claude-purple/10 border border-claude-purple p-6 text-left">
            <h2 className="mb-2 text-lg font-semibold text-claude-purple">🤖 AI Context Health</h2>
            <p className="text-sm text-gray-400">
              Keep your AI conversations fresh and productive
            </p>
          </div>
          <div className="rounded-lg bg-caution-amber/10 border border-caution-amber p-6 text-left">
            <h2 className="mb-2 text-lg font-semibold text-caution-amber">📦 Ship Velocity</h2>
            <p className="text-sm text-gray-400">
              Celebrate deployments over task completion
            </p>
          </div>
        </div>
        <p className="mt-8 text-sm text-gray-500">
          Phase 1: Foundation - Ready for implementation
        </p>
      </div>
    </main>
  )
}
