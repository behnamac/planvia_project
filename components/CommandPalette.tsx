import {useEffect, useMemo, useRef, useState} from "react";
import {useNavigate} from "react-router";
import {Search} from "lucide-react";
import {formatRelativeTime} from "../lib/utils";

interface CommandPaletteProps {
    projects: DesignItem[];
    onClose: () => void;
}

type PaletteRow = {
    key: string;
    label: string;
    group: "RENDERS" | "ACTIONS";
    trail?: string;
    kbd?: string;
    run: () => void;
};

const MAX_PROJECT_ROWS = 6;

const CommandPalette = ({ projects, onClose }: CommandPaletteProps) => {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const rows = useMemo<PaletteRow[]>(() => {
        const needle = query.trim().toLowerCase();

        const projectRows: PaletteRow[] = projects
            .filter(({ name, id }) =>
                !needle || (name ?? `Residence ${id}`).toLowerCase().includes(needle),
            )
            .slice(0, MAX_PROJECT_ROWS)
            .map((project) => ({
                key: `project-${project.id}`,
                label: project.name ?? `Residence ${project.id}`,
                group: "RENDERS",
                trail: formatRelativeTime(project.timestamp),
                run: () => navigate(`/visualizer/${project.id}`),
            }));

        const actionRows: PaletteRow[] = [
            {
                key: "action-new",
                label: "New render",
                group: "ACTIONS",
                kbd: "N",
                run: () => navigate("/new"),
            },
            {
                key: "action-renders",
                label: "Browse all renders",
                group: "ACTIONS",
                run: () => navigate("/renders"),
            },
        ].filter(({ label }) => !needle || label.toLowerCase().includes(needle)) as PaletteRow[];

        return [...projectRows, ...actionRows];
    }, [navigate, projects, query]);

    useEffect(() => {
        setActiveIndex(0);
    }, [query]);

    const select = (row: PaletteRow | undefined) => {
        if (!row) return;
        row.run();
        onClose();
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === "Escape") {
            event.preventDefault();
            onClose();
            return;
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((index) => (rows.length ? (index + 1) % rows.length : 0));
            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) => (rows.length ? (index - 1 + rows.length) % rows.length : 0));
            return;
        }

        if (event.key === "Enter") {
            event.preventDefault();
            select(rows[activeIndex]);
        }
    };

    let lastGroup: PaletteRow["group"] | null = null;

    return (
        <div
            className="cmdk"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div className="panel" role="dialog" aria-modal="true" aria-label="Search" onKeyDown={handleKeyDown}>
                <div className="field">
                    <Search size={15} className="shrink-0 text-dim" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search renders, projects, commands"
                        aria-label="Search renders, projects, commands"
                    />
                </div>

                <div className="results">
                    {rows.length === 0 ? (
                        <div className="empty">No matches for &ldquo;{query}&rdquo;</div>
                    ) : (
                        rows.map((row, index) => {
                            const showGroup = row.group !== lastGroup;
                            lastGroup = row.group;

                            return (
                                <div key={row.key}>
                                    {showGroup && <span className="group-label">{row.group}</span>}

                                    <button
                                        type="button"
                                        className={`row ${index === activeIndex ? "is-active" : ""}`}
                                        onMouseEnter={() => setActiveIndex(index)}
                                        onClick={() => select(row)}
                                    >
                                        {row.label}
                                        {row.trail && <span className="trail">{row.trail}</span>}
                                        {row.kbd && <span className="kbd">{row.kbd}</span>}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
