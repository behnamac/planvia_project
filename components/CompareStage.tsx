import {type ReactNode} from "react";
import {ReactCompareSlider, ReactCompareSliderHandle} from "react-compare-slider";

interface CompareStageProps {
    planImage?: string | null;
    renderImage?: string | null;
    /** `compare` shows the divider; `render` and `plan` pin it to an edge. */
    mode?: CompareMode;
    /** Divider position, 0-100. 0 is all render, 100 is all plan. */
    position: number;
    onPositionChange?: (position: number) => void;
    /** Percentage zoom applied to both layers so they stay in register. */
    zoom?: number;
    /** CSS filter applied to the render layer only. */
    renderFilter?: string;
    /** Shown in place of a missing plan image — e.g. the sample plan on the overview. */
    planFallback?: ReactNode;
    /** Shown in place of a missing render image. */
    renderFallback?: ReactNode;
    beforeLabel?: string;
    afterLabel?: string;
    labelOffset?: string;
    className?: string;
    children?: ReactNode;
}

/**
 * The before/after surface used by both the overview hero and the room. The
 * plan sits underneath and the render is clipped in from the right, so the
 * divider reads left-to-right as before-to-after.
 */
const CompareStage = ({
    planImage,
    renderImage,
    mode = "compare",
    position,
    onPositionChange,
    zoom = 100,
    renderFilter,
    planFallback = <span className="layer-note">PLAN</span>,
    renderFallback = <span className="layer-note">RENDER</span>,
    beforeLabel = "BEFORE",
    afterLabel = "AFTER",
    labelOffset = "16px",
    className = "",
    children,
}: CompareStageProps) => {
    const isComparing = mode === "compare";
    const effectivePosition = mode === "render" ? 0 : mode === "plan" ? 100 : position;
    const scale = { transform: `scale(${zoom / 100})` };

    return (
        <div className={`stage ${className}`}>
            <ReactCompareSlider
                position={effectivePosition}
                onPositionChange={isComparing ? onPositionChange : undefined}
                disabled={!isComparing}
                transition="0.25s ease-out"
                keyboardIncrement="2%"
                style={{ width: "100%", height: "100%", cursor: isComparing ? "ew-resize" : "default" }}
                handle={
                    isComparing ? (
                        <ReactCompareSliderHandle
                            style={{ color: "#FF6B35" }}
                            linesStyle={{ width: 2, boxShadow: "none" }}
                            buttonStyle={{
                                width: 38,
                                height: 38,
                                gap: 4,
                                border: "1px solid #FF6B35",
                                backgroundColor: "rgba(20,20,22,.85)",
                                boxShadow: "0 0 0 4px rgba(255,107,53,.1)",
                            }}
                        />
                    ) : (
                        <span />
                    )
                }
                itemOne={
                    <div className="layer layer--plan">
                        {planImage ? (
                            <img src={planImage} alt="Source floor plan" style={scale} draggable={false} />
                        ) : (
                            planFallback
                        )}
                    </div>
                }
                itemTwo={
                    <div className="layer layer--render">
                        {renderImage ? (
                            <img
                                src={renderImage}
                                alt="Rendered view"
                                style={{ ...scale, filter: renderFilter }}
                                draggable={false}
                            />
                        ) : (
                            renderFallback
                        )}
                    </div>
                }
            />

            <span className="edge-label" style={{ left: "18px", bottom: labelOffset }}>
                {beforeLabel}
            </span>
            <span className="edge-label" style={{ right: "18px", bottom: labelOffset }}>
                {afterLabel}
            </span>

            {children && <div className="overlay">{children}</div>}
        </div>
    );
};

export default CompareStage;
