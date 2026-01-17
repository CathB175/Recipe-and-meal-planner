// ============================================================================
// SUPABASE CONFIGURATION
// ============================================================================
// IMPORTANT: Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://hebuaabantmnfdxxkaif.supabase.co';
const SUPABASE_KEY = 'sb_publishable_xzVfo0l-eLpkP4TuUy17KQ_kLLUUScF';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================================
// RECIPE MANAGER CLASS
// ============================================================================
class RecipeManager {
    constructor() {
        this.recipes = [];
        this.quickFoods = [];
        this.mealPlans = [];
        this.dailyExtras = [];
        this.nutritionGoals = null;
        this.currentWeekStart = this.getWeekStart(new Date());
        this.selectedMealSlot = null;
        this.editingRecipe = null;
        
        this.init();
    }

    // ========================================================================
    // INITIALIZATION
    // ========================================================================
    async init() {
        this.setupEventListeners();
        this.updateSyncStatus('syncing');
        
        try {
            await this.loadAllData();
            this.updateSyncStatus('synced');
            this.renderRecipes();
            this.renderMealPlanner();
            this.renderQuickFoods();
            this.renderNutritionGoals();
        } catch (error) {
            console.error('Initialization error:', error);
            this.updateSyncStatus('error');
            this.showNotification('Failed to load data. Please refresh the page.', 'error');
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchView(btn.dataset.view));
        });

        // Recipe Management
        document.getElementById('add-recipe-btn').addEventListener('click', () => this.openRecipeModal());
        document.getElementById('recipe-form').addEventListener('submit', (e) => this.handleRecipeSubmit(e));
        document.getElementById('recipe-search').addEventListener('input', (e) => this.filterRecipes(e.target.value));
        document.getElementById('collection-filter').addEventListener('change', (e) => this.filterByCollection(e.target.value));
        
        // Recipe type toggle
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.addEventListener('click', () => this.filterByType(btn.dataset.type));
        });

        // Recipe type radio buttons
        document.querySelectorAll('input[name="recipe-type"]').forEach(radio => {
            radio.addEventListener('change', () => this.toggleRecipeTypeFields());
        });

        // Quick Foods
        document.getElementById('add-quick-food-btn').addEventListener('click', () => this.openQuickFoodModal());
        document.getElementById('quick-food-form').addEventListener('submit', (e) => this.handleQuickFoodSubmit(e));

        // Meal Planner
        document.getElementById('prev-week').addEventListener('click', () => this.changeWeek(-1));
        document.getElementById('next-week').addEventListener('click', () => this.changeWeek(1));
        document.getElementById('today-btn').addEventListener('click', () => this.goToToday());
        document.getElementById('save-meal-btn').addEventListener('click', () => this.saveMeal());
        
        // Meal modal type selector
        document.querySelectorAll('.meal-type-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchMealInputType(btn.dataset.type));
        });
        
        document.getElementById('meal-recipe-search').addEventListener('input', (e) => this.filterMealRecipes(e.target.value));

        // Nutrition Goals
        document.getElementById('goals-form').addEventListener('submit', (e) => this.handleGoalsSubmit(e));

        // Modal controls
        document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });

        // Close modal on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModals();
            });
        });
    }

    // ========================================================================
    // DATA LOADING FROM SUPABASE
    // ========================================================================
    async loadAllData() {
        await Promise.all([
            this.loadRecipes(),
            this.loadQuickFoods(),
            this.loadMealPlans(),
            this.loadDailyExtras(),
            this.loadNutritionGoals()
        ]);
    }

    async loadRecipes() {
        try {
            const { data, error } = await supabase
                .from('recipes')
                .select('*')
                .order('name');

            if (error) throw error;
            this.recipes = data || [];
            this.updateCollectionFilter();
        } catch (error) {
            console.error('Error loading recipes:', error);
            throw error;
        }
    }

    async loadQuickFoods() {
        try {
            const { data, error } = await supabase
                .from('quick_foods')
                .select('*')
                .order('name');

            if (error) throw error;
            this.quickFoods = data || [];
        } catch (error) {
            console.error('Error loading quick foods:', error);
            throw error;
        }
    }

    async loadMealPlans() {
        try {
            const { data, error } = await supabase
                .from('meal_plans')
                .select('*')
                .order('date, meal_type');

            if (error) throw error;
            this.mealPlans = data || [];
        } catch (error) {
            console.error('Error loading meal plans:', error);
            throw error;
        }
    }

    async loadDailyExtras() {
        try {
            const { data, error } = await supabase
                .from('daily_extras')
                .select('*')
                .order('date, created_at');

            if (error) throw error;
            this.dailyExtras = data || [];
        } catch (error) {
            console.error('Error loading daily extras:', error);
            throw error;
        }
    }

    async loadNutritionGoals() {
        try {
            const { data, error } = await supabase
                .from('nutrition_goals')
                .select('*')
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
            this.nutritionGoals = data;
        } catch (error) {
            console.error('Error loading nutrition goals:', error);
            throw error;
        }
    }

    // ========================================================================
    // RECIPE MANAGEMENT
    // ========================================================================
    openRecipeModal(recipe = null) {
        this.editingRecipe = recipe;
        const modal = document.getElementById('recipe-modal');
        const title = document.getElementById('modal-title');
        const form = document.getElementById('recipe-form');
        
        form.reset();
        title.textContent = recipe ? 'Edit Recipe' : 'Add Recipe';
        
        if (recipe) {
            document.getElementById('recipe-name').value = recipe.name || '';
            document.getElementById('recipe-servings').value = recipe.servings || 4;
            document.getElementById('recipe-prep').value = recipe.prep_time || '';
            document.getElementById('recipe-cook').value = recipe.cook_time || '';
            document.getElementById('recipe-source').value = recipe.source || '';
            document.getElementById('recipe-image').value = recipe.image_url || '';
            document.getElementById('recipe-collections').value = recipe.collections?.join(', ') || '';
            document.getElementById('recipe-keywords').value = recipe.keywords?.join(', ') || '';
            document.getElementById('recipe-notes').value = recipe.notes || '';
            
            // Set recipe type
            const isSimple = recipe.is_simple || false;
            document.querySelector(`input[name="recipe-type"][value="${isSimple ? 'simple' : 'detailed'}"]`).checked = true;
            this.toggleRecipeTypeFields();
            
            // Ingredients and steps
            if (recipe.ingredients) {
                document.getElementById('recipe-ingredients').value = recipe.ingredients.join('\n');
            }
            if (recipe.steps) {
                document.getElementById('recipe-steps').value = recipe.steps.join('\n');
            }
            
            // Nutrition
            if (recipe.nutrition) {
                document.getElementById('recipe-calories').value = recipe.nutrition.calories || '';
                document.getElementById('recipe-protein').value = recipe.nutrition.protein || '';
                document.getElementById('recipe-carbs').value = recipe.nutrition.carbs || '';
                document.getElementById('recipe-fat').value = recipe.nutrition.fat || '';
                document.getElementById('recipe-fiber').value = recipe.nutrition.fiber || '';
                document.getElementById('recipe-sugar').value = recipe.nutrition.sugar || '';
            }
        } else {
            document.querySelector('input[name="recipe-type"][value="detailed"]').checked = true;
            this.toggleRecipeTypeFields();
        }
        
        modal.classList.add('active');
    }

    toggleRecipeTypeFields() {
        const isSimple = document.querySelector('input[name="recipe-type"]:checked').value === 'simple';
        const detailedFields = document.getElementById('detailed-fields');
        
        detailedFields.style.display = isSimple ? 'none' : 'block';
    }

    async handleRecipeSubmit(e) {
        e.preventDefault();
        this.updateSyncStatus('syncing');
        
        const isSimple = document.querySelector('input[name="recipe-type"]:checked').value === 'simple';
        
        const recipeData = {
            name: document.getElementById('recipe-name').value.trim(),
            is_simple: isSimple,
            servings: isSimple ? 1 : parseInt(document.getElementById('recipe-servings').value) || 4,
            prep_time: isSimple ? null : parseInt(document.getElementById('recipe-prep').value) || null,
            cook_time: isSimple ? null : parseInt(document.getElementById('recipe-cook').value) || null,
            source: isSimple ? null : document.getElementById('recipe-source').value.trim() || null,
            image_url: isSimple ? null : document.getElementById('recipe-image').value.trim() || null,
            collections: isSimple ? [] : this.parseCommaSeparated(document.getElementById('recipe-collections').value),
            keywords: isSimple ? [] : this.parseCommaSeparated(document.getElementById('recipe-keywords').value),
            ingredients: isSimple ? [] : this.parseLines(document.getElementById('recipe-ingredients').value),
            steps: isSimple ? [] : this.parseLines(document.getElementById('recipe-steps').value),
            notes: isSimple ? null : document.getElementById('recipe-notes').value.trim() || null,
            nutrition: {
                calories: parseFloat(document.getElementById('recipe-calories').value) || 0,
                protein: parseFloat(document.getElementById('recipe-protein').value) || 0,
                carbs: parseFloat(document.getElementById('recipe-carbs').value) || 0,
                fat: parseFloat(document.getElementById('recipe-fat').value) || 0,
                fiber: parseFloat(document.getElementById('recipe-fiber').value) || 0,
                sugar: parseFloat(document.getElementById('recipe-sugar').value) || 0
            }
        };

        try {
            let result;
            if (this.editingRecipe) {
                // Update existing recipe
                result = await supabase
                    .from('recipes')
                    .update(recipeData)
                    .eq('id', this.editingRecipe.id)
                    .select()
                    .single();
            } else {
                // Insert new recipe
                result = await supabase
                    .from('recipes')
                    .insert([recipeData])
                    .select()
                    .single();
            }

            if (result.error) throw result.error;

            await this.loadRecipes();
            this.renderRecipes();
            this.closeModals();
            this.updateSyncStatus('synced');
            this.showNotification(this.editingRecipe ? 'Recipe updated!' : 'Recipe added!', 'success');
        } catch (error) {
            console.error('Error saving recipe:', error);
            this.updateSyncStatus('error');
            this.showNotification('Failed to save recipe. Please try again.', 'error');
        }
    }

    async deleteRecipe(id) {
        if (!confirm('Are you sure you want to delete this recipe?')) return;
        
        this.updateSyncStatus('syncing');
        
        try {
            const { error } = await supabase
                .from('recipes')
                .delete()
                .eq('id', id);

            if (error) throw error;

            await this.loadRecipes();
            this.renderRecipes();
            this.updateSyncStatus('synced');
            this.showNotification('Recipe deleted!', 'success');
        } catch (error) {
            console.error('Error deleting recipe:', error);
            this.updateSyncStatus('error');
            this.showNotification('Failed to delete recipe.', 'error');
        }
    }

    renderRecipes() {
        const container = document.getElementById('recipes-list');
        
        if (this.recipes.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No recipes yet. Add your first recipe!</p></div>';
            return;
        }

        container.innerHTML = this.recipes.map(recipe => `
            <div class="recipe-card" data-recipe-id="${recipe.id}">
                ${recipe.image_url ? `<img src="${recipe.image_url}" alt="${recipe.name}" class="recipe-card-image">` : ''}
                <div class="recipe-card-content">
                    <div class="recipe-card-header">
                        <div>
                            <h3 class="recipe-card-name">${recipe.name}</h3>
                            ${recipe.collections?.length ? `<div style="font-size: 0.813rem; color: var(--text-tertiary);">${recipe.collections.join(', ')}</div>` : ''}
                        </div>
                        <span class="recipe-type-badge ${recipe.is_simple ? 'simple' : ''}">${recipe.is_simple ? 'Simple' : 'Detailed'}</span>
                    </div>
                    ${!recipe.is_simple && (recipe.prep_time || recipe.cook_time) ? `
                        <div class="recipe-card-meta">
                            ${recipe.prep_time ? `<span>⏱️ Prep: ${recipe.prep_time}m</span>` : ''}
                            ${recipe.cook_time ? `<span>🔥 Cook: ${recipe.cook_time}m</span>` : ''}
                            ${recipe.servings ? `<span>🍽️ Serves: ${recipe.servings}</span>` : ''}
                        </div>
                    ` : ''}
                    ${recipe.nutrition ? `
                        <div class="recipe-card-nutrition">
                            <div class="nutrition-item">
                                <span class="nutrition-label">Calories</span>
                                <span class="nutrition-value">${recipe.nutrition.calories || 0}</span>
                            </div>
                            <div class="nutrition-item">
                                <span class="nutrition-label">Protein</span>
                                <span class="nutrition-value">${recipe.nutrition.protein || 0}g</span>
                            </div>
                            <div class="nutrition-item">
                                <span class="nutrition-label">Carbs</span>
                                <span class="nutrition-value">${recipe.nutrition.carbs || 0}g</span>
                            </div>
                            <div class="nutrition-item">
                                <span class="nutrition-label">Fat</span>
                                <span class="nutrition-value">${recipe.nutrition.fat || 0}g</span>
                            </div>
                        </div>
                    ` : ''}
                    <div class="recipe-card-actions">
                        <button onclick="recipeManager.openRecipeModal(recipeManager.recipes.find(r => r.id === '${recipe.id}'))">Edit</button>
                        ${!recipe.is_simple ? `<button onclick="recipeManager.viewRecipeDetail('${recipe.id}')">View</button>` : ''}
                        <button onclick="recipeManager.deleteRecipe('${recipe.id}')">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    viewRecipeDetail(id) {
        const recipe = this.recipes.find(r => r.id === id);
        if (!recipe) return;

        const modal = document.getElementById('recipe-detail-modal');
        document.getElementById('detail-recipe-name').textContent = recipe.name;
        
        const content = document.getElementById('recipe-detail-content');
        content.innerHTML = `
            ${recipe.image_url ? `<img src="${recipe.image_url}" alt="${recipe.name}" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 8px; margin-bottom: var(--space-lg);">` : ''}
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: var(--space-md); margin-bottom: var(--space-lg);">
                ${recipe.servings ? `<div><strong>Servings:</strong> ${recipe.servings}</div>` : ''}
                ${recipe.prep_time ? `<div><strong>Prep:</strong> ${recipe.prep_time} min</div>` : ''}
                ${recipe.cook_time ? `<div><strong>Cook:</strong> ${recipe.cook_time} min</div>` : ''}
            </div>

            ${recipe.ingredients?.length ? `
                <h4 style="font-family: var(--font-display); font-size: 1.25rem; margin-bottom: var(--space-md);">Ingredients</h4>
                <ul style="margin-bottom: var(--space-xl); padding-left: var(--space-lg);">
                    ${recipe.ingredients.map(ing => `<li style="margin-bottom: var(--space-sm);">${ing}</li>`).join('')}
                </ul>
            ` : ''}

            ${recipe.steps?.length ? `
                <h4 style="font-family: var(--font-display); font-size: 1.25rem; margin-bottom: var(--space-md);">Instructions</h4>
                <ol style="margin-bottom: var(--space-xl); padding-left: var(--space-lg);">
                    ${recipe.steps.map(step => `<li style="margin-bottom: var(--space-md);">${step}</li>`).join('')}
                </ol>
            ` : ''}

            ${recipe.nutrition ? `
                <h4 style="font-family: var(--font-display); font-size: 1.25rem; margin-bottom: var(--space-md);">Nutrition (per serving)</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: var(--space-md); margin-bottom: var(--space-lg);">
                    <div><strong>Calories:</strong> ${recipe.nutrition.calories || 0}</div>
                    <div><strong>Protein:</strong> ${recipe.nutrition.protein || 0}g</div>
                    <div><strong>Carbs:</strong> ${recipe.nutrition.carbs || 0}g</div>
                    <div><strong>Fat:</strong> ${recipe.nutrition.fat || 0}g</div>
                    <div><strong>Fiber:</strong> ${recipe.nutrition.fiber || 0}g</div>
                    <div><strong>Sugar:</strong> ${recipe.nutrition.sugar || 0}g</div>
                </div>
            ` : ''}

            ${recipe.notes ? `
                <h4 style="font-family: var(--font-display); font-size: 1.25rem; margin-bottom: var(--space-md);">Notes</h4>
                <p style="color: var(--text-secondary);">${recipe.notes}</p>
            ` : ''}

            ${recipe.source ? `
                <div style="margin-top: var(--space-lg); padding-top: var(--space-lg); border-top: 1px solid var(--border-light);">
                    <strong>Source:</strong> <a href="${recipe.source}" target="_blank" style="color: var(--accent-primary);">${recipe.source}</a>
                </div>
            ` : ''}
        `;

        modal.classList.add('active');
    }

    filterRecipes(searchTerm) {
        const cards = document.querySelectorAll('.recipe-card');
        const term = searchTerm.toLowerCase();

        cards.forEach(card => {
            const recipe = this.recipes.find(r => r.id === card.dataset.recipeId);
            const matches = recipe.name.toLowerCase().includes(term) ||
                          recipe.keywords?.some(k => k.toLowerCase().includes(term)) ||
                          recipe.collections?.some(c => c.toLowerCase().includes(term));
            
            card.style.display = matches ? '' : 'none';
        });
    }

    filterByCollection(collection) {
        const cards = document.querySelectorAll('.recipe-card');

        cards.forEach(card => {
            const recipe = this.recipes.find(r => r.id === card.dataset.recipeId);
            const matches = !collection || recipe.collections?.includes(collection);
            card.style.display = matches ? '' : 'none';
        });
    }

    filterByType(type) {
        // Update active button
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });

        const cards = document.querySelectorAll('.recipe-card');

        cards.forEach(card => {
            const recipe = this.recipes.find(r => r.id === card.dataset.recipeId);
            let matches = true;

            if (type === 'detailed') {
                matches = !recipe.is_simple;
            } else if (type === 'simple') {
                matches = recipe.is_simple;
            }

            card.style.display = matches ? '' : 'none';
        });
    }

    updateCollectionFilter() {
        const select = document.getElementById('collection-filter');
        const collections = new Set();
        
        this.recipes.forEach(recipe => {
            recipe.collections?.forEach(c => collections.add(c));
        });

        select.innerHTML = '<option value="">All Collections</option>' +
            Array.from(collections).sort().map(c => `<option value="${c}">${c}</option>`).join('');
    }

    // ========================================================================
    // QUICK FOODS MANAGEMENT
    // ========================================================================
    openQuickFoodModal() {
        document.getElementById('quick-food-form').reset();
        document.getElementById('quick-food-modal').classList.add('active');
    }

    async handleQuickFoodSubmit(e) {
        e.preventDefault();
        this.updateSyncStatus('syncing');

        const foodData = {
            name: document.getElementById('qf-name').value.trim(),
            calories: parseFloat(document.getElementById('qf-calories').value) || 0,
            protein: parseFloat(document.getElementById('qf-protein').value) || 0,
            carbs: parseFloat(document.getElementById('qf-carbs').value) || 0,
            fat: parseFloat(document.getElementById('qf-fat').value) || 0
        };

        try {
            const { error } = await supabase
                .from('quick_foods')
                .insert([foodData]);

            if (error) throw error;

            await this.loadQuickFoods();
            this.renderQuickFoods();
            this.closeModals();
            this.updateSyncStatus('synced');
            this.showNotification('Quick food added!', 'success');
        } catch (error) {
            console.error('Error saving quick food:', error);
            this.updateSyncStatus('error');
            this.showNotification('Failed to save quick food.', 'error');
        }
    }

    async deleteQuickFood(id) {
        if (!confirm('Delete this quick food?')) return;
        
        this.updateSyncStatus('syncing');

        try {
            const { error } = await supabase
                .from('quick_foods')
                .delete()
                .eq('id', id);

            if (error) throw error;

            await this.loadQuickFoods();
            this.renderQuickFoods();
            this.updateSyncStatus('synced');
            this.showNotification('Quick food deleted!', 'success');
        } catch (error) {
            console.error('Error deleting quick food:', error);
            this.updateSyncStatus('error');
            this.showNotification('Failed to delete quick food.', 'error');
        }
    }

    renderQuickFoods() {
        const container = document.getElementById('quick-foods-list');

        if (this.quickFoods.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No quick foods yet. Add your favorites!</p></div>';
            return;
        }

        container.innerHTML = this.quickFoods.map(food => `
            <div class="quick-food-card">
                <h3 class="quick-food-name">${food.name}</h3>
                <div class="quick-food-nutrition">
                    <div class="nutrition-item">
                        <span class="nutrition-label">Calories</span>
                        <span class="nutrition-value">${food.calories}</span>
                    </div>
                    <div class="nutrition-item">
                        <span class="nutrition-label">Protein</span>
                        <span class="nutrition-value">${food.protein}g</span>
                    </div>
                    <div class="nutrition-item">
                        <span class="nutrition-label">Carbs</span>
                        <span class="nutrition-value">${food.carbs || 0}g</span>
                    </div>
                    <div class="nutrition-item">
                        <span class="nutrition-label">Fat</span>
                        <span class="nutrition-value">${food.fat || 0}g</span>
                    </div>
                </div>
                <div class="quick-food-actions">
                    <button onclick="recipeManager.addQuickFoodToDay('${food.id}')">Add to Day</button>
                    <button onclick="recipeManager.deleteQuickFood('${food.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    }

    // ========================================================================
    // MEAL PLANNING
    // ========================================================================
    changeWeek(direction) {
        const newDate = new Date(this.currentWeekStart);
        newDate.setDate(newDate.getDate() + (direction * 7));
        this.currentWeekStart = this.getWeekStart(newDate);
        this.renderMealPlanner();
    }

    goToToday() {
        this.currentWeekStart = this.getWeekStart(new Date());
        this.renderMealPlanner();
    }

    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
        return new Date(d.setDate(diff));
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    renderMealPlanner() {
        const weekDisplay = document.getElementById('week-display');
        const grid = document.getElementById('meal-planner-grid');
        
        const endDate = new Date(this.currentWeekStart);
        endDate.setDate(endDate.getDate() + 6);
        
        weekDisplay.textContent = `${this.currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

        const days = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(this.currentWeekStart);
            date.setDate(date.getDate() + i);
            days.push(date);
        }

        grid.innerHTML = days.map(date => this.renderDaySection(date)).join('');
    }

    renderDaySection(date) {
        const dateStr = this.formatDate(date);
        const isToday = this.formatDate(new Date()) === dateStr;
        
        const dayMeals = this.mealPlans.filter(m => m.date === dateStr);
        const dayExtras = this.dailyExtras.filter(e => e.date === dateStr);
        
        const totalNutrition = this.calculateDayNutrition(dayMeals, dayExtras);

        return `
            <div class="day-section">
                <div class="day-header ${isToday ? 'today' : ''}">
                    <div>
                        <div class="day-name">${date.toLocaleDateString('en-US', { weekday: 'long' })}</div>
                        <div class="day-date">${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    </div>
                    <div class="day-nutrition">
                        <div class="day-nutrition-item">
                            <span class="day-nutrition-label">Calories</span>
                            <span class="day-nutrition-value">${totalNutrition.calories}</span>
                        </div>
                        <div class="day-nutrition-item">
                            <span class="day-nutrition-label">Protein</span>
                            <span class="day-nutrition-value">${totalNutrition.protein}g</span>
                        </div>
                    </div>
                </div>
                
                <div class="meals-container">
                    ${this.renderMealSlot(dateStr, 'breakfast', dayMeals)}
                    ${this.renderMealSlot(dateStr, 'lunch', dayMeals)}
                    ${this.renderMealSlot(dateStr, 'dinner', dayMeals)}
                </div>

                ${dayExtras.length > 0 || true ? `
                    <div class="extras-section">
                        <div class="extras-header">
                            <span class="extras-label">Daily Extras</span>
                            <button class="btn-secondary" style="padding: var(--space-xs) var(--space-sm); font-size: 0.813rem;" onclick="recipeManager.showQuickFoodSelector('${dateStr}')">+ Add Extra</button>
                        </div>
                        <div class="extras-list">
                            ${dayExtras.map(extra => `
                                <div class="extra-item">
                                    <div class="extra-info">
                                        <span class="extra-name">${extra.name}</span>
                                        <span class="extra-nutrition">${extra.calories} cal • ${extra.protein}g protein</span>
                                    </div>
                                    <button class="extra-remove" onclick="recipeManager.removeExtra('${extra.id}')">Remove</button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderMealSlot(date, mealType, dayMeals) {
        const meal = dayMeals.find(m => m.meal_type === mealType);
        const mealTypeLabel = mealType.charAt(0).toUpperCase() + mealType.slice(1);

        if (!meal) {
            return `
                <div class="meal-slot">
                    <div class="meal-type-label">${mealTypeLabel}</div>
                    <button class="add-meal-btn" onclick="recipeManager.openMealModal('${date}', '${mealType}')">+ Add Meal</button>
                </div>
            `;
        }

        let mealName = '';
        let nutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 };

        if (meal.data_type === 'recipe' && meal.recipe_id) {
            const recipe = this.recipes.find(r => r.id === meal.recipe_id);
            if (recipe) {
                mealName = recipe.name;
                nutrition = recipe.nutrition || nutrition;
            } else {
                mealName = 'Recipe not found';
            }
        } else if (meal.data_type === 'custom') {
            mealName = meal.custom_text || 'Custom meal';
        }

        return `
            <div class="meal-slot has-meal">
                <div class="meal-type-label">${mealTypeLabel}</div>
                <div class="meal-content">
                    <div class="meal-name">${mealName}</div>
                    ${meal.data_type === 'recipe' ? `
                        <div class="meal-nutrition">
                            <span>${nutrition.calories} cal</span>
                            <span>${nutrition.protein}g protein</span>
                        </div>
                    ` : ''}
                </div>
                <div class="meal-actions">
                    <button onclick="recipeManager.removeMeal('${meal.id}')">Remove</button>
                </div>
            </div>
        `;
    }

    calculateDayNutrition(dayMeals, dayExtras) {
        let calories = 0;
        let protein = 0;

        dayMeals.forEach(meal => {
            if (meal.data_type === 'recipe' && meal.recipe_id) {
                const recipe = this.recipes.find(r => r.id === meal.recipe_id);
                if (recipe?.nutrition) {
                    calories += recipe.nutrition.calories || 0;
                    protein += recipe.nutrition.protein || 0;
                }
            }
        });

        dayExtras.forEach(extra => {
            calories += extra.calories || 0;
            protein += extra.protein || 0;
        });

        return {
            calories: Math.round(calories),
            protein: Math.round(protein)
        };
    }

    openMealModal(date, mealType) {
        this.selectedMealSlot = { date, mealType };
        const modal = document.getElementById('meal-modal');
        const title = document.getElementById('meal-modal-title');
        
        title.textContent = `Add ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`;
        
        // Reset to recipe view
        this.switchMealInputType('recipe');
        this.renderMealRecipesList();
        
        modal.classList.add('active');
    }

    switchMealInputType(type) {
        document.querySelectorAll('.meal-type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });

        document.getElementById('recipe-selector').style.display = type === 'recipe' ? '' : 'none';
        document.getElementById('custom-selector').style.display = type === 'custom' ? '' : 'none';
    }

    renderMealRecipesList(searchTerm = '') {
        const container = document.getElementById('meal-recipes-list');
        const term = searchTerm.toLowerCase();

        const filteredRecipes = this.recipes.filter(r => 
            !term || r.name.toLowerCase().includes(term)
        );

        if (filteredRecipes.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No recipes found</p></div>';
            return;
        }

        container.innerHTML = filteredRecipes.map(recipe => `
            <div class="meal-recipe-item" data-recipe-id="${recipe.id}" onclick="recipeManager.selectMealRecipe('${recipe.id}')">
                <div class="meal-recipe-info">
                    <h4>${recipe.name}</h4>
                    ${recipe.nutrition ? `
                        <div class="meal-recipe-nutrition">${recipe.nutrition.calories} cal • ${recipe.nutrition.protein}g protein</div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    selectMealRecipe(recipeId) {
        document.querySelectorAll('.meal-recipe-item').forEach(item => {
            item.classList.toggle('selected', item.dataset.recipeId === recipeId);
        });
    }

    filterMealRecipes(searchTerm) {
        this.renderMealRecipesList(searchTerm);
    }

    async saveMeal() {
        if (!this.selectedMealSlot) return;

        const activeType = document.querySelector('.meal-type-btn.active').dataset.type;
        let mealData = {
            date: this.selectedMealSlot.date,
            meal_type: this.selectedMealSlot.mealType,
            data_type: activeType
        };

        if (activeType === 'recipe') {
            const selectedItem = document.querySelector('.meal-recipe-item.selected');
            if (!selectedItem) {
                alert('Please select a recipe');
                return;
            }
            mealData.recipe_id = selectedItem.dataset.recipeId;
            mealData.custom_text = null;
        } else {
            const customText = document.getElementById('custom-meal-text').value.trim();
            if (!customText) {
                alert('Please enter a meal description');
                return;
            }
            mealData.recipe_id = null;
            mealData.custom_text = customText;
        }

        this.updateSyncStatus('syncing');

        try {
            const { error } = await supabase
                .from('meal_plans')
                .insert([mealData]);

            if (error) throw error;

            await this.loadMealPlans();
            this.renderMealPlanner();
            this.closeModals();
            this.updateSyncStatus('synced');
            this.showNotification('Meal added!', 'success');
        } catch (error) {
            console.error('Error saving meal:', error);
            this.updateSyncStatus('error');
            this.showNotification('Failed to save meal.', 'error');
        }
    }

    async removeMeal(mealId) {
        this.updateSyncStatus('syncing');

        try {
            const { error } = await supabase
                .from('meal_plans')
                .delete()
                .eq('id', mealId);

            if (error) throw error;

            await this.loadMealPlans();
            this.renderMealPlanner();
            this.updateSyncStatus('synced');
        } catch (error) {
            console.error('Error removing meal:', error);
            this.updateSyncStatus('error');
            this.showNotification('Failed to remove meal.', 'error');
        }
    }

    // ========================================================================
    // DAILY EXTRAS
    // ========================================================================
    async showQuickFoodSelector(date) {
        // Simple approach: show all quick foods in a confirm/prompt
        if (this.quickFoods.length === 0) {
            alert('No quick foods available. Add some quick foods first!');
            return;
        }

        const foodList = this.quickFoods.map((f, i) => `${i + 1}. ${f.name} (${f.calories} cal, ${f.protein}g protein)`).join('\n');
        const selection = prompt(`Select a quick food to add to ${date}:\n\n${foodList}\n\nEnter the number:`);
        
        if (selection) {
            const index = parseInt(selection) - 1;
            if (index >= 0 && index < this.quickFoods.length) {
                await this.addQuickFoodToDay(this.quickFoods[index].id, date);
            }
        }
    }

    async addQuickFoodToDay(foodId, dateOverride = null) {
        const food = this.quickFoods.find(f => f.id === foodId);
        if (!food) return;

        let date = dateOverride;
        if (!date) {
            date = prompt('Enter date (YYYY-MM-DD) or leave blank for today:');
            if (date === null) return;
            if (!date) date = this.formatDate(new Date());
        }

        this.updateSyncStatus('syncing');

        try {
            const extraData = {
                date: date,
                name: food.name,
                calories: food.calories,
                protein: food.protein
            };

            const { error } = await supabase
                .from('daily_extras')
                .insert([extraData]);

            if (error) throw error;

            await this.loadDailyExtras();
            this.renderMealPlanner();
            this.updateSyncStatus('synced');
            this.showNotification('Quick food added to day!', 'success');
        } catch (error) {
            console.error('Error adding extra:', error);
            this.updateSyncStatus('error');
            this.showNotification('Failed to add extra.', 'error');
        }
    }

    async removeExtra(extraId) {
        this.updateSyncStatus('syncing');

        try {
            const { error } = await supabase
                .from('daily_extras')
                .delete()
                .eq('id', extraId);

            if (error) throw error;

            await this.loadDailyExtras();
            this.renderMealPlanner();
            this.updateSyncStatus('synced');
        } catch (error) {
            console.error('Error removing extra:', error);
            this.updateSyncStatus('error');
            this.showNotification('Failed to remove extra.', 'error');
        }
    }

    // ========================================================================
    // NUTRITION GOALS
    // ========================================================================
    renderNutritionGoals() {
        if (this.nutritionGoals) {
            document.getElementById('goal-calories').value = this.nutritionGoals.calories || '';
            document.getElementById('goal-protein').value = this.nutritionGoals.protein || '';
            document.getElementById('goal-carbs').value = this.nutritionGoals.carbs || '';
            document.getElementById('goal-fat').value = this.nutritionGoals.fat || '';
            document.getElementById('goal-fiber').value = this.nutritionGoals.fiber || '';
            document.getElementById('goal-sugar').value = this.nutritionGoals.sugar || '';
        }
    }

    async handleGoalsSubmit(e) {
        e.preventDefault();
        this.updateSyncStatus('syncing');

        const goalsData = {
            calories: parseFloat(document.getElementById('goal-calories').value) || null,
            protein: parseFloat(document.getElementById('goal-protein').value) || null,
            carbs: parseFloat(document.getElementById('goal-carbs').value) || null,
            fat: parseFloat(document.getElementById('goal-fat').value) || null,
            fiber: parseFloat(document.getElementById('goal-fiber').value) || null,
            sugar: parseFloat(document.getElementById('goal-sugar').value) || null
        };

        try {
            // Delete existing goals first (since we only want one row)
            await supabase.from('nutrition_goals').delete().neq('id', 0);
            
            // Insert new goals
            const { error } = await supabase
                .from('nutrition_goals')
                .insert([goalsData]);

            if (error) throw error;

            await this.loadNutritionGoals();
            this.updateSyncStatus('synced');
            this.showNotification('Nutrition goals saved!', 'success');
        } catch (error) {
            console.error('Error saving goals:', error);
            this.updateSyncStatus('error');
            this.showNotification('Failed to save goals.', 'error');
        }
    }

    // ========================================================================
    // UTILITY FUNCTIONS
    // ========================================================================
    switchView(viewName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewName);
        });

        // Update sections
        document.querySelectorAll('.view-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${viewName}-view`).classList.add('active');
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        this.selectedMealSlot = null;
        this.editingRecipe = null;
    }

    updateSyncStatus(status) {
        const indicator = document.getElementById('sync-status');
        indicator.className = `sync-status ${status}`;
    }

    showNotification(message, type = 'info') {
        // Simple alert for now - you can enhance this with a custom notification system
        if (type === 'error') {
            console.error(message);
        }
        // You could add a toast notification system here
    }

    parseCommaSeparated(str) {
        return str.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }

    parseLines(str) {
        return str.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    }
}

// ============================================================================
// INITIALIZE APP
// ============================================================================
let recipeManager;

document.addEventListener('DOMContentLoaded', () => {
    // Check if Supabase is configured
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_KEY === 'YOUR_SUPABASE_ANON_KEY') {
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; padding: 2rem; text-align: center; font-family: var(--font-body);">
                <div>
                    <h1 style="font-family: var(--font-display); color: var(--accent-primary); margin-bottom: 1rem;">Setup Required</h1>
                    <p style="color: var(--text-secondary); max-width: 500px;">Please configure your Supabase credentials in app.js:</p>
                    <pre style="background: var(--bg-secondary); padding: 1rem; margin: 1rem 0; border-radius: 8px; text-align: left;">
const SUPABASE_URL = 'your-project-url';
const SUPABASE_KEY = 'your-anon-key';
                    </pre>
                    <p style="color: var(--text-tertiary); font-size: 0.875rem;">Find these in your Supabase project settings.</p>
                </div>
            </div>
        `;
        return;
    }

    recipeManager = new RecipeManager();
});
