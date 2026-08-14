import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../supabase";
import "./Recipe.css";

function Recipe() {
    const { recipeId } = useParams();
    const [recipe, setRecipe] = useState(null);
    const [ingredients, setIngredients] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const getRecipe = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage("");

        const { data: recipeData, error: recipeError } = await supabase
            .from("recipes")
            .select("*")
            .eq("id", recipeId)
            .single();

        if (recipeError) {
            setErrorMessage(recipeError.message);
            setRecipe(null);
            setIngredients([]);
            setCategories([]);
        } else {
            const { data: ingredientData, error: ingredientError } = await supabase
                .from("ingredients")
                .select("*")
                .eq("recipes_id", recipeId)
                .order("sort_order", { ascending: true });

            if (ingredientError) {
                setErrorMessage(ingredientError.message);
                setRecipe(null);
                setIngredients([]);
                setCategories([]);
            } else {
                const { data: categoryData, error: categoryError } = await supabase
                    .from("recipe_categories")
                    .select("categories(name)")
                    .eq("recipe_id", recipeId);

                if (categoryError) {
                    setErrorMessage(categoryError.message);
                    setRecipe(null);
                    setIngredients([]);
                    setCategories([]);
                    setIsLoading(false);
                    return;
                }

                setRecipe(recipeData);
                setIngredients(ingredientData ?? []);
                setCategories(
                    categoryData
                        ?.map((recipeCategory) => recipeCategory.categories?.name)
                        .filter(Boolean) ?? []
                );
            }
        }

        setIsLoading(false);
    }, [recipeId]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        getRecipe();
    }, [getRecipe]);

    return (
        <main className="recipe-page">
            <Link className="back-link" to="/">Back to recipes</Link>

            {isLoading && <p className="status-message">Loading recipe...</p>}

            {!isLoading && errorMessage && (
                <div className="status-message error-message" role="alert">
                    <p>We couldn't load this recipe. {errorMessage}</p>
                    <button type="button" onClick={getRecipe}>Try again</button>
                </div>
            )}

            {!isLoading && !errorMessage && recipe && (
                <article className="recipe-detail">
                    {recipe.image_url && (
                        <img className="recipe-detail-image" src={recipe.image_url} alt={recipe.name || "Recipe"} />
                    )}
                    <div className="recipe-detail-content">
                        {categories.length > 0 && <p className="eyebrow">{categories.join(", ")}</p>}
                        <h1>{recipe.name || "Untitled recipe"}</h1>
                        <p>{recipe.description || "No description added yet."}</p>
                        {(recipe.prep_time || recipe.cook_time || recipe.servings) && (
                            <dl className="recipe-meta">
                                {recipe.prep_time && (
                                    <div>
                                        <dt>Prep</dt>
                                        <dd>{recipe.prep_time}</dd>
                                    </div>
                                )}
                                {recipe.cook_time && (
                                    <div>
                                        <dt>Cook</dt>
                                        <dd>{recipe.cook_time}</dd>
                                    </div>
                                )}
                                {recipe.servings && (
                                    <div>
                                        <dt>Servings</dt>
                                        <dd>{recipe.servings}</dd>
                                    </div>
                                )}
                            </dl>
                        )}
                        {ingredients.length > 0 && (
                            <section className="recipe-section">
                                <h2>Ingredients</h2>
                                <ul className="ingredient-list">
                                    {ingredients.map((ingredient) => (
                                        <li key={ingredient.id}>
                                            {[ingredient.quantity, ingredient.unit, ingredient.name]
                                                .filter(Boolean)
                                                .join(" ")}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}
                        {recipe.instructions && (
                            <section className="recipe-section">
                                <h2>Instructions</h2>
                                <p>{recipe.instructions}</p>
                            </section>
                        )}
                    </div>
                </article>
            )}
        </main>
    );
}

export default Recipe;
