import type { Route } from "./+types/home";
import {useMemo, useState} from "react";
import {Link, useOutletContext} from "react-router";
import {Columns2, PanelsTopLeft, Sun} from "lucide-react";
import CompareStage from "../../components/CompareStage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Planvia — judge a render in the light it deserves" },
    {
      name: "description",
      content:
        "Planvia turns a floor plan into a photoreal top-down view, then hands you a neutral dark room to inspect it in.",
    },
  ];
}

const MODES: CompareMode[] = ["compare", "render", "plan"];

const slugify = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

export default function Home() {
    const { projects, isSignedIn } = useOutletContext<AppContext>();
    const [mode, setMode] = useState<CompareMode>("compare");
    const [position, setPosition] = useState(50);

    // Show the newest finished render in the hero; fall back to bare surfaces.
    const featured = useMemo(
        () => projects.find((project) => project.renderedImage && project.sourceImage),
        [projects],
    );

    const path = featured
        ? `${slugify(featured.name ?? `residence-${featured.id}`)} / top-down`
        : "no renders yet";

    return (
        <div className="overview">
            <section className="hero">
                <div className="announce">
                    <span className="dot" />
                    {isSignedIn && projects.length > 0
                        ? `${projects.length} ${projects.length === 1 ? "render" : "renders"} in this workspace`
                        : "Top-down photoreal renders from a floor plan"}
                </div>

                <h1>Judge a render in the light it deserves.</h1>

                <p className="subtitle">
                    Planvia turns a floor plan into a photoreal top-down view, then hands you a neutral
                    dark room to inspect it in. No colour cast, no chrome competing with the image.
                </p>

                <div className="actions">
                    <Link to="/new" className="btn btn--primary btn--lg">Render a plan</Link>
                    <Link to="/renders" className="btn btn--secondary btn--lg">Browse renders</Link>
                </div>

                <div className="showcase">
                    <div className="showcase-head">
                        <div className="dots">
                            <span />
                            <span />
                            <span />
                        </div>
                        <span className="path">{path}</span>
                    </div>

                    <CompareStage
                        planImage={featured?.sourceImage}
                        renderImage={featured?.renderedImage}
                        mode={mode}
                        position={position}
                        onPositionChange={setPosition}
                    >
                        <div className="glass-bar absolute bottom-4 left-1/2 -translate-x-1/2">
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
                    </CompareStage>
                </div>
            </section>

            <section className="features">
                <div className="grid">
                    <article className="feature">
                        <Sun className="icon" strokeWidth={1.8} />
                        <h3>Neutral surround</h3>
                        <p>
                            Greys picked so nothing bleeds into the image. What you see is the render, not
                            the interface around it.
                        </p>
                    </article>

                    <article className="feature">
                        <PanelsTopLeft className="icon" strokeWidth={1.8} />
                        <h3>Toolbars that float</h3>
                        <p>Controls sit over the image on glass and step out of the way while you look.</p>
                    </article>

                    <article className="feature">
                        <Columns2 className="icon" strokeWidth={1.8} />
                        <h3>Real before / after</h3>
                        <p>
                            A proper handle, keyboard nudge, and every version kept so you can step back
                            through them.
                        </p>
                    </article>
                </div>
            </section>

            <footer className="site-footer">
                <span>Planvia &mdash; architectural visualization</span>
                <div className="links">
                    <a href="#0">Pricing</a>
                    <a href="#0">Docs</a>
                    <a href="#0">Contact</a>
                </div>
            </footer>
        </div>
    )
}
