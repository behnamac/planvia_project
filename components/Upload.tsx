import {type ChangeEvent, type DragEvent, useCallback, useEffect, useRef, useState} from 'react'
import {useOutletContext} from "react-router";
import {RefreshCcw, Upload as UploadIcon} from "lucide-react";
import {PROGRESS_INCREMENT, REDIRECT_DELAY_MS, PROGRESS_INTERVAL_MS} from "../lib/constants";

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const Upload = ({ onComplete }: UploadProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { isSignedIn } = useOutletContext<AppContext>();

    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, []);

    const processFile = useCallback((selected: File) => {
        if (!isSignedIn || file) return;

        setFile(selected);
        setProgress(0);

        const reader = new FileReader();
        reader.onerror = () => {
            setFile(null);
            setProgress(0);
        };
        reader.onloadend = () => {
            const base64Data = reader.result as string;

            intervalRef.current = setInterval(() => {
                setProgress((prev) => {
                    const next = prev + PROGRESS_INCREMENT;
                    if (next >= 100) {
                        if (intervalRef.current) {
                            clearInterval(intervalRef.current);
                            intervalRef.current = null;
                        }
                        timeoutRef.current = setTimeout(() => {
                            onComplete?.(base64Data);
                            timeoutRef.current = null;
                        }, REDIRECT_DELAY_MS);
                        return 100;
                    }
                    return next;
                });
            }, PROGRESS_INTERVAL_MS);
        };
        reader.readAsDataURL(selected);
    }, [file, isSignedIn, onComplete]);

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        if (!isSignedIn) return;
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (!isSignedIn) return;

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && ACCEPTED_TYPES.includes(droppedFile.type)) {
            processFile(droppedFile);
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (!isSignedIn) return;

        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            processFile(selectedFile);
        }
    };

    const dropzoneClasses = [
        'dropzone',
        isDragging ? 'is-dragging' : '',
        isSignedIn ? '' : 'is-disabled',
    ].filter(Boolean).join(' ');

    return (
        <div className="upload">
            <div
                className={dropzoneClasses}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    className="drop-input"
                    accept=".jpg,.jpeg,.png,.webp"
                    disabled={!isSignedIn || !!file}
                    onChange={handleChange}
                    aria-label="Upload a floor plan"
                />

                <UploadIcon size={24} strokeWidth={1.6} className="drop-icon" />

                <span className="title">
                    {isSignedIn ? 'Drop a plan here' : 'Sign in with Puter to upload'}
                </span>
                <span className="help">
                    {isSignedIn ? 'or click to browse' : 'Your renders are stored on your own Puter account'}
                </span>
            </div>

            {file && (
                <div className="progress-card">
                    <div className="head">
                        <RefreshCcw className="spinner" />
                        <span className="title">
                            {progress < 100 ? `Analysing ${file.name}` : 'Opening the render room'}
                        </span>
                        <span className="pct">{progress}%</span>
                    </div>

                    <div className="track">
                        <div className="bar" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            )}
        </div>
    )
}
export default Upload
