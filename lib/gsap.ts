import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

/**
 * Single registration point for GSAP.
 *
 * Every module in the app imports gsap from here rather than from "gsap"
 * directly, so plugin registration can never be missed. Plugins touch
 * `document` as they register, so the call is guarded the same way the rest of
 * lib/ guards browser-only work (see imageUrlToPngBlob in lib/utils.ts).
 */
if (typeof window !== "undefined") {
    gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

    gsap.defaults({ ease: "power3.out", duration: 0.8 });

    // The mobile URL bar showing and hiding fires a resize. Without this, every
    // scroll on iOS would cost a full ScrollTrigger.refresh().
    ScrollTrigger.config({ ignoreMobileResize: true });
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
