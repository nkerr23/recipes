import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

function CreateRecipe() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState(initialForm);
    const [categories, setCategories] = useState([]);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
    const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [ingredients, setIngredients] = useState([initialIngredient]);
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

    const selectedCategoryNames = categories
        .filter((category) => selectedCategoryIds.includes(category.id))
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
        const categoryId = Number(event.target.value);
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
            .select("id")
            .single();

        if (insertError) {
            throw insertError;
        }

        return newCategory.id;
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setErrorMessage("");

        const title = formData.title.trim();

        if (!title) {
            setErrorMessage("Title is required.");
            return;
        }

        setIsSaving(true);

        try {
            const imageUrl = await uploadRecipeImage();
            const recipe = {
                name: title,
                description: formData.description.trim() || null,
                image_url: imageUrl,
                prep_time: formData.prep_time.trim() || null,
                cook_time: formData.cook_time.trim() || null,
                servings: formData.servings.trim() || null,
                instructions: formData.instructions.trim() || null,
            };

            const { data, error } = await supabase
                .from("recipes")
                .insert(recipe)
                .select("id")
                .single();

            if (error) {
                throw error;
            }

            const newCategoryNames = formData.newCategory
                .split(",")
                .map((categoryName) => categoryName.trim())
                .filter(Boolean);
            let categoryIds = selectedCategoryIds;

            if (newCategoryNames.length > 0) {
                const newCategoryIds = await Promise.all(
                    newCategoryNames.map((categoryName) => findOrCreateCategory(categoryName))
                );
                categoryIds = [...categoryIds, ...newCategoryIds];
            }

            const uniqueCategoryIds = [...new Set(categoryIds)];

            if (uniqueCategoryIds.length > 0) {
                const { error: recipeCategoriesError } = await supabase
                    .from("recipe_categories")
                    .insert(uniqueCategoryIds.map((categoryId) => ({
                        recipe_id: data.id,
                        category_id: categoryId,
                    })));

                if (recipeCategoriesError) {
                    throw recipeCategoriesError;
                }
            }

            const ingredientRows = ingredients
                .map((ingredient, index) => ({
                    recipes_id: data.id,
                    name: ingredient.name.trim(),
                    quantity: ingredient.quantity.trim() || null,
                    unit: ingredient.unit.trim() || null,
                    sort_order: index + 1,
                }))
                .filter((ingredient) => ingredient.name);

            if (ingredientRows.length > 0) {
                const { error: ingredientsError } = await supabase
                    .from("ingredients")
                    .insert(ingredientRows);

                if (ingredientsError) {
                    throw ingredientsError;
                }
            }

            navigate(`/recipes/${data.id}`);
        } catch (error) {
            setErrorMessage(error.message);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <main className="create-recipe-page">
            <header className="create-recipe-header">
                <p className="eyebrow">Add to cookbook</p>
                <h1>Create Recipe</h1>
            </header>

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
                                                checked={selectedCategoryIds.includes(category.id)}
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
                    {isSaving ? "Saving..." : "Save Recipe"}
                </button>
            </form>
        </main>
    );
}

export default CreateRecipe;
