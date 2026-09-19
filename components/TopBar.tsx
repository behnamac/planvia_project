import {useEffect, useState} from "react";
import {Link, NavLink, useLocation} from "react-router";
import {Box, Search} from "lucide-react";
import Button from "./ui/Button";
import CommandPalette from "./CommandPalette";

const getInitials = (name: string | null) => {
    if (!name) return "—";

    return name
        .split(/[\s._-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || name.slice(0, 2).toUpperCase();
};

const TopBar = ({ isSignedIn, userName, signIn, signOut, projects }: AppContext) => {
    const { pathname } = useLocation();
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // The Room tab always opens whatever was rendered most recently.
    const latestProject = projects[0];
    const roomPath = latestProject ? `/visualizer/${latestProject.id}` : "/renders";

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                setIsSearchOpen((open) => !open);
            }
        };

        window.addEventListener("keydown", onKeyDown);

        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    const handleAuthClick = async () => {
        try {
            await (isSignedIn ? signOut() : signIn());
        } catch (e) {
            console.error(`Puter ${isSignedIn ? "sign out" : "sign in"} failed: ${e}`);
        }
    };

    return (
        <>
            <header className="topbar">
                <div className="left">
                    <NavLink to="/" className="brand">
                        <Box className="logo" strokeWidth={1.8} />
                        <span className="name">Planvia</span>
                    </NavLink>

                    <nav className="nav">
                        <NavLink to="/" end className={({ isActive }) => (isActive ? "is-active" : "")}>
                            Overview
                        </NavLink>
                        <NavLink to="/renders" className={({ isActive }) => (isActive ? "is-active" : "")}>
                            Renders
                        </NavLink>
                        <NavLink
                            to={roomPath}
                            className={pathname.startsWith("/visualizer/") ? "is-active" : ""}
                        >
                            Room
                        </NavLink>
                    </nav>
                </div>

                <div className="right">
                    <button type="button" className="search" onClick={() => setIsSearchOpen(true)}>
                        <Search size={13} className="text-dim" />
                        <span className="placeholder">Search</span>
                        <span className="kbd">&#8984;K</span>
                    </button>

                    <Link to="/new" className="btn btn--primary btn--sm">
                        New render
                    </Link>

                    {isSignedIn ? (
                        <button
                            type="button"
                            className="avatar"
                            onClick={handleAuthClick}
                            title={userName ? `${userName} — sign out` : "Sign out"}
                        >
                            {getInitials(userName)}
                        </button>
                    ) : (
                        <Button size="sm" variant="ghost" onClick={handleAuthClick}>
                            Log in
                        </Button>
                    )}
                </div>
            </header>

            {isSearchOpen && (
                <CommandPalette projects={projects} onClose={() => setIsSearchOpen(false)} />
            )}
        </>
    );
};

export default TopBar;
