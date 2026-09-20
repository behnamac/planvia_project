import { useEffect, type RefObject } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "./gsap";

/**
 * Mirror of the `html.anim-boot` selector list at the end of app/app.css.
 * Both lists hide the same elements — keep them in sync.
 */
const HIDE_TARGETS = [
    ".hero-backdrop",
    ".hero .announce",
    ".hero h1",
    ".hero .subtitle",
    ".hero .actions",
    ".stages .eyebrow",
    ".stages h2",
    ".stages .lede",
    ".showcase",
    ".features .feature",
    ".site-footer",
];

interface SplitLineVars {
    linesClass: string;
    delay: number;
    yPercent: number;
    stagger: number;
    duration: number;
}

/**
 * Masked line reveal for a block of text.
 *
 * The caller defers this until fonts are ready so the first split lands on the
 * real metrics; autoSplit then re-splits on any later font load or width
 * change. onSplit returns the intro tween on the first pass only — after that
 * it returns a plain set(), because autoSplit re-splits on every resize and an
 * unconditional from() would replay the intro each time the window moved.
 *
 * Deliberately no ScrollTrigger on the returned tween: a re-split would build a
 * brand new trigger whose from() state re-hides text the reader already passed.
 */
const splitLines = (element: HTMLElement, vars: SplitLineVars) => {
    let played = false;

    return SplitText.create(element, {
        type: "lines",
        mask: "lines",
        linesClass: vars.linesClass,
        autoSplit: true,
        onSplit: (self) => {
            // The element is held at opacity 0 by the handoff so the unsplit
            // text never flashes. From here the masks do the hiding.
            gsap.set(element, { opacity: 1 });

            if (played) return gsap.set(self.lines, { yPercent: 0, opacity: 1 });

            played = true;

            return gsap.from(self.lines, {
                yPercent: vars.yPercent,
                opacity: 0,
                duration: vars.duration,
                stagger: vars.stagger,
                delay: vars.delay,
            });
        },
    });
};

/**
 * Entrance and scroll-reveal choreography for the landing route.
 *
 * Everything reveals once and stays revealed: the hero plays on load, every
 * section below it plays the first time it scrolls into view and then kills its
 * own ScrollTrigger.
 */
export const useLandingAnimation = (root: RefObject<HTMLElement | null>) => {
    useGSAP(
        () => {
            const scope = root.current;

            if (!scope) return;

            const q = (selector: string) =>
                Array.from(scope.querySelectorAll<HTMLElement>(selector));
            const qAll = (selectors: string[]) => selectors.flatMap(q);

            /**
             * Hand a pre-hidden wrapper over to its children: the wrapper is only
             * a layout box, so it goes visible at once and the children carry the
             * reveal. Same tick as the handoff, so nothing flashes.
             */
            const unwrap = (container: string, children: string) => {
                gsap.set(q(container), { opacity: 1 });

                const items = q(children);
                gsap.set(items, { opacity: 0, y: 14 });

                return items;
            };

            const hidden = qAll(HIDE_TARGETS);
            const mm = gsap.matchMedia();

            mm.add(
                {
                    motion: "(prefers-reduced-motion: no-preference)",
                    reduce: "(prefers-reduced-motion: reduce)",
                },
                (context) => {
                    const { motion } = context.conditions as Record<string, boolean>;

                    if (!motion) {
                        // Reduced motion. anim-boot is gone by the time anything can
                        // revert this branch, so clearing inline styles always lands
                        // on the fully visible state the server sent.
                        gsap.set(hidden, { clearProps: "all" });
                        return;
                    }

                    // --- handoff: inline styles take over from the CSS class ------
                    gsap.set(hidden, { opacity: 0 });
                    gsap.set(q(".hero .announce"), { y: 14 });

                    const ctas = unwrap(".hero .actions", ".hero .actions > a");
                    const footerBits = unwrap(
                        ".site-footer",
                        ".site-footer > span, .site-footer .links a",
                    );

                    // Showcase chrome rides inside the already-hidden card, so it can
                    // be staggered in after the card itself has landed.
                    const chrome = qAll([
                        ".showcase .dots span",
                        ".showcase .path",
                        ".showcase .stage-toggle button",
                        ".showcase-foot .caption",
                        ".showcase-foot .stats",
                    ]);
                    gsap.set(chrome, { opacity: 0 });

                    gsap.set(qAll([".stages .eyebrow", ".stages h2", ".stages .lede"]), {
                        y: 22,
                    });
                    gsap.set(q(".showcase"), { y: 34 });

                    // --- hero: plays on load, no trigger (it is above the fold) ---
                    const heroTl = gsap.timeline({ paused: true });

                    heroTl
                        // Opacity on the parent only. .plane, .plane--fine, .glow and
                        // .sweep all carry infinite CSS keyframes, and CSS animations
                        // outrank inline styles, so GSAP writes to those four would be
                        // silently dropped.
                        .to(q(".hero-backdrop"), { opacity: 1, duration: 1.4 }, 0)
                        .to(q(".hero .announce"), { y: 0, opacity: 1, duration: 0.6 }, 0.1)
                        .fromTo(
                            q(".hero .announce .dot"),
                            { scale: 0 },
                            { scale: 1, duration: 0.5, ease: "back.out(3)" },
                            0.35,
                        )
                        .to(ctas, { y: 0, opacity: 1, duration: 0.6, stagger: 0.08 }, 0.7)
                        .call(() => {
                            // Created here rather than up front so the scrub never fights
                            // the intro for ownership of the backdrop's opacity.
                            // context.add() runs immediately and records what it builds,
                            // so this still gets reverted with the branch.
                            context.add(() => {
                                gsap.fromTo(
                                    q(".hero-backdrop"),
                                    { opacity: 1 },
                                    {
                                        opacity: 0.15,
                                        ease: "none",
                                        // Mandatory: a plain to() would snapshot the
                                        // handoff's opacity 0 and pin the backdrop dark.
                                        immediateRender: false,
                                        scrollTrigger: {
                                            trigger: q(".hero")[0],
                                            start: "top top",
                                            end: "bottom top",
                                            scrub: 0.4,
                                        },
                                    },
                                );
                            });
                        });

                    let active = true;

                    // Splitting before Inter lands gives the wrong line breaks. autoSplit
                    // recovers from that, but gating avoids it outright. The 1.2s cap
                    // keeps a stalled font request from holding the hero hostage —
                    // autoSplit still fixes the breaks whenever the font arrives.
                    const fontsReady: Promise<unknown> = Promise.race([
                        document.fonts ? document.fonts.ready : Promise.resolve(),
                        new Promise((resolve) => gsap.delayedCall(1.2, resolve)),
                    ]);

                    fontsReady.then(() => {
                        if (!active) return;

                        context.add(() => {
                            const heading = q(".hero h1")[0];
                            const subtitle = q(".hero .subtitle")[0];

                            if (heading) {
                                splitLines(heading, {
                                    linesClass: "hero-line",
                                    delay: 0.2,
                                    yPercent: 112,
                                    stagger: 0.08,
                                    duration: 0.95,
                                });
                            }

                            if (subtitle) {
                                splitLines(subtitle, {
                                    linesClass: "sub-line",
                                    delay: 0.45,
                                    yPercent: 105,
                                    stagger: 0.06,
                                    duration: 0.85,
                                });
                            }

                            heroTl.play();
                        });
                    });

                    // --- scroll reveals, built in DOM order ------------------------
                    const stages = q(".stages")[0];

                    if (stages) {
                        gsap
                            .timeline({
                                defaults: { duration: 0.7 },
                                scrollTrigger: { trigger: stages, start: "top 78%", once: true },
                            })
                            .to(qAll([".stages .eyebrow", ".stages h2", ".stages .lede"]), {
                                y: 0,
                                opacity: 1,
                                stagger: 0.08,
                            })
                            // The card only — never the CompareStage internals, which own
                            // their own inline transforms. No scale either: a scaling
                            // ancestor makes react-compare-slider's measured width
                            // disagree with its painted width and the handle drifts.
                            .to(q(".showcase"), { y: 0, opacity: 1, duration: 0.9 }, "-=0.35")
                            .to(chrome, { opacity: 1, duration: 0.45, stagger: 0.05 }, "-=0.5");
                    }

                    const features = q(".features")[0];

                    if (features) {
                        gsap.fromTo(
                            q(".features .feature"),
                            { y: 26, opacity: 0 },
                            {
                                y: 0,
                                opacity: 1,
                                duration: 0.7,
                                stagger: 0.09,
                                // Reachability, not taste. This page is short, so on a
                                // tall screen the last sections never climb far up the
                                // viewport: measured at max scroll, .features tops out
                                // around 80% and .site-footer around 97%. A start line
                                // set past that is never crossed and the section stays
                                // invisible for good, so both anchor near "bottom".
                                scrollTrigger: {
                                    trigger: features,
                                    start: "top bottom-=40",
                                    once: true,
                                },
                            },
                        );
                    }

                    const footer = q(".site-footer")[0];

                    if (footer) {
                        gsap.to(footerBits, {
                            y: 0,
                            opacity: 1,
                            duration: 0.6,
                            stagger: 0.06,
                            // "top bottom" is the only start guaranteed to fire for the
                            // last element on the page: at max scroll its top sits at
                            // viewport height minus its own height, which beats 100% for
                            // any non-zero height but loses to a 96% line on a tall
                            // screen.
                            scrollTrigger: { trigger: footer, start: "top bottom", once: true },
                        });
                    }

                    return () => {
                        active = false;
                    };
                },
            );

            // Only now. From here GSAP's inline styles are the single source of
            // truth, so any later revert resolves to "visible" rather than
            // stranding an element at opacity 0 under a still-matching CSS rule.
            const boot = window as typeof window & { __animBoot?: number };

            window.clearTimeout(boot.__animBoot);
            delete boot.__animBoot;

            document.documentElement.classList.remove("anim-boot");

            return () => mm.revert();
        },
        { scope: root },
    );

    // Deliberately a separate effect with no animation deps: it must never be
    // able to re-run or duplicate the timelines above.
    useEffect(() => {
        const element = root.current;

        if (typeof window === "undefined" || !element) return;

        // Debounced so a burst of observer callbacks collapses into one refresh,
        // and so the refresh lands after React has committed layout.
        const refresh = gsap.delayedCall(0.12, () => ScrollTrigger.refresh()).pause();
        const schedule = () => refresh.restart(true);

        // Fonts reflow the whole page and ScrollTrigger has no hook for it — it
        // auto-refreshes on load and resize only.
        document.fonts?.ready.then(schedule);

        // One signal covering every async shift on this route: refreshAuth()
        // resolving (the announce copy, the path and the stats all swap), the
        // sample SVG giving way to a real <img>, and the showcase head wrapping
        // on narrow viewports. A height-neutral change cannot move a trigger, so
        // anything this misses did not need a refresh.
        const observer = new ResizeObserver(schedule);
        observer.observe(element);

        return () => {
            observer.disconnect();
            refresh.kill();
        };
    }, [root]);
};
