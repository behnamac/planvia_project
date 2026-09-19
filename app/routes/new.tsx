import type { Route } from "./+types/new";
import {useRef, useState} from "react";
import {useNavigate, useOutletContext} from "react-router";
import Upload from "../../components/Upload";
import {createProject} from "../../lib/puter.action";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New render — Planvia" },
    { name: "description", content: "Turn a floor plan into a photoreal top-down render." },
  ];
}

export default function NewRender() {
    const navigate = useNavigate();
    const { upsertProject } = useOutletContext<AppContext>();
    const [furnish, setFurnish] = useState(true);
    const isCreatingProjectRef = useRef(false);

    const handleUploadComplete = async (base64Image: string) => {
        if (isCreatingProjectRef.current) return false;
        isCreatingProjectRef.current = true;

        try {
            const newId = Date.now().toString();
            const name = `Residence ${newId}`;

            const saved = await createProject({
                item: {
                    id: newId,
                    name,
                    sourceImage: base64Image,
                    renderedImage: undefined,
                    timestamp: Date.now(),
                    furnish,
                },
                visibility: 'private',
            });

            if (!saved) {
                console.error("Failed to create project");
                return false;
            }

            upsertProject(saved);
            navigate(`/visualizer/${newId}`);

            return true;
        } finally {
            isCreatingProjectRef.current = false;
        }
    }

    return (
        <div className="new-render">
            <div className="inner">
                <h1>New render</h1>
                <p className="lede">Drop a floor plan. JPG, PNG or WebP.</p>

                <Upload onComplete={handleUploadComplete} />

                <div className="settings">
                    <div className="setting">
                        <span className="label">View</span>
                        <span className="chip">Top-down</span>
                    </div>

                    <div className="setting">
                        <span className="label">Light</span>
                        <span className="chip">Neutral day</span>
                    </div>

                    <div className="setting">
                        <span className="label">Furnish</span>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={furnish}
                            aria-label="Furnish rooms from the plan's fixture icons"
                            className={`toggle ${furnish ? 'is-on' : ''}`}
                            onClick={() => setFurnish((on) => !on)}
                        >
                            <span className="knob" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
