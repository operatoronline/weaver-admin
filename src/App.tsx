import React, { useState, useEffect } from 'react';

interface Session {
  key: string;
  message_count: number;
  updated: number;
  created: number;
}

interface Subagent {
  id: string;
  task: string;
  label: string;
  status: string;
  created: number;
}

interface SystemStatus {
  model: string;
  ready: boolean;
  sessions: Session[];
  subagents: Subagent[];
  uptime: string;
  workspace: string;
}

export default function App() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [logs, setLogs] = useState<string>('');
  const [service, setService] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getApiBase = () => {
    const isDev = window.location.hostname.includes('operator.onl');
    return isDev ? 'https://weaver.operator.onl' : 'https://weaver.onl';
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${getApiBase()}/admin/status`);
      if (!res.ok) throw new Error('Failed to fetch status');
      const data = await res.json();
      setStatus(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${getApiBase()}/admin/logs`);
      const data = await res.json();
      setLogs(data.output || '');
    } catch (err) {}
  };

  const fetchService = async () => {
    try {
      const res = await fetch(`${getApiBase()}/admin/service`);
      const data = await res.json();
      setService(data.output || '');
    } catch (err) {}
  };

  useEffect(() => {
    fetchStatus();
    fetchLogs();
    fetchService();
    const interval = setInterval(() => {
      fetchStatus();
      fetchLogs();
      fetchService();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !status) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-bg-main">
        <div className="animate-pulse flex flex-col items-center gap-16">
          <i className="ph-thin ph-spider text-64 text-primary"></i>
          <span className="text-12 font-bold uppercase tracking-widest text-fg-muted">Initializing Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main pb-64">
      {/* Floating Header */}
      <header className="sticky top-0 z-50 glass px-24 py-16 flex items-center justify-between border-b border-black/5">
        <div className="flex items-center gap-12">
          <div className="w-32 h-32 rounded-full bg-fg-main flex items-center justify-center">
            <i className="ph-fill ph-spider text-16 text-bg-surface"></i>
          </div>
          <div className="flex flex-col">
            <span className="text-14 font-bold tracking-tight">Weaver Admin</span>
            <span className="text-10 text-fg-muted uppercase tracking-wider font-medium">Command Center</span>
          </div>
        </div>

        <div className="flex items-center gap-16">
          <div className="flex flex-col items-end">
            <span className="text-10 text-fg-muted uppercase tracking-wider font-bold">Uptime</span>
            <span className="text-12 font-mono">{status?.uptime || '0s'}</span>
          </div>
          <div className="h-24 w-1 bg-black/5"></div>
          <div className={`w-8 h-8 rounded-full ${status?.ready ? 'bg-success' : 'bg-error'} shadow-[0_0_8px_rgba(0,0,0,0.1)] animate-pulse`}></div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto mt-32 px-24 space-y-32">
        {error && (
          <div className="p-16 bg-error/10 border border-error/20 rounded-12 text-error text-12 font-medium flex items-center gap-8">
            <i className="ph ph-warning-circle text-16"></i>
            Connection lost: {error}
          </div>
        )}

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-16">
          <StatCard label="Active Sessions" value={status?.sessions.length || 0} icon="ph-chats" color="oklch(60% 0.15 250)" />
          <StatCard label="Running Subagents" value={status?.subagents.length || 0} icon="ph-robot" color="oklch(60% 0.15 280)" />
          <StatCard label="Core Model" value={status?.model.split('-')[1].toUpperCase() || 'N/A'} subValue={status?.model} icon="ph-brain" color="oklch(60% 0.15 320)" />
          <StatCard label="Workspace" value="Isolated" subValue={status?.workspace} icon="ph-folder-lock" color="oklch(60% 0.15 140)" />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-32">
          {/* Active Sessions */}
          <section className="space-y-16">
            <div className="flex items-center justify-between">
              <h2 className="text-12 font-bold uppercase tracking-widest text-fg-muted flex items-center gap-8">
                <i className="ph ph-list-bullets text-16"></i>
                Active Sessions
              </h2>
              <span className="text-10 font-mono text-fg-muted bg-black/5 px-8 py-2 rounded-4">{status?.sessions.length || 0} Total</span>
            </div>
            <div className="space-y-8">
              {status?.sessions.map((s) => (
                <div key={s.key} className="p-16 bg-bg-surface border border-black/5 rounded-16 flex items-center justify-between group hover:border-primary/20 transition-all">
                  <div className="flex flex-col gap-4">
                    <span className="text-14 font-bold truncate-text max-w-[200px]">{s.key}</span>
                    <span className="text-10 text-fg-muted flex items-center gap-4">
                      <i className="ph ph-clock text-12"></i>
                      Updated {new Date(s.updated).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-12">
                    <div className="flex flex-col items-end">
                      <span className="text-12 font-mono font-bold text-primary">{s.message_count}</span>
                      <span className="text-8 uppercase tracking-tighter text-fg-muted font-bold">Msgs</span>
                    </div>
                    <button className="w-32 h-32 rounded-full bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <i className="ph ph-arrow-right text-14"></i>
                    </button>
                  </div>
                </div>
              ))}
              {status?.sessions.length === 0 && <EmptyState message="No active sessions found" />}
            </div>
          </section>

          {/* Subagent Tasks */}
          <section className="space-y-16">
            <div className="flex items-center justify-between">
              <h2 className="text-12 font-bold uppercase tracking-widest text-fg-muted flex items-center gap-8">
                <i className="ph ph-cpu text-16"></i>
                Managed Subagents
              </h2>
              <span className="text-10 font-mono text-fg-muted bg-black/5 px-8 py-2 rounded-4">{status?.subagents.length || 0} Threads</span>
            </div>
            <div className="space-y-8">
              {status?.subagents.map((t) => (
                <div key={t.id} className="p-16 bg-bg-surface border border-black/5 rounded-16 space-y-12 group hover:border-success/20 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-8">
                      <span className="badge bg-success/10 text-success">{t.status}</span>
                      <span className="text-12 font-bold tracking-tight">{t.label || t.id}</span>
                    </div>
                    <span className="text-10 font-mono text-fg-muted">{new Date(t.created).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-12 text-fg-muted italic line-clamp-2 leading-relaxed">
                    "{t.task}"
                  </p>
                </div>
              ))}
              {status?.subagents.length === 0 && <EmptyState message="No background tasks running" />}
            </div>
          </section>
        </div>

        {/* System Logs & Service Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-32">
          <section className="space-y-16">
            <h2 className="text-12 font-bold uppercase tracking-widest text-fg-muted flex items-center gap-8">
              <i className="ph ph-terminal-window text-16"></i>
              System Logs
            </h2>
            <div className="p-16 bg-black text-[#00FF00] font-mono text-[10px] rounded-16 h-[400px] overflow-auto whitespace-pre-wrap selection:bg-white selection:text-black">
              {logs || 'No logs available'}
            </div>
          </section>

          <section className="space-y-16">
            <h2 className="text-12 font-bold uppercase tracking-widest text-fg-muted flex items-center gap-8">
              <i className="ph ph-activity text-16"></i>
              Service Status
            </h2>
            <div className="p-16 bg-bg-surface border border-black/5 rounded-16 h-[400px] overflow-auto font-mono text-[10px] text-fg-main whitespace-pre">
              {service || 'Loading service status...'}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, subValue, icon, color }: any) {
  return (
    <div className="p-24 bg-bg-surface border border-black/5 rounded-24 space-y-16 shadow-sm">
      <div className="w-40 h-40 rounded-12 flex items-center justify-center shadow-inner" style={{ backgroundColor: `${color}10`, color }}>
        <i className={`ph ph-fill ${icon} text-20`}></i>
      </div>
      <div className="flex flex-col gap-4">
        <span className="text-10 font-bold uppercase tracking-widest text-fg-muted">{label}</span>
        <div className="flex items-baseline gap-8">
          <span className="text-24 font-bold tracking-tighter">{value}</span>
          {subValue && <span className="text-10 font-mono text-fg-muted truncate max-w-[100px]">{subValue}</span>}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-48 flex flex-col items-center justify-center border border-dashed border-black/10 rounded-16 gap-12 bg-black/[0.01]">
      <i className="ph-thin ph-ghost text-32 text-fg-muted/30"></i>
      <span className="text-12 font-medium text-fg-muted/50">{message}</span>
    </div>
  );
}
