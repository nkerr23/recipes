import { Link } from "react-router-dom";
import { supabase } from "../supabase";
import "./Header.css";

function Header({ user }) {
    const avatarUrl = user?.user_metadata?.avatar_url;
    const name = user?.user_metadata?.name;
    const email = user?.email ?? "";
    const label = name || email;
    const initial = label.charAt(0).toUpperCase() || "U";

    async function handleSignOut() {
        await supabase.auth.signOut();
    }

    return (
        <header className="site-header">
            <Link className="site-logo" to="/">Recipes</Link>
            <nav className="site-actions" aria-label="Main navigation">
                {user && <Link className="create-recipe-button" to="/recipes/new">Create Recipe</Link>}
                {user ? (
                    <button type="button" className="profile-button" onClick={handleSignOut} title="Sign out">
                        <span className="profile-avatar">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt={label} />
                            ) : (
                                <span>{initial}</span>
                            )}
                        </span>
                        <span className="profile-name">{name || "Sign out"}</span>
                    </button>
                ) : (
                    <Link className="login-button" to="/signin">Login</Link>
                )}
            </nav>
        </header>
    );
}

export default Header;
