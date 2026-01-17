# Recipe Manager - Complete Cloud-Synced Solution

A beautiful, fully-featured recipe manager with cloud sync across all devices using Supabase.

## ✨ Features

### Core Functionality
- ✅ **Dual Recipe System**: Support for detailed recipes (with ingredients/steps) AND simple meal entries (just name + nutrition)
- ✅ **Complete Meal Planning**: Plan meals for the week with breakfast, lunch, and dinner slots
- ✅ **Quick Foods Library**: Save frequently eaten items (coffee, snacks, etc.) for quick logging
- ✅ **Daily Extras**: Add quick foods to specific days for snacks and extras
- ✅ **Nutrition Goals**: Set and track personal nutrition targets
- ✅ **Cloud Sync**: All data syncs across devices via Supabase - works on phone, tablet, and computer

### Recipe Features
- Search and filter recipes by name, keywords, or collections
- Filter by recipe type (detailed vs simple)
- Full recipe details with ingredients, steps, and nutrition
- Recipe collections and keywords for organization
- Image support for recipes
- Source/URL tracking

### Meal Planning Features
- Week-by-week navigation
- Daily nutrition totals
- Custom text entries for "eating out" etc.
- Quick recipe selection from your library
- Daily extras for snacks and supplemental items

## 🚀 Setup Instructions

### 1. Create Your Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Wait for the project to finish setting up

### 2. Create Database Tables

In your Supabase project, go to the SQL Editor and run these commands:

```sql
-- Recipes table
CREATE TABLE recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    is_simple BOOLEAN DEFAULT false,
    servings INTEGER DEFAULT 4,
    prep_time INTEGER,
    cook_time INTEGER,
    source TEXT,
    image_url TEXT,
    collections TEXT[] DEFAULT '{}',
    keywords TEXT[] DEFAULT '{}',
    ingredients JSONB DEFAULT '[]',
    steps JSONB DEFAULT '[]',
    notes TEXT,
    nutrition JSONB DEFAULT '{"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0, "sugar": 0}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quick foods table
CREATE TABLE quick_foods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    calories NUMERIC DEFAULT 0,
    protein NUMERIC DEFAULT 0,
    carbs NUMERIC DEFAULT 0,
    fat NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meal plans table
CREATE TABLE meal_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    meal_type TEXT NOT NULL, -- breakfast, lunch, dinner
    data_type TEXT NOT NULL, -- recipe, custom
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    custom_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily extras table
CREATE TABLE daily_extras (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    name TEXT NOT NULL,
    calories NUMERIC DEFAULT 0,
    protein NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Nutrition goals table
CREATE TABLE nutrition_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    calories NUMERIC,
    protein NUMERIC,
    carbs NUMERIC,
    fat NUMERIC,
    fiber NUMERIC,
    sugar NUMERIC,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_meal_plans_date ON meal_plans(date);
CREATE INDEX idx_daily_extras_date ON daily_extras(date);
```

### 3. Enable Row Level Security (RLS)

For now, we'll use simple policies. In Supabase SQL Editor, run:

```sql
-- Enable RLS on all tables
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_goals ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (for single-user setup)
-- For multi-user, you'll need to add authentication

CREATE POLICY "Allow all operations on recipes" ON recipes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on quick_foods" ON quick_foods FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on meal_plans" ON meal_plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on daily_extras" ON daily_extras FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on nutrition_goals" ON nutrition_goals FOR ALL USING (true) WITH CHECK (true);
```

### 4. Configure the App

1. In your Supabase project, go to **Settings** → **API**
2. Copy your **Project URL** and **anon public** key
3. Open `app.js` and replace these lines at the top:

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

### 5. Deploy

You can deploy this app in several ways:

**Option A: Simple HTTP Server (Local Testing)**
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server
```

**Option B: Deploy to Netlify**
1. Push your code to GitHub
2. Connect your repo to Netlify
3. Deploy (it's automatic!)

**Option C: Deploy to Vercel**
1. Push your code to GitHub
2. Import your repo to Vercel
3. Deploy

**Option D: Deploy to GitHub Pages**
1. Push your code to a GitHub repo
2. Go to Settings → Pages
3. Select your branch and save

## 📱 Using the App

### Managing Recipes

**Add a Detailed Recipe:**
1. Click "Add Recipe"
2. Select "Detailed Recipe"
3. Fill in name, servings, ingredients, steps, nutrition, etc.
4. Save

**Add a Simple Entry:**
1. Click "Add Recipe"
2. Select "Simple Entry"
3. Fill in just the name and nutrition
4. Save (no need for ingredients or steps)

**Use Cases for Simple Entries:**
- Restaurant meals: "Chipotle Bowl - 650 cal"
- Takeout: "Pizza Slice - 285 cal"
- Pre-packaged meals: "Frozen Burrito - 380 cal"

### Planning Meals

1. Navigate to "Meal Planner"
2. Use arrow buttons to browse weeks
3. Click "+ Add Meal" on any meal slot
4. Choose a recipe from your library OR enter custom text
5. View daily nutrition totals

### Quick Foods & Daily Extras

1. Go to "Quick Foods"
2. Add items you eat frequently (coffee, protein shake, etc.)
3. In the Meal Planner, click "+ Add Extra" for any day
4. Select a quick food to add it to that day

### Setting Nutrition Goals

1. Go to "Nutrition Goals"
2. Enter your daily targets
3. Compare against daily totals in the meal planner

## 🔧 Customization

### Changing Colors/Theme

Edit the CSS variables in `styles.css`:

```css
:root {
    --accent-primary: #b8845f; /* Main accent color */
    --accent-secondary: #8b6f47; /* Secondary accent */
    /* ... etc */
}
```

### Adding Features

The code is organized into clear sections:
- **Data Loading**: Lines ~100-200
- **Recipe Management**: Lines ~200-450
- **Quick Foods**: Lines ~450-550
- **Meal Planning**: Lines ~550-800
- **Daily Extras**: Lines ~800-900
- **Nutrition Goals**: Lines ~900-950

## 🐛 Troubleshooting

**"Setup Required" message on load:**
- Make sure you've replaced `SUPABASE_URL` and `SUPABASE_KEY` in `app.js`

**Red sync indicator:**
- Check browser console for errors
- Verify Supabase credentials
- Ensure RLS policies are set up correctly

**Data not syncing:**
- Check that all tables were created successfully
- Verify RLS policies allow access
- Check browser console for errors

## 📊 Database Schema

### recipes
- Stores both detailed recipes and simple meal entries
- `is_simple` flag distinguishes between types
- JSONB fields for ingredients, steps, and nutrition

### quick_foods
- Frequently eaten items
- Simple nutrition tracking

### meal_plans
- Links recipes or custom text to specific dates and meal types
- References recipes table via `recipe_id`

### daily_extras
- Quick foods added to specific dates
- Denormalized (stores name/nutrition directly for simplicity)

### nutrition_goals
- Single-row table for personal goals
- Can be expanded for daily goals or weekly goals

## 🚀 Future Enhancements

Potential features to add:
- Multi-user support with authentication
- Grocery list generation from meal plans
- Recipe scaling calculator
- Print-friendly recipe cards
- Recipe import from URLs
- Photo upload for recipes
- Meal prep mode (batch cooking)
- Progress tracking and charts
- Recipe ratings and favorites
- Barcode scanning for nutrition data

## 📄 License

MIT License - feel free to use and modify as needed!

## 🤝 Contributing

This is a personal project, but feel free to fork and customize for your own needs!
