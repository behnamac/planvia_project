import type { Route } from "./+types/renders";
import {useMemo, useState} from "react";
import {useNavigate, useOutletContext} from "react-router";
import {Upload as UploadIcon} from "lucide-react";
import {formatRelativeTime} from "../../lib/utils";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Renders — Planvia" },
    { name: "description", content: "Every plan you have rendered with Planvia." },
  ];
}

type FilterId = "all" | "recent" | "rendered" | "plan";

const RECENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const FILTERS: { id: FilterId; label: string; group: "library" | "status"; match: (item: DesignItem) => boolean }[] = [
    { id: "all", label: "All renders", group: "library", match: () => true },
    {
        id: "recent",
        label: "Recent",
        group: "library",
        match: ({ timestamp }) => Date.now() - timestamp < RECENT_WINDOW_MS,
    },
    { id: "rendered", label: "Rendered", group: "status", match: ({ renderedImage }) => !!renderedImage },
    { id: "plan", label: "Plan only", group: "status", match: ({ renderedImage }) => !renderedImage },
];

export default function Renders() {
    const navigate = useNavigate();
    const { projects, isProjectsLoading, isSignedIn } = useOutletContext<AppContext>();
    const [filterId, setFilterId] = useState<FilterId>("all");
    const [layout, setLayout] = useState<"grid" | "list">("grid");

    const activeFilter = FILTERS.find(({ id }) => id === filterId) ?? FILTERS[0];
    const visible = useMemo(() => projects.filter(activeFilter.match), [activeFilter, projects]);

    const renderFilterButton = ({ id, label }: (typeof FILTERS)[number]) => (
        <button
            key={id}
            type="button"
            className={id === filterId ? "is-active" : ""}
            onClick={() => setFilterId(id)}
        >
            {label}
        </button>
    );

    return (
        <div className="gallery">
            <aside className="sidebar">
                {FILTERS.filter(({ group }) => group === "library").map(renderFilterButton)}

                <span className="group-label">STATUS</span>
                {FILTERS.filter(({ group }) => group === "status").map(renderFilterButton)}
            </aside>

            <div className="main">
                <div className="main-head">
                    <h1>{activeFilter.label}</h1>
                    <span className="count">{visible.length}</span>

                    <div className="view-toggle">
                        <button
                            type="button"
                            className={layout === "grid" ? "is-active" : ""}
                            onClick={() => setLayout("grid")}
                        >
                            Grid
                        </button>
                        <button
                            type="button"
                            className={layout === "list" ? "is-active" : ""}
                            onClick={() => setLayout("list")}
                        >
                            List
                        </button>
                    </div>
                </div>

                <div className="main-body">
                    {!isSignedIn ? (
                        <div className="empty">
                            <p>Sign in with Puter to see your renders.</p>
                            <p className="hint">Renders are stored on your own Puter account.</p>
                        </div>
                    ) : isProjectsLoading ? (
                        <div className="empty">
                            <p>Loading renders&hellip;</p>
                        </div>
                    ) : layout === "grid" ? (
                        <div className="grid">
                            {visible.map((project) => (
                                <button
                                    key={project.id}
                                    type="button"
                                    className="card"
                                    onClick={() => navigate(`/visualizer/${project.id}`)}
                                >
                                    <div className="thumb">
                                        {project.renderedImage || project.sourceImage ? (
                                            <img
                                                src={project.renderedImage || project.sourceImage}
                                                alt={project.name ?? "Project"}
                                            />
                                        ) : (
                                            <span className="thumb-empty">NO IMAGE</span>
                                        )}
                                        <span className="status">
                                            {project.renderedImage ? "RENDER" : "PLAN ONLY"}
                                        </span>
                                    </div>

                                    <div className="body">
                                        <h3>{project.name ?? `Residence ${project.id}`}</h3>
                                        <div className="meta">{formatRelativeTime(project.timestamp)}</div>
                                    </div>
                                </button>
                            ))}

                            <button type="button" className="add-tile" onClick={() => navigate("/new")}>
                                <UploadIcon size={18} strokeWidth={1.8} />
                                <span>Drop a plan</span>
                            </button>

                            {visible.length === 0 && (
                                <div className="empty">
                                    <p>Nothing here yet.</p>
                                    <p className="hint">Drop a floor plan to make your first render.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="rows">
                            {visible.map((project) => (
                                <button
                                    key={project.id}
                                    type="button"
                                    className="row"
                                    onClick={() => navigate(`/visualizer/${project.id}`)}
                                >
                                    <span className="thumb">
                                        {(project.renderedImage || project.sourceImage) && (
                                            <img
                                                src={project.renderedImage || project.sourceImage}
                                                alt={project.name ?? "Project"}
                                            />
                                        )}
                                    </span>
                                    <h3>{project.name ?? `Residence ${project.id}`}</h3>
                                    <span className="meta">{formatRelativeTime(project.timestamp)}</span>
                                </button>
                            ))}

                            {visible.length === 0 && (
                                <div className="empty">
                                    <p>Nothing here yet.</p>
                                    <p className="hint">Drop a floor plan to make your first render.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
