import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  Activity,
  Bot,
  Building2,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  FolderGit2,
  KeyRound,
  LayoutDashboard,
  Network,
  Play,
  Plus,
  Send,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { api, consumeTokenFromHash, getToken, setToken } from "./api.js";

type View =
  | "Overview"
  | "Office"
  | "Organization"
  | "Projects"
  | "Agents"
  | "Tasks"
  | "Approvals"
  | "Activity"
  | "Settings";
type Health = { status: string; codex: { state: string }; database: string };
type Project = { id: string; name: string; path: string; createdAt: string };
type Task = {
  id: string;
  title: string;
  description?: string | null;
  priority: number;
  status: string;
  acceptanceCriteria?: string[];
};
type Thread = {
  id: string;
  preview?: string;
  name?: string;
  cwd?: string;
  model?: string;
  status?: { type?: string };
};
type Approval = {
  id: string;
  method: string;
  payload: unknown;
  createdAt: string;
};
type EventItem = {
  id: string;
  type: string;
  occurredAt: string;
  payload?: unknown;
};

const navigation: Array<{ name: View; icon: typeof Activity }> = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Office", icon: Building2 },
  { name: "Organization", icon: Network },
  { name: "Projects", icon: FolderGit2 },
  { name: "Agents", icon: Users },
  { name: "Tasks", icon: ClipboardList },
  { name: "Approvals", icon: ShieldCheck },
  { name: "Activity", icon: Activity },
  { name: "Settings", icon: Settings },
];

export function App() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>("Overview");
  const [initialToken] = useState(() => consumeTokenFromHash() || getToken());
  const [tokenInput, setTokenInput] = useState(initialToken);
  const [activeToken, setActiveToken] = useState(initialToken);
  const [notice, setNotice] = useState<{
    tone: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);

  const health = useQuery({
    queryKey: ["health"],
    queryFn: () => api<Health>("/health"),
    refetchInterval: 5000,
  });
  const projects = useQuery({
    queryKey: ["projects"],
    queryFn: () => api<Project[]>("/api/projects"),
    enabled: Boolean(activeToken),
    retry: false,
  });
  const threads = useQuery({
    queryKey: ["threads"],
    queryFn: () => api<{ data: Thread[] }>("/api/threads"),
    enabled: Boolean(activeToken),
    retry: false,
  });
  const approvals = useQuery({
    queryKey: ["approvals"],
    queryFn: () => api<Approval[]>("/api/approvals"),
    enabled: Boolean(activeToken),
    retry: false,
  });
  const connect = useMutation({
    mutationFn: () =>
      api<{ state: string }>("/api/codex/connect", { method: "POST" }),
    onSuccess: async (result) => {
      setNotice({ tone: "success", text: `Codex is ${result.state}.` });
      await queryClient.invalidateQueries();
    },
    onError: (error) => setNotice({ tone: "error", text: message(error) }),
  });

  useEffect(() => {
    if (!activeToken || typeof WebSocket === "undefined") return;
    const protocol = location.protocol === "https:" ? "wss" : "ws";
    const encoded = btoa(activeToken)
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replaceAll("=", "");
    const socket = new WebSocket(
      `${protocol}://${location.host}/events`,
      `office.${encoded}`,
    );
    socket.onopen = () =>
      setNotice((current) =>
        current?.tone === "error"
          ? current
          : { tone: "info", text: "Realtime event stream connected." },
      );
    socket.onmessage = (incoming) => {
      const event = JSON.parse(incoming.data) as EventItem;
      setEvents((current) => [event, ...current].slice(0, 100));
      void queryClient.invalidateQueries({ queryKey: ["approvals"] });
    };
    socket.onerror = () =>
      setNotice({
        tone: "error",
        text: "Realtime connection failed. Check the token and server.",
      });
    return () => socket.close();
  }, [activeToken, queryClient]);

  const saveToken = () => {
    const next = tokenInput.trim();
    if (!next) {
      setNotice({
        tone: "error",
        text: "Enter OFFICE_AUTH_TOKEN before saving.",
      });
      return;
    }
    setToken(next);
    setActiveToken(next);
    setNotice({ tone: "success", text: "Token saved in this browser." });
    void queryClient.invalidateQueries();
  };

  const content = useMemo(() => {
    const common = {
      projects: projects.data ?? [],
      threads: threads.data?.data ?? [],
      approvals: approvals.data ?? [],
      setView,
      setNotice,
    };
    switch (view) {
      case "Overview":
        return (
          <Overview
            health={health.data}
            events={events}
            onConnect={() => connect.mutate()}
            connecting={connect.isPending}
            {...common}
          />
        );
      case "Projects":
        return <ProjectsScreen query={projects} setNotice={setNotice} />;
      case "Tasks":
        return <TasksScreen projects={common.projects} setNotice={setNotice} />;
      case "Agents":
        return <AgentsScreen threads={common.threads} setNotice={setNotice} />;
      case "Approvals":
        return (
          <ApprovalsScreen approvals={common.approvals} setNotice={setNotice} />
        );
      case "Activity":
        return <ActivityScreen events={events} />;
      case "Settings":
        return (
          <SettingsScreen
            token={tokenInput}
            setToken={setTokenInput}
            save={saveToken}
          />
        );
      case "Office":
        return (
          <InfoScreen
            title="Virtual Office"
            text="Agent activity appears here from real Codex events. Connect Codex and start a turn from Agents to populate the office."
            items={[
              `Codex: ${health.data?.codex.state ?? "unknown"}`,
              `${common.threads.length} threads`,
              `${events.length} realtime events`,
            ]}
          />
        );
      case "Organization":
        return (
          <InfoScreen
            title="Organization"
            text="Departments and agent relationships will be rendered from persisted agent records. Current live threads are shown below."
            items={common.threads
              .slice(0, 8)
              .map((thread) => thread.name ?? thread.preview ?? thread.id)}
          />
        );
    }
  }, [
    view,
    projects.data,
    threads.data,
    approvals.data,
    health.data,
    events,
    connect.isPending,
    tokenInput,
  ]);

  return (
    <main className="shell">
      <aside>
        <div className="brand">
          <div className="logo">
            <Bot />
          </div>
          <div>
            <strong>Codex Office</strong>
            <span>Local agent control</span>
          </div>
        </div>
        <nav>
          {navigation.map(({ name, icon: Icon }) => (
            <button
              type="button"
              className={view === name ? "active" : ""}
              key={name}
              onClick={() => setView(name)}
            >
              <Icon />
              {name}
              {name === "Approvals" && (approvals.data?.length ?? 0) > 0 && (
                <b>{approvals.data?.length}</b>
              )}
            </button>
          ))}
        </nav>
      </aside>
      <section className="content">
        <header>
          <div>
            <p className="eyebrow">WORKSPACE / {view.toUpperCase()}</p>
            <h1>{view}</h1>
          </div>
          <button
            className="primary"
            onClick={() => connect.mutate()}
            disabled={connect.isPending || !activeToken}
          >
            <Play />
            {connect.isPending ? "Connecting…" : "Connect Codex"}
          </button>
        </header>
        {!activeToken && (
          <div className="setup-callout">
            <KeyRound />
            <div>
              <strong>Local token required</strong>
              <p>
                Open Settings, paste OFFICE_AUTH_TOKEN from `.env`, then connect
                Codex.
              </p>
            </div>
            <button onClick={() => setView("Settings")}>Open Settings</button>
          </div>
        )}
        {notice && (
          <div role="status" className={`notice ${notice.tone}`}>
            <span>{notice.text}</span>
            <button
              aria-label="Dismiss message"
              onClick={() => setNotice(null)}
            >
              ×
            </button>
          </div>
        )}
        {content}
      </section>
    </main>
  );
}

function Overview({
  health,
  projects,
  threads,
  approvals,
  events,
  setView,
  onConnect,
  connecting,
}: {
  health: Health | undefined;
  projects: Project[];
  threads: Thread[];
  approvals: Approval[];
  events: EventItem[];
  setView(view: View): void;
  onConnect(): void;
  connecting: boolean;
}) {
  return (
    <>
      <div className="stats">
        <Stat
          label="System"
          value={health?.status ?? "checking"}
          icon={<CheckCircle2 />}
        />
        <Stat
          label="Codex"
          value={health?.codex.state ?? "unknown"}
          icon={<Bot />}
        />
        <Stat
          label="Projects"
          value={String(projects.length)}
          icon={<FolderGit2 />}
        />
        <Stat
          label="Approvals"
          value={String(approvals.length)}
          icon={<CircleAlert />}
        />
      </div>
      <div className="action-grid">
        <Action
          title="Add a project"
          text="Register an existing local directory."
          onClick={() => setView("Projects")}
          icon={<Plus />}
        />
        <Action
          title="Run an agent"
          text="Start a Codex thread and send work."
          onClick={() => setView("Agents")}
          icon={<Bot />}
        />
        <Action
          title="Manage tasks"
          text="Create work and enforce transitions."
          onClick={() => setView("Tasks")}
          icon={<ClipboardList />}
        />
        <Action
          title="Connect engine"
          text={
            connecting ? "Connecting…" : `${threads.length} threads available`
          }
          onClick={onConnect}
          icon={<Play />}
        />
      </div>
      <Panel title="Recent activity" meta={`${events.length} events`}>
        {events.length ? (
          events
            .slice(0, 8)
            .map((event) => <EventRow event={event} key={event.id} />)
        ) : (
          <Empty text="Start a Codex turn to receive realtime events." />
        )}
      </Panel>
    </>
  );
}

function ProjectsScreen({
  query,
  setNotice,
}: {
  query: UseQueryResult<Project[], Error>;
  setNotice(value: { tone: "success" | "error" | "info"; text: string }): void;
}) {
  const client = useQueryClient();
  const [name, setName] = useState("");
  const [path, setPath] = useState("");
  const create = useMutation({
    mutationFn: () =>
      api<Project>("/api/projects", {
        method: "POST",
        body: JSON.stringify({ name, path }),
      }),
    onSuccess: async () => {
      setName("");
      setPath("");
      setNotice({ tone: "success", text: "Project added." });
      await client.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error) => setNotice({ tone: "error", text: message(error) }),
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate();
  };
  return (
    <div className="screen-grid">
      <Panel title="Add local project" meta="Absolute path required">
        <form onSubmit={submit} className="form">
          <label>
            Project name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
          <label>
            Absolute directory
            <input
              value={path}
              onChange={(event) => setPath(event.target.value)}
              placeholder="/home/me/project"
              required
            />
          </label>
          <button className="primary" disabled={create.isPending}>
            <Plus />
            {create.isPending ? "Adding…" : "Add project"}
          </button>
        </form>
      </Panel>
      <Panel title="Projects" meta={`${query.data?.length ?? 0} total`}>
        {query.isLoading ? (
          <Loading />
        ) : query.isError ? (
          <ErrorText error={query.error} />
        ) : query.data?.length ? (
          query.data.map((project) => (
            <div className="row" key={project.id}>
              <FolderGit2 />
              <div>
                <strong>{project.name}</strong>
                <code>{project.path}</code>
              </div>
            </div>
          ))
        ) : (
          <Empty text="No projects yet." />
        )}
      </Panel>
    </div>
  );
}

function TasksScreen({
  projects,
  setNotice,
}: {
  projects: Project[];
  setNotice(value: { tone: "success" | "error" | "info"; text: string }): void;
}) {
  const client = useQueryClient();
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [criterion, setCriterion] = useState("");
  useEffect(() => {
    if (!projectId && projects[0]) setProjectId(projects[0].id);
  }, [projects, projectId]);
  const tasks = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => api<Task[]>(`/api/projects/${projectId}/tasks`),
    enabled: Boolean(projectId),
  });
  const create = useMutation({
    mutationFn: () =>
      api<Task>(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        body: JSON.stringify({
          title,
          acceptanceCriteria: criterion ? [criterion] : [],
        }),
      }),
    onSuccess: async () => {
      setTitle("");
      setCriterion("");
      setNotice({ tone: "success", text: "Task created." });
      await client.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
    onError: (error) => setNotice({ tone: "error", text: message(error) }),
  });
  const transition = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api<Task>(`/api/tasks/${id}/transition`, {
        method: "POST",
        body: JSON.stringify({ status }),
      }),
    onSuccess: async (task) => {
      setNotice({ tone: "success", text: `Task moved to ${task.status}.` });
      await client.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
    onError: (error) => setNotice({ tone: "error", text: message(error) }),
  });
  return (
    <>
      <div className="toolbar">
        <label>
          Project
          <select
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
          >
            <option value="">Select a project</option>
            {projects.map((project) => (
              <option value={project.id} key={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {!projects.length ? (
        <Empty text="Add a project before creating tasks." />
      ) : (
        <div className="screen-grid">
          <Panel title="Create task" meta="Acceptance-driven">
            <form
              className="form"
              onSubmit={(event) => {
                event.preventDefault();
                create.mutate();
              }}
            >
              <label>
                Title
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                />
              </label>
              <label>
                Acceptance criterion
                <textarea
                  value={criterion}
                  onChange={(event) => setCriterion(event.target.value)}
                />
              </label>
              <button
                className="primary"
                disabled={!projectId || create.isPending}
              >
                <Plus />
                Create task
              </button>
            </form>
          </Panel>
          <Panel title="Tasks" meta={`${tasks.data?.length ?? 0} total`}>
            {tasks.isLoading ? (
              <Loading />
            ) : tasks.data?.length ? (
              tasks.data.map((task) => (
                <div className="task-card" key={task.id}>
                  <div>
                    <strong>{task.title}</strong>
                    <span className="pill">{task.status}</span>
                  </div>
                  {nextStatus(task.status) && (
                    <button
                      onClick={() =>
                        transition.mutate({
                          id: task.id,
                          status: nextStatus(task.status)!,
                        })
                      }
                      disabled={transition.isPending}
                    >
                      Move to {nextStatus(task.status)}
                    </button>
                  )}
                </div>
              ))
            ) : (
              <Empty text="No tasks for this project." />
            )}
          </Panel>
        </div>
      )}
    </>
  );
}

function AgentsScreen({
  threads,
  setNotice,
}: {
  threads: Thread[];
  setNotice(value: { tone: "success" | "error" | "info"; text: string }): void;
}) {
  const client = useQueryClient();
  const [cwd, setCwd] = useState("");
  const [selected, setSelected] = useState("");
  const [prompt, setPrompt] = useState("");
  const start = useMutation({
    mutationFn: () =>
      api<{ thread: Thread }>("/api/threads", {
        method: "POST",
        body: JSON.stringify({ cwd }),
      }),
    onSuccess: async (result) => {
      setSelected(result.thread.id);
      setNotice({ tone: "success", text: "Codex thread started." });
      await client.invalidateQueries({ queryKey: ["threads"] });
    },
    onError: (error) => setNotice({ tone: "error", text: message(error) }),
  });
  const turn = useMutation({
    mutationFn: () =>
      api(`/api/threads/${selected}/turns`, {
        method: "POST",
        body: JSON.stringify({ prompt }),
      }),
    onSuccess: () => {
      setPrompt("");
      setNotice({
        tone: "success",
        text: "Prompt sent. Watch Activity for progress.",
      });
    },
    onError: (error) => setNotice({ tone: "error", text: message(error) }),
  });
  const resume = useMutation({
    mutationFn: () =>
      api(`/api/threads/${selected}/resume`, { method: "POST" }),
    onSuccess: () =>
      setNotice({ tone: "success", text: "Thread resumed and ready." }),
    onError: (error) => setNotice({ tone: "error", text: message(error) }),
  });
  return (
    <div className="screen-grid">
      <Panel title="Start agent thread" meta="Real Codex session">
        <form
          className="form"
          onSubmit={(event) => {
            event.preventDefault();
            start.mutate();
          }}
        >
          <label>
            Working directory
            <input
              value={cwd}
              onChange={(event) => setCwd(event.target.value)}
              placeholder="/absolute/project/path"
              required
            />
          </label>
          <button className="primary" disabled={start.isPending}>
            <Play />
            Start thread
          </button>
        </form>
        <hr />
        <form
          className="form"
          onSubmit={(event) => {
            event.preventDefault();
            turn.mutate();
          }}
        >
          <label>
            Thread
            <select
              value={selected}
              onChange={(event) => setSelected(event.target.value)}
            >
              <option value="">Select a thread</option>
              {threads.map((thread) => (
                <option value={thread.id} key={thread.id}>
                  {thread.name ?? thread.preview?.slice(0, 50) ?? thread.id}
                </option>
              ))}
            </select>
          </label>
          <label>
            Instruction
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              required
            />
          </label>
          <button
            type="button"
            onClick={() => resume.mutate()}
            disabled={!selected || resume.isPending}
          >
            {resume.isPending ? "Resuming…" : "Resume selected thread"}
          </button>
          <button className="primary" disabled={!selected || turn.isPending}>
            <Send />
            Send prompt
          </button>
        </form>
      </Panel>
      <Panel title="Codex threads" meta={`${threads.length} available`}>
        {threads.length ? (
          threads.slice(0, 20).map((thread) => (
            <button
              className={`thread-row ${selected === thread.id ? "selected" : ""}`}
              onClick={() => setSelected(thread.id)}
              key={thread.id}
            >
              <Bot />
              <span>
                <strong>
                  {thread.name ??
                    thread.preview?.slice(0, 80) ??
                    "Codex thread"}
                </strong>
                <code>{thread.cwd ?? thread.id}</code>
              </span>
            </button>
          ))
        ) : (
          <Empty text="Connect Codex to load threads." />
        )}
      </Panel>
    </div>
  );
}

function ApprovalsScreen({
  approvals,
  setNotice,
}: {
  approvals: Approval[];
  setNotice(value: { tone: "success" | "error" | "info"; text: string }): void;
}) {
  const client = useQueryClient();
  const resolve = useMutation({
    mutationFn: ({
      approval,
      decision,
    }: {
      approval: Approval;
      decision: "accept" | "decline";
    }) =>
      api(`/api/approvals/${approval.id}/resolve`, {
        method: "POST",
        body: JSON.stringify({ decision: { decision } }),
      }),
    onSuccess: async () => {
      setNotice({ tone: "success", text: "Approval resolved." });
      await client.invalidateQueries({ queryKey: ["approvals"] });
    },
    onError: (error) => setNotice({ tone: "error", text: message(error) }),
  });
  return (
    <Panel title="Pending approvals" meta={`${approvals.length} pending`}>
      {approvals.length ? (
        approvals.map((approval) => {
          const supported = [
            "item/commandExecution/requestApproval",
            "item/fileChange/requestApproval",
            "applyPatchApproval",
            "execCommandApproval",
          ].includes(approval.method);
          return (
            <div className="approval-card" key={approval.id}>
              <div>
                <strong>{approval.method}</strong>
                <time>{new Date(approval.createdAt).toLocaleString()}</time>
                <pre>{JSON.stringify(approval.payload, null, 2)}</pre>
              </div>
              {supported ? (
                <div className="approval-actions">
                  <button
                    className="danger"
                    onClick={() =>
                      resolve.mutate({ approval, decision: "decline" })
                    }
                  >
                    Reject
                  </button>
                  <button
                    className="primary"
                    onClick={() =>
                      resolve.mutate({ approval, decision: "accept" })
                    }
                  >
                    Approve once
                  </button>
                </div>
              ) : (
                <p className="hint">
                  This approval type requires a specialized response and cannot
                  be resolved by the generic UI.
                </p>
              )}
            </div>
          );
        })
      ) : (
        <Empty text="No pending approvals." />
      )}
    </Panel>
  );
}

function ActivityScreen({ events }: { events: EventItem[] }) {
  return (
    <Panel title="Realtime activity" meta={`${events.length} buffered events`}>
      {events.length ? (
        events.map((event) => <EventRow event={event} key={event.id} />)
      ) : (
        <Empty text="No realtime events received." />
      )}
    </Panel>
  );
}
function SettingsScreen({
  token,
  setToken: update,
  save,
}: {
  token: string;
  setToken(value: string): void;
  save(): void;
}) {
  return (
    <Panel title="Local settings" meta="Stored only in this browser">
      <div className="form">
        <label>
          OFFICE_AUTH_TOKEN
          <input
            type="password"
            value={token}
            onChange={(event) => update(event.target.value)}
            placeholder="Token from .env"
          />
        </label>
        <button className="primary" onClick={save}>
          <KeyRound />
          Save locally
        </button>
        <p className="hint">
          The server remains bound to localhost. This UI token is not a Codex
          credential and is never written to the database.
        </p>
      </div>
    </Panel>
  );
}
function InfoScreen({
  title,
  text,
  items,
}: {
  title: string;
  text: string;
  items: string[];
}) {
  return (
    <Panel title={title} meta="Live data">
      <p className="lead">{text}</p>
      {items.length ? (
        items.map((item, index) => (
          <div className="row" key={`${item}-${index}`}>
            <Bot />
            <div>
              <strong>{item}</strong>
            </div>
          </div>
        ))
      ) : (
        <Empty text="No data yet." />
      )}
    </Panel>
  );
}

function Panel({
  title,
  meta,
  children,
}: {
  title: string;
  meta: string;
  children: ReactNode;
}) {
  return (
    <article>
      <div className="article-title">
        <h2>{title}</h2>
        <span>{meta}</span>
      </div>
      <div className="panel-body">{children}</div>
    </article>
  );
}
function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="stat">
      <div>{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
function Action({
  title,
  text,
  icon,
  onClick,
}: {
  title: string;
  text: string;
  icon: ReactNode;
  onClick(): void;
}) {
  return (
    <button className="action" onClick={onClick}>
      <div>{icon}</div>
      <span>
        <strong>{title}</strong>
        <small>{text}</small>
      </span>
    </button>
  );
}
function EventRow({ event }: { event: EventItem }) {
  return (
    <div className="row">
      <Activity />
      <div>
        <strong>{event.type}</strong>
        <time>{new Date(event.occurredAt).toLocaleTimeString()}</time>
      </div>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return <div className="empty">{text}</div>;
}
function Loading() {
  return <div className="empty">Loading…</div>;
}
function ErrorText({ error }: { error: unknown }) {
  return <div className="empty error-text">{message(error)}</div>;
}
function message(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error";
}
function nextStatus(status: string): string | null {
  return (
    (
      {
        pending: "analyzing",
        analyzing: "planning",
        planning: "in_progress",
        in_progress: "ready_for_test",
        ready_for_test: "testing",
        testing: "ready_for_review",
        ready_for_review: "reviewing",
      } as Record<string, string>
    )[status] ?? null
  );
}
