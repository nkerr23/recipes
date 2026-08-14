import { useCallback, useEffect, useState } from "react";
import RecipeListing from "../assets/RecipeListing";
import { supabase } from "../supabase";
import "./Home.css";

function Home() {
    const [recipes, setRecipes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const getRecipes = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage("");
        const { data, error } = await supabase
            .from("recipes")
            .select("*");

        if (error) {
            setErrorMessage(error.message);
            setRecipes([]);
        } else {
            setRecipes(data ?? []);
        }

        setIsLoading(false);
    }, []);

    useEffect(() => {
        getRecipes();
    }, [getRecipes]);

    return (
        <main className="home-container">
            <header className="home-header">
                <p className="eyebrow">Your personal cookbook</p>
                <h1>My Recipes</h1>
                <p className="home-intro">A collection of all the dishes you want to make again.</p>
            </header>

            {isLoading && <p className="status-message">Loading recipes…</p>}

            {!isLoading && errorMessage && (
                <div className="status-message error-message" role="alert">
                    <p>We couldn’t load your recipes. {errorMessage}</p>
                    <button type="button" onClick={getRecipes}>Try again</button>
                </div>
            )}

            {!isLoading && !errorMessage && recipes.length === 0 && (
                <div className="status-message empty-message">
                    <h2>No recipes yet</h2>
                    <p>Your recipes will appear here once you add them.</p>
                </div>
            )}

            {!isLoading && !errorMessage && recipes.length > 0 && (
            <div className="recipe-list">
                {recipes.map((recipe) => (
                    <RecipeListing key={recipe.id} recipe={recipe} />
                ))}
            </div>
            )}
        </main>
    );
}

export default Home;
