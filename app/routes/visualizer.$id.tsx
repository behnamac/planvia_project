import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useNavigate, useOutletContext, useParams} from "react-router";
import {ArrowLeft, Minus, Plus, RefreshCcw} from "lucide-react";
import Button from "../../components/ui/Button";
import CompareStage from "../../components/CompareStage";
import {generate3DView} from "../../lib/ai.action";
import {createProject, getProjectById} from "../../lib/puter.action";
import {IMAGE_RENDER_DIMENSION, SHARE_STATUS_RESET_DELAY_MS} from "../../lib/constants";
import {
    fetchBlobFromUrl,
    getAdjustmentFilter,
    isHostedUrl,
    isNeutralAdjustment,
    renderAdjustedPngBlob,
} from "../../lib/utils";

const MODES: CompareMode[] = ["compare", "render", "plan"];
const ZOOM_STEP = 10;
const ZOOM_MIN = 10;
const ZOOM_MAX = 400;
const NEUTRAL_ADJUSTMENTS: RenderAdjustments = { exposure: 0, warmth: 5200 };

const formatExposure = (value: number) => `${value > 0 ? "+" : ""}${value.toFixed(1)}`;

const VisualizerId = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { userId, userName, isSignedIn, upsertProject } = useOutletContext<AppContext>();

    const hasInitialGenerated = useRef(false);
    const versionCountRef = useRef(0);

    const [project, setProject] = useState<DesignItem | null>(null);
    const [isProjectLoading, setIsProjectLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    const [versions, setVersions] = useState<RenderVersion[]>([]);
    const [activeVersionId, setActiveVersionId] = useState<string | null>(null);

    const [mode, setMode] = useState<CompareMode>("compare");
    const [position, setPosition] = useState(50);
    const [zoom, setZoom] = useState(100);
    const [adjustments, setAdjustments] = useState<RenderAdjustments>(NEUTRAL_ADJUSTMENTS);
    const [furnish, setFurnish] = useState(true);
    const [shareStatus, setShareStatus] = useState<ShareStatus>("idle");
    const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);

    const activeVersion = versions.find((version) => version.id === activeVersionId) ?? null;
    const currentImage = activeVersion?.image ?? null;
    const renderFilter = getAdjustmentFilter(adjustments);

    const handleBack = () => navigate("/renders");

    const runGeneration = useCallback(
        async (item: DesignItem, withFurnish: boolean) => {
            if (!item.sourceImage) return;

            const startedAt = Date.now();

            try {
                setIsProcessing(true);

                const result = await generate3DView({
                    sourceImage: item.sourceImage,
                    furnish: withFurnish,
                });

                if (!result.renderedImage) return;

                const saved = await createProject({
                    item: {
                        ...item,
                        renderedImage: result.renderedImage,
                        renderedPath: result.renderedPath,
                        timestamp: Date.now(),
                        furnish: withFurnish,
                        ownerId: item.ownerId ?? userId ?? null,
                        isPublic: item.isPublic ?? false,
                    },
                    visibility: "private",
                });

                const image = saved?.renderedImage || result.renderedImage;

                if (saved) {
                    setProject(saved);
                    upsertProject(saved);
                }

                versionCountRef.current += 1;

                const next: RenderVersion = {
                    id: `v${versionCountRef.current}`,
                    image,
                    createdAt: Date.now(),
                    durationMs: Date.now() - startedAt,
                };

                setVersions((prev) => [...prev, next]);
                setActiveVersionId(next.id);
            } catch (error) {
                console.error("Generation failed: ", error);
            } finally {
                setIsProcessing(false);
            }
        },
        [upsertProject, userId],
    );

    useEffect(() => {
        let isMounted = true;

        const loadProject = async () => {
            if (!id) {
                setIsProjectLoading(false);
                return;
            }

            setIsProjectLoading(true);

            const fetchedProject = await getProjectById({ id });

            if (!isMounted) return;

            setProject(fetchedProject);
            setFurnish(fetchedProject?.furnish ?? true);

            const initialVersions: RenderVersion[] = fetchedProject?.renderedImage
                ? [
                      {
                          id: "v1",
                          image: fetchedProject.renderedImage,
                          createdAt: fetchedProject.timestamp,
                      },
                  ]
                : [];

            versionCountRef.current = initialVersions.length;
            setVersions(initialVersions);
            setActiveVersionId(initialVersions[0]?.id ?? null);
            setIsProjectLoading(false);
            hasInitialGenerated.current = false;
        };

        loadProject();

        return () => {
            isMounted = false;
        };
    }, [id]);

    useEffect(() => {
        if (isProjectLoading || hasInitialGenerated.current || !project?.sourceImage) return;

        hasInitialGenerated.current = true;

        if (project.renderedImage) return;

        void runGeneration(project, project.furnish ?? true);
    }, [isProjectLoading, project, runGeneration]);

    // Report the render's true pixel size in the info rail.
    useEffect(() => {
        if (!currentImage) {
            setNaturalSize(null);
            return;
        }

        let isMounted = true;
        const image = new Image();

        image.onload = () => {
            if (isMounted) {
                setNaturalSize({ width: image.naturalWidth, height: image.naturalHeight });
            }
        };
        image.src = currentImage;

        return () => {
            isMounted = false;
        };
    }, [currentImage]);

    const downloadBlob = (blob: Blob) => {
        const href = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = href;
        link.download = `planvia-${id || "design"}-${activeVersion?.id ?? "v1"}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(href);
    };

    const handleExport = async () => {
        if (!currentImage) return;

        const blob = isNeutralAdjustment(adjustments)
            ? (await fetchBlobFromUrl(currentImage))?.blob
            : await renderAdjustedPngBlob(currentImage, adjustments);

        if (blob) {
            downloadBlob(blob);
            return;
        }

        // Last resort: let the browser handle the URL directly.
        window.open(currentImage, "_blank", "noopener");
    };

    const handleShare = async () => {
        const link = currentImage && isHostedUrl(currentImage) ? currentImage : window.location.href;

        try {
            setShareStatus("saving");
            await navigator.clipboard.writeText(link);
            setShareStatus("done");
            setTimeout(() => setShareStatus("idle"), SHARE_STATUS_RESET_DELAY_MS);
        } catch (e) {
            console.error(`Could not copy share link: ${e}`);
            setShareStatus("idle");
        }
    };

    const info = useMemo(
        () => [
            {
                key: "size",
                value: naturalSize
                    ? `${naturalSize.width} × ${naturalSize.height}`
                    : `${IMAGE_RENDER_DIMENSION} × ${IMAGE_RENDER_DIMENSION}`,
            },
            {
                key: "time",
                value: activeVersion?.durationMs
                    ? `${(activeVersion.durationMs / 1000).toFixed(1)}s`
                    : "—",
            },
            { key: "owner", value: userName ?? "—" },
        ],
        [activeVersion, naturalSize, userName],
    );

    if (isProjectLoading) {
        return (
            <div className="notice">
                <p>Loading project&hellip;</p>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="notice">
                <h2>Project not found</h2>
                <p>
                    {isSignedIn
                        ? "This render is not in your workspace."
                        : "Sign in with Puter to open your renders."}
                </p>
                <Button variant="secondary" onClick={handleBack}>
                    Browse renders
                </Button>
            </div>
        );
    }

    return (
        <div className="room">
            <div className="room-bar">
                <button type="button" className="back" onClick={handleBack} aria-label="Back to renders">
                    <ArrowLeft size={16} />
                </button>

                <span className="title">{project.name ?? `Residence ${id}`}</span>
                <span className="chip chip--mono">{activeVersion?.id ?? "no render"}</span>

                <div className="actions">
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => runGeneration(project, furnish)}
                        disabled={isProcessing || !project.sourceImage}
                    >
                        Re-render
                    </Button>
                    <Button size="sm" variant="secondary" onClick={handleExport} disabled={!currentImage}>
                        Export
                    </Button>
                    <Button size="sm" onClick={handleShare} disabled={!currentImage}>
                        {shareStatus === "done" ? "Copied" : "Share"}
                    </Button>
                </div>
            </div>

            <div className="room-body">
                <div className="stage-wrap">
                    <CompareStage
                        className="h-full"
                        planImage={project.sourceImage}
                        renderImage={currentImage}
                        mode={mode}
                        position={position}
                        onPositionChange={setPosition}
                        zoom={zoom}
                        renderFilter={renderFilter}
                        beforeLabel="BEFORE — SOURCE PLAN"
                        afterLabel={`AFTER — ${activeVersion?.id ?? "PENDING"}`}
                        labelOffset="64px"
                    >
                        <div className="glass-bar absolute top-4 left-4">
                            {MODES.map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    className={`seg ${mode === value ? "is-active" : ""}`}
                                    onClick={() => setMode(value)}
                                >
                                    {value[0].toUpperCase() + value.slice(1)}
                                </button>
                            ))}
                        </div>

                        <div className="glass-bar zoom-bar absolute bottom-4.5 left-1/2 -translate-x-1/2">
                            <button
                                type="button"
                                className="icon-btn"
                                onClick={() => setZoom((value) => Math.max(ZOOM_MIN, value - ZOOM_STEP))}
                                aria-label="Zoom out"
                            >
                                <Minus size={14} />
                            </button>
                            <span className="value">{zoom}%</span>
                            <button
                                type="button"
                                className="icon-btn"
                                onClick={() => setZoom((value) => Math.min(ZOOM_MAX, value + ZOOM_STEP))}
                                aria-label="Zoom in"
                            >
                                <Plus size={14} />
                            </button>
                            <span className="divider" />
                            <button type="button" className="seg" onClick={() => setZoom(100)}>
                                Fit
                            </button>
                        </div>
                    </CompareStage>

                    {isProcessing && (
                        <div className="processing">
                            <div className="card">
                                <RefreshCcw className="spinner" />
                                <span className="title">Rendering</span>
                                <span className="subtitle">Generating your top-down visualization</span>
                            </div>
                        </div>
                    )}
                </div>

                <aside className="rail">
                    {versions.length > 0 && (
                        <section>
                            <span className="rail-label">VERSIONS</span>
                            <div className="versions">
                                {[...versions].reverse().map((version) => (
                                    <button
                                        key={version.id}
                                        type="button"
                                        className={version.id === activeVersionId ? "is-active" : ""}
                                        style={{
                                            backgroundImage: `url(${version.image})`,
                                            backgroundSize: "cover",
                                            backgroundPosition: "center",
                                        }}
                                        onClick={() => setActiveVersionId(version.id)}
                                    >
                                        {version.id}
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    <section>
                        <span className="rail-label">RENDER</span>

                        <div className="controls">
                            <div className="control">
                                <span className="label">View</span>
                                <span className="chip">Top-down</span>
                            </div>

                            <div className="slider">
                                <div className="slider-head">
                                    <label className="label" htmlFor="exposure">Exposure</label>
                                    <span className="value">{formatExposure(adjustments.exposure)}</span>
                                </div>
                                <input
                                    id="exposure"
                                    type="range"
                                    min={-1}
                                    max={1}
                                    step={0.1}
                                    value={adjustments.exposure}
                                    onChange={(event) =>
                                        setAdjustments((prev) => ({
                                            ...prev,
                                            exposure: Number(event.target.value),
                                        }))
                                    }
                                />
                            </div>

                            <div className="slider">
                                <div className="slider-head">
                                    <label className="label" htmlFor="warmth">Warmth</label>
                                    <span className="value">{adjustments.warmth}K</span>
                                </div>
                                <input
                                    id="warmth"
                                    type="range"
                                    min={3000}
                                    max={7000}
                                    step={100}
                                    value={adjustments.warmth}
                                    onChange={(event) =>
                                        setAdjustments((prev) => ({
                                            ...prev,
                                            warmth: Number(event.target.value),
                                        }))
                                    }
                                />
                            </div>

                            <div className="control">
                                <span className="label">Furnish</span>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={furnish}
                                    aria-label="Furnish rooms on the next render"
                                    className={`toggle ${furnish ? "is-on" : ""}`}
                                    onClick={() => setFurnish((on) => !on)}
                                >
                                    <span className="knob" />
                                </button>
                            </div>
                        </div>
                    </section>

                    <section>
                        <span className="rail-label">INFO</span>
                        <div className="info">
                            {info.map(({ key, value }) => (
                                <div key={key}>
                                    <span className="key">{key}</span>
                                    <span className="val">{value}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    )
}

export default VisualizerId
