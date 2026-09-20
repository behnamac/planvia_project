import type { Route } from "./+types/home";
import {useMemo, useRef, useState} from "react";
import {Link, useOutletContext} from "react-router";
import {Columns2, PanelsTopLeft, Sun} from "lucide-react";
import CompareStage from "../../components/CompareStage";
import SamplePlan from "../../components/SamplePlan";
import {formatRelativeTime} from "../../lib/utils";
import {useLandingAnimation} from "../../lib/landing.animation";

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

const slugify = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

export default function Home() {
    const { projects, isSignedIn } = useOutletContext<AppContext>();
    // 0 is all render, 100 is all sketch. The stage tabs pin it to either edge.
    const [position, setPosition] = useState(50);
    const rootRef = useRef<HTMLDivElement>(null);

    useLandingAnimation(rootRef);

    // Show the newest finished render in the showcase; fall back to the sample plan.
    const featured = useMemo(
        () => projects.find((project) => project.renderedImage && project.sourceImage),
        [projects],
    );

    const path = featured
        ? `${slugify(featured.name ?? `residence-${featured.id}`)} / top-down`
        : "sample / level-1";

    const stage = position >= 50 ? "sketch" : "render";

    return (
        <div className="overview" ref={rootRef}>
            <section className="hero">
                <div className="hero-backdrop" aria-hidden="true">
                    <div className="plane" />
                    <div className="plane plane--fine" />
                    <div className="glow" />
                    <div className="sweep" />
                    <div className="vignette" />
                </div>

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
            </section>

            <section className="stages">
                <div className="eyebrow">SKETCH &rarr; RENDER</div>
                <h2>One plan, two stages</h2>
                <p className="lede">
                    Start from the line drawing and colour it into a render. Drag to move between them.
                </p>

                <div className="showcase">
                    <div className="showcase-head">
                        <div className="dots">
                            <span />
                            <span />
                            <span />
                        </div>
                        <span className="path">{path}</span>

                        <div className="stage-toggle">
                            <button
                                type="button"
                                className={stage === "sketch" ? "is-active" : ""}
                                onClick={() => setPosition(100)}
                            >
                                01 SKETCH
                            </button>
                            <button
                                type="button"
                                className={stage === "render" ? "is-active" : ""}
                                onClick={() => setPosition(0)}
                            >
                                02 RENDER
                            </button>
                        </div>
                    </div>

                    <CompareStage
                        planImage={featured?.sourceImage}
                        renderImage={featured?.renderedImage}
                        position={position}
                        onPositionChange={setPosition}
                        beforeLabel="01 SKETCH"
                        afterLabel="02 RENDER"
                        planFallback={<SamplePlan variant="sketch" />}
                        renderFallback={<SamplePlan variant="render" />}
                    />

                    <div className="showcase-foot">
                        <p className="caption">
                            Drag the handle: the line drawing on the left, the coloured render on the right.
                        </p>

                        <div className="stats">
                            {featured ? (
                                <>
                                    <span>top-down</span>
                                    <span>{featured.furnish === false ? "unfurnished" : "furnished"}</span>
                                    <span>{formatRelativeTime(featured.timestamp)}</span>
                                </>
                            ) : (
                                <>
                                    <span>128 m&#178;</span>
                                    <span>4 rooms</span>
                                    <span>sample plan</span>
                                </>
                            )}
                        </div>
                    </div>
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
