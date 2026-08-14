import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabase";
import "./CreateRecipe.css";

const initialForm = {
    title: "",
    description: "",
    newCategory: "",
    prep_time: "",
    cook_time: "",
    servings: "",
    instructions: "",
};

const initialIngredient = {
    name: "",
    quantity: "",
    unit: "",
};

function cleanText(value) {
    return String(value ?? "").trim();
}

function CreateRecipe() {
    const navigate = useNavigate();
    const { recipeId } = useParams();
    const isEditing = Boolean(recipeId);
    const [formData, setFormData] = useState(initialForm);
    const [categories, setCategories] = useState([]);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
    const [originalCategoryIds, setOriginalCategoryIds] = useState([]);
    const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [ingredients, setIngredients] = useState([initialIngredient]);
    const [currentImageUrl, setCurrentImageUrl] = useState("");
    const [isLoadingRecipe, setIsLoadingRecipe] = useState(isEditing);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const getCategories = useCallback(async () => {
        const { data, error } = await supabase
            .from("categories")
            .select("*")
            .order("name", { ascending: true });

        if (error) {
            setErrorMessage(error.message);
            setCategories([]);
        } else {
            setCategories(data ?? []);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        getCategories();
    }, [getCategories]);

    const getRecipe = useCallback(async () => {
        if (!isEditing) {
            return;
        }

        setIsLoadingRecipe(true);
        setErrorMessage("");

        const { data: recipeData, error: recipeError } = await supabase
            .from("recipes")
            .select("*")
            .eq("id", recipeId)
            .maybeSingle();

        if (recipeError) {
            setErrorMessage(recipeError.message);
            setIsLoadingRecipe(false);
            return;
        }

        if (!recipeData) {
            setErrorMessage("Recipe not found.");
            setIsLoadingRecipe(false);
            return;
        }

        const { data: ingredientData, error: ingredientError } = await supabase
            .from("ingredients")
            .select("*")
            .eq("recipes_id", recipeId)
            .order("sort_order", { ascending: true });

        if (ingredientError) {
            setErrorMessage(ingredientError.message);
            setIsLoadingRecipe(false);
            return;
        }

        const { data: categoryData, error: categoryError } = await supabase
            .from("recipe_categories")
            .select("category_id")
            .eq("recipe_id", recipeId);

        if (categoryError) {
            setErrorMessage(categoryError.message);
            setIsLoadingRecipe(false);
            return;
        }

        setFormData({
            title: String(recipeData.name ?? ""),
            description: String(recipeData.description ?? ""),
            newCategory: "",
            prep_time: String(recipeData.prep_time ?? ""),
            cook_time: String(recipeData.cook_time ?? ""),
            servings: String(recipeData.servings ?? ""),
            instructions: String(recipeData.instructions ?? ""),
        });
        setCurrentImageUrl(recipeData.image_url ?? "");
        setIngredients(
            ingredientData?.length
                ? ingredientData.map((ingredient) => ({
                    name: String(ingredient.name ?? ""),
                    quantity: String(ingredient.quantity ?? ""),
                    unit: String(ingredient.unit ?? ""),
                }))
                : [initialIngredient]
        );
        const loadedCategoryIds = categoryData?.map((category) => String(category.category_id)) ?? [];
        setSelectedCategoryIds(loadedCategoryIds);
        setOriginalCategoryIds(loadedCategoryIds);
        setIsLoadingRecipe(false);
    }, [isEditing, recipeId]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        getRecipe();
    }, [getRecipe]);

    const selectedCategoryNames = categories
        .filter((category) => selectedCategoryIds.includes(String(category.id)))
        .map((category) => category.name);

    function handleChange(event) {
        const { name, value } = event.target;
        setFormData((currentFormData) => ({
            ...currentFormData,
            [name]: value,
        }));
    }

    function handleImageChange(event) {
        setImageFile(event.target.files?.[0] ?? null);
    }

    function handleCategoryChange(event) {
        const categoryId = String(event.target.value);
        setSelectedCategoryIds((currentCategoryIds) =>
            event.target.checked
                ? [...currentCategoryIds, categoryId]
                : currentCategoryIds.filter((currentCategoryId) => currentCategoryId !== categoryId)
        );
    }

    function toggleCategoryMenu() {
        setIsCategoryMenuOpen((currentIsOpen) => !currentIsOpen);
    }

    function handleIngredientChange(index, event) {
        const { name, value } = event.target;
        setIngredients((currentIngredients) =>
            currentIngredients.map((ingredient, ingredientIndex) =>
                ingredientIndex === index ? { ...ingredient, [name]: value } : ingredient
            )
        );
    }

    function addIngredient() {
        setIngredients((currentIngredients) => [...currentIngredients, initialIngredient]);
    }

    function removeIngredient(index) {
        setIngredients((currentIngredients) =>
            currentIngredients.filter((ingredient, ingredientIndex) => ingredientIndex !== index)
        );
    }

    async function uploadRecipeImage() {
        if (!imageFile) {
            return null;
        }

        const extension = imageFile.name.split(".").pop();
        const filePath = `${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage
            .from("recipe-images")
            .upload(filePath, imageFile);

        if (error) {
            throw error;
        }

        const { data } = supabase.storage
            .from("recipe-images")
            .getPublicUrl(filePath);

        return data.publicUrl;
    }

    async function findOrCreateCategory(name) {
        const { data: existingCategory, error: findError } = await supabase
            .from("categories")
            .select("id")
            .eq("name", name)
            .limit(1)
            .maybeSingle();

        if (findError) {
            throw findError;
        }

        if (existingCategory) {
            return existingCategory.id;
        }

        const { data: newCategory, error: insertError } = await supabase
            .from("categories")
            .insert({ name })
            .select("id");

        if (insertError) {
            throw insertError;
        }

        if (!newCategory?.[0]?.id) {
            throw new Error("Could not create category.");
        }

        return newCategory[0].id;
    }

    async function deleteUnusedCategories(categoryIds) {
        await Promise.all(categoryIds.map(async (categoryId) => {
            const { count, error: countError } = await supabase
                .from("recipe_categories")
                .select("*", { count: "exact", head: true })
                .eq("category_id", Number(categoryId));

            if (countError) {
                throw countError;
            }

            if (count === 0) {
                const { error: deleteCategoryError } = await supabase
                    .from("categories")
                    .delete()
                    .eq("id", Number(categoryId));

                if (deleteCategoryError) {
                    throw deleteCategoryError;
                }
            }
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setErrorMessage("");

        const title = cleanText(formData.title);

        if (!title) {
            setErrorMessage("Title is required.");
            return;
        }

        setIsSaving(true);

        try {
            const uploadedImageUrl = await uploadRecipeImage();
            const imageUrl = uploadedImageUrl ?? (currentImageUrl || null);
            const recipe = {
                name: title,
                description: cleanText(formData.description) || null,
                image_url: imageUrl,
                prep_time: cleanText(formData.prep_time) || null,
                cook_time: cleanText(formData.cook_time) || null,
                servings: cleanText(formData.servings) || null,
                instructions: cleanText(formData.instructions) || null,
            };

            let savedRecipeId = recipeId;

            if (isEditing) {
                const { error } = await supabase
                    .from("recipes")
                    .update(recipe)
                    .eq("id", recipeId);

                if (error) {
                    throw error;
                }
            } else {
                const { data: savedRecipes, error } = await supabase
                    .from("recipes")
                    .insert(recipe)
                    .select("id");

                if (error) {
                    throw error;
                }

                savedRecipeId = savedRecipes?.[0]?.id;

                if (!savedRecipeId) {
                    throw new Error("Recipe could not be saved.");
                }
            }

            const newCategoryNames = cleanText(formData.newCategory)
                .split(",")
                .map((categoryName) => cleanText(categoryName))
                .filter(Boolean);
            let categoryIds = selectedCategoryIds;

            if (newCategoryNames.length > 0) {
                const newCategoryIds = await Promise.all(
                    newCategoryNames.map((categoryName) => findOrCreateCategory(categoryName))
                );
                categoryIds = [...categoryIds, ...newCategoryIds.map((categoryId) => String(categoryId))];
            }

            const uniqueCategoryIds = [...new Set(categoryIds.map((categoryId) => String(categoryId)))];

            if (isEditing) {
                const { error: deleteRecipeCategoriesError } = await supabase
                    .from("recipe_categories")
                    .delete()
                    .eq("recipe_id", savedRecipeId);

                if (deleteRecipeCategoriesError) {
                    throw deleteRecipeCategoriesError;
                }
            }

            if (uniqueCategoryIds.length > 0) {
                const { error: recipeCategoriesError } = await supabase
                    .from("recipe_categories")
                    .upsert(
                        uniqueCategoryIds.map((categoryId) => ({
                            recipe_id: savedRecipeId,
                            category_id: Number(categoryId),
                        })),
                        { onConflict: "recipe_id,category_id" }
                    );

                if (recipeCategoriesError) {
                    throw recipeCategoriesError;
                }
            }

            if (isEditing) {
                const removedCategoryIds = originalCategoryIds.filter(
                    (categoryId) => !uniqueCategoryIds.includes(categoryId)
                );

                if (removedCategoryIds.length > 0) {
                    await deleteUnusedCategories(removedCategoryIds);
                }
            }

            const ingredientRows = ingredients
                .map((ingredient, index) => ({
                    recipes_id: savedRecipeId,
                    name: cleanText(ingredient.name),
                    quantity: cleanText(ingredient.quantity) || null,
                    unit: cleanText(ingredient.unit) || null,
                    sort_order: index + 1,
                }))
                .filter((ingredient) => ingredient.name);

            if (isEditing) {
                const { error: deleteIngredientsError } = await supabase
                    .from("ingredients")
                    .delete()
                    .eq("recipes_id", savedRecipeId);

                if (deleteIngredientsError) {
                    throw deleteIngredientsError;
                }
            }

            if (ingredientRows.length > 0) {
                const { error: ingredientsError } = await supabase
                    .from("ingredients")
                    .insert(ingredientRows);

                if (ingredientsError) {
                    throw ingredientsError;
                }
            }

            navigate(`/recipes/${savedRecipeId}`);
        } catch (error) {
            setErrorMessage(error.message);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <main className="create-recipe-page">
            <header className="create-recipe-header">
                <p className="eyebrow">{isEditing ? "Update cookbook" : "Add to cookbook"}</p>
                <h1>{isEditing ? "Edit Recipe" : "Create Recipe"}</h1>
            </header>

            {isLoadingRecipe && <p className="status-message">Loading recipe...</p>}

            {!isLoadingRecipe && (
            <form className="create-recipe-form" onSubmit={handleSubmit}>
                <label>
                    <span>Title</span>
                    <input
                        name="title"
                        type="text"
                        value={formData.title}
                        onChange={handleChange}
                        required
                    />
                </label>

                <label>
                    <span>Description</span>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="4"
                    />
                </label>

                <div className="form-grid">
                    <label>
                        <span>Recipe Image</span>
                        {currentImageUrl && (
                            <img className="current-recipe-image" src={currentImageUrl} alt="Current recipe" />
                        )}
                        <input
                            name="image"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                    </label>
                </div>

                <section className="category-picker">
                    <div className="section-heading">
                        <h2>Categories</h2>
                    </div>

                    <div className="category-dropdown">
                        <button
                            type="button"
                            className="category-dropdown-button"
                            onClick={toggleCategoryMenu}
                            aria-expanded={isCategoryMenuOpen}
                        >
                            {selectedCategoryNames.length > 0
                                ? selectedCategoryNames.join(", ")
                                : "Select categories"}
                        </button>

                        {isCategoryMenuOpen && (
                            <div className="category-dropdown-menu">
                                {categories.length > 0 ? (
                                    categories.map((category) => (
                                        <label className="category-option" key={category.id}>
                                            <input
                                                type="checkbox"
                                                value={category.id}
                                                checked={selectedCategoryIds.includes(String(category.id))}
                                                onChange={handleCategoryChange}
                                            />
                                            <span>{category.name}</span>
                                        </label>
                                    ))
                                ) : (
                                    <p className="category-empty">No categories yet.</p>
                                )}
                            </div>
                        )}
                    </div>

                    <label>
                        <span>New Categories</span>
                        <input
                            name="newCategory"
                            type="text"
                            value={formData.newCategory}
                            onChange={handleChange}
                            placeholder="Dinner, Vegetarian, Dessert"
                        />
                    </label>
                </section>

                <div className="form-grid three-column">
                    <label>
                        <span>Prep Time</span>
                        <input
                            name="prep_time"
                            type="text"
                            value={formData.prep_time}
                            onChange={handleChange}
                        />
                    </label>

                    <label>
                        <span>Cook Time</span>
                        <input
                            name="cook_time"
                            type="text"
                            value={formData.cook_time}
                            onChange={handleChange}
                        />
                    </label>

                    <label>
                        <span>Servings</span>
                        <input
                            name="servings"
                            type="text"
                            value={formData.servings}
                            onChange={handleChange}
                        />
                    </label>
                </div>

                <section className="ingredients-editor">
                    <div className="section-heading">
                        <h2>Ingredients</h2>
                        <button type="button" className="secondary-button" onClick={addIngredient}>
                            Add Ingredient
                        </button>
                    </div>

                    <div className="ingredient-rows">
                        {ingredients.map((ingredient, index) => (
                            <div className="ingredient-row" key={index}>
                                <label>
                                    <span>Name</span>
                                    <input
                                        name="name"
                                        type="text"
                                        value={ingredient.name}
                                        onChange={(event) => handleIngredientChange(index, event)}
                                    />
                                </label>
                                <label>
                                    <span>Quantity</span>
                                    <input
                                        name="quantity"
                                        type="text"
                                        value={ingredient.quantity}
                                        onChange={(event) => handleIngredientChange(index, event)}
                                    />
                                </label>
                                <label>
                                    <span>Unit</span>
                                    <input
                                        name="unit"
                                        type="text"
                                        value={ingredient.unit}
                                        onChange={(event) => handleIngredientChange(index, event)}
                                    />
                                </label>
                                {ingredients.length > 1 && (
                                    <button
                                        type="button"
                                        className="remove-ingredient-button"
                                        onClick={() => removeIngredient(index)}
                                        aria-label="Remove ingredient"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                <label>
                    <span>Instructions</span>
                    <textarea
                        name="instructions"
                        value={formData.instructions}
                        onChange={handleChange}
                        rows="7"
                    />
                </label>

                {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}

                <button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Save Recipe"}
                </button>
            </form>
            )}
        </main>
    );
}

export default CreateRecipe;
