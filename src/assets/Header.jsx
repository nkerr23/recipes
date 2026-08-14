import { Link } from "react-router-dom";
import "./Header.css";

function Header() {
    return (
        <header className="site-header">
            <Link className="site-logo" to="/">Recipes</Link>
            <Link className="create-recipe-button" to="/recipes/new">Create Recipe</Link>
        </header>
    );
}

export default Header;
