import { useCallback, useEffect, useState } from "react";
import RecipeListing from "../assets/RecipeListing";
import { supabase } from "../supabase";
import "./Home.css";

function Home() {
    const [recipes, setRecipes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const getRecipes = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage("");
        const { data: recipeData, error: recipeError } = await supabase
            .from("recipes")
            .select("*, recipe_categories(category_id, categories(name))");
        const { data: categoryData, error: categoryError } = await supabase
            .from("categories")
            .select("*")
            .order("name", { ascending: true });

        if (recipeError || categoryError) {
            setErrorMessage(recipeError?.message || categoryError.message);
            setRecipes([]);
            setCategories([]);
        } else {
            setRecipes(recipeData ?? []);
            setCategories(categoryData ?? []);
        }

        setIsLoading(false);
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        getRecipes();
    }, [getRecipes]);

    function toggleCategory(categoryId) {
        setSelectedCategoryIds((currentCategoryIds) =>
            currentCategoryIds.includes(categoryId)
                ? currentCategoryIds.filter((currentCategoryId) => currentCategoryId !== categoryId)
                : [...currentCategoryIds, categoryId]
        );
    }

    const normalizedSearchQuery = searchQuery.trim().toLowerCase();
    const filteredRecipes = recipes.filter((recipe) => {
        const matchesSearch = normalizedSearchQuery
            ? recipe.name?.toLowerCase().includes(normalizedSearchQuery)
            : true;
        const recipeCategoryIds = recipe.recipe_categories?.map((recipeCategory) => recipeCategory.category_id) ?? [];
        const matchesCategories = selectedCategoryIds.length > 0
            ? selectedCategoryIds.every((categoryId) => recipeCategoryIds.includes(categoryId))
            : true;

        return matchesSearch && matchesCategories;
    });

    return (
        <main className="home-container">
            <header className="home-header">
                <p className="eyebrow">Your personal cookbook</p>
                <h1>My Recipes</h1>
                <p className="home-intro">A collection of all the dishes you want to make again.</p>
                <label className="recipe-search">
                    <span className="search-icon" aria-hidden="true">⌕</span>
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search recipes by name"
                        aria-label="Search recipes by name"
                    />
                </label>

                {categories.length > 0 && (
                    <div className="category-tabs" aria-label="Filter recipes by category">
                        <button
                            type="button"
                            className={selectedCategoryIds.length === 0 ? "category-tab active" : "category-tab"}
                            onClick={() => setSelectedCategoryIds([])}
                        >
                            All
                        </button>
                        {categories.map((category) => (
                            <button
                                type="button"
                                className={selectedCategoryIds.includes(category.id) ? "category-tab active" : "category-tab"}
                                key={category.id}
                                onClick={() => toggleCategory(category.id)}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                )}
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

            {!isLoading && !errorMessage && recipes.length > 0 && filteredRecipes.length === 0 && (
                <div className="status-message empty-message">
                    <h2>No matching recipes</h2>
                    <p>Try searching for a different recipe name.</p>
                </div>
            )}

            {!isLoading && !errorMessage && filteredRecipes.length > 0 && (
            <div className="recipe-list">
                {filteredRecipes.map((recipe) => (
                    <RecipeListing key={recipe.id} recipe={recipe} />
                ))}
            </div>
            )}
        </main>
    );
}

export default Home;
