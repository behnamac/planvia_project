/**
 * The stand-in plan shown in the overview showcase before the workspace has a
 * render of its own. Both variants share one viewBox so the compare handle
 * wipes between them in perfect register.
 */
const SamplePlan = ({ variant }: { variant: "sketch" | "render" }) => (
    <div className={`sample-plan ${variant === "sketch" ? "is-sketch" : "is-render"}`} aria-hidden="true">
        {variant === "sketch" ? (
            <svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid meet">
                <g fill="none" stroke="#5C5C64" strokeWidth="2">
                    <rect x="40" y="30" width="520" height="340" />
                    <path d="M330 30 V 150 M330 200 V 235" />
                    <path d="M330 235 H 470 M520 235 H 560" />
                    <path d="M450 235 V 300 M450 340 V 370" />
                    <path d="M40 150 H 120" />
                </g>
                <g fill="none" stroke="#3A3A40" strokeWidth="1">
                    <path d="M40 30 H 560 M40 370 H 560" strokeDasharray="3 5" />
                    <path d="M120 150 a 44 44 0 0 1 44 -44" stroke="#4F4F57" />
                    <path d="M330 150 a 50 50 0 0 0 -50 50" stroke="#4F4F57" />
                </g>
                <g fill="#4F4F57" fontFamily="Geist Mono, monospace" fontSize="11" letterSpacing="1.4">
                    <text x="150" y="215">LIVING 34 m&#178;</text>
                    <text x="380" y="130">KITCHEN 18 m&#178;</text>
                    <text x="360" y="320">BED 14</text>
                    <text x="480" y="320">BATH</text>
                </g>
                <g stroke="#FF6B35" strokeWidth="1" fill="none" opacity=".5">
                    <path d="M40 392 H 560 M40 386 V 398 M560 386 V 398" />
                </g>
                <text
                    x="300"
                    y="20"
                    fill="#5C5C64"
                    fontFamily="Geist Mono, monospace"
                    fontSize="10"
                    letterSpacing="2"
                    textAnchor="middle"
                >
                    12 400 mm
                </text>
            </svg>
        ) : (
            <svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid meet">
                <rect x="40" y="30" width="290" height="205" fill="#4A3F36" />
                <rect x="330" y="30" width="230" height="205" fill="#3E4440" />
                <rect x="330" y="235" width="120" height="135" fill="#45403A" />
                <rect x="450" y="235" width="110" height="135" fill="#383C42" />
                <rect x="40" y="235" width="290" height="135" fill="#4A3F36" />
                <g fill="#5E5147" opacity=".85">
                    <rect x="70" y="250" width="120" height="60" rx="6" />
                    <rect x="210" y="262" width="60" height="40" rx="6" />
                    <rect x="80" y="60" width="150" height="70" rx="8" fill="#6B5B4E" />
                </g>
                <g fill="#566059" opacity=".9">
                    <rect x="350" y="50" width="190" height="34" rx="5" />
                    <rect x="350" y="170" width="80" height="46" rx="5" />
                </g>
                <g fill="#5A5148" opacity=".9">
                    <rect x="348" y="255" width="86" height="96" rx="6" />
                </g>
                <g fill="#48505A" opacity=".9">
                    <rect x="468" y="255" width="40" height="60" rx="6" />
                    <rect x="520" y="330" width="28" height="28" rx="14" />
                </g>
                <g fill="none" stroke="#2A2A2E" strokeWidth="7">
                    <rect x="40" y="30" width="520" height="340" />
                    <path d="M330 30 V 150 M330 200 V 235 M330 235 H 470 M520 235 H 560 M450 235 V 300 M450 340 V 370" />
                </g>
                <path d="M40 30 H 560 L 560 130 Q 300 190 40 120 Z" fill="#FFFFFF" opacity=".045" />
            </svg>
        )}
    </div>
);

export default SamplePlan;
