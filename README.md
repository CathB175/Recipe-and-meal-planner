# RecipeFlow - Recipe & Nutrition Web App

A comprehensive recipe and nutrition management web application with Supabase backend integration and GitHub Pages deployment support.

## Features

✨ **Recipe Management**
- Full recipe details (ingredients, steps, nutrition, images)
- Simple meal entries (just name + nutrition, no ingredients/steps)
- Recipe scaling functionality
- Print-friendly recipe view
- Collections and keyword organization
- Search functionality
- Import/Export recipes via JSON

🍽️ **Meal Planning**
- 2-week rolling meal plan (starts from Monday)
- Three meals per day (breakfast, lunch, dinner)
- Recipe-based or custom text entries
- Daily extras tracking (snacks, beverages)
- Syncs across all devices via Supabase

🥤 **Quick Foods**
- Pre-defined snacks and beverages
- Quick nutrition logging
- Reusable entries

📊 **Dashboard**
- Today's meal plan overview
- Real-time nutrition tracking
- Progress toward daily goals

🛒 **Shopping List**
- Auto-generated from meal plan
- Consolidated ingredient list
- Interactive checklist

🎯 **Nutrition Goals**
- Personal calorie/protein targets
- Macronutrient tracking
- Daily progress monitoring

## Supabase Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key from Settings → API

### 2. Create Database Tables

Run these SQL commands in the Supabase SQL Editor:

```sql
-- Recipes table
CREATE TABLE recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  servings INTEGER DEFAULT 1,
  prep_time INTEGER,
  cook_time INTEGER,
  source TEXT,
  image_url TEXT,
  collections TEXT[],
  keywords TEXT[],
  ingredients JSONB,
  steps JSONB,
  notes TEXT,
  nutrition JSONB,
  is_simple BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quick foods table
CREATE TABLE quick_foods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  calories DECIMAL DEFAULT 0,
  protein DECIMAL DEFAULT 0,
  carbs DECIMAL DEFAULT 0,
  fat DECIMAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meal plans table
CREATE TABLE meal_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')),
  data_type TEXT NOT NULL CHECK (data_type IN ('recipe', 'custom')),
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
  calories DECIMAL DEFAULT 0,
  protein DECIMAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Nutrition goals table
CREATE TABLE nutrition_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  calories DECIMAL DEFAULT 2000,
  protein DECIMAL DEFAULT 150,
  carbs DECIMAL DEFAULT 250,
  fat DECIMAL DEFAULT 65,
  fiber DECIMAL DEFAULT 30,
  sugar DECIMAL DEFAULT 50,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_meal_plans_date ON meal_plans(date);
CREATE INDEX idx_daily_extras_date ON daily_extras(date);
CREATE INDEX idx_recipes_name ON recipes(name);
```

### 3. Enable Row Level Security (RLS)

For single-user deployment, you can use simple policies:

```sql
-- Enable RLS
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_goals ENABLE ROW LEVEL SECURITY;

-- Create policies (allows all operations for authenticated users)
CREATE POLICY "Allow all operations" ON recipes FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON quick_foods FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON meal_plans FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON daily_extras FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON nutrition_goals FOR ALL USING (true);
```

**Note:** For production with authentication, you should modify these policies to restrict access based on `auth.uid()`.

## GitHub Pages Deployment

### 1. Configure the App

Edit `recipe-nutrition-app.html` and replace these placeholders:

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

Replace with your actual Supabase credentials from the API settings.

### 2. Deploy to GitHub Pages

1. Create a new GitHub repository
2. Upload `recipe-nutrition-app.html` 
3. Rename it to `index.html` (GitHub Pages requires this name)
4. Go to repository Settings → Pages
5. Select the branch (usually `main`) as the source
6. Save and wait for deployment

Your app will be available at: `https://[your-username].github.io/[repo-name]/`

## Usage Guide

### Adding Recipes

**Full Recipe:**
1. Click "Add Recipe"
2. Fill in all details (name, times, ingredients, steps, nutrition)
3. Optionally add image URL, collections, keywords
4. Save

**Simple Meal Entry:**
1. Click "Add Recipe"
2. Toggle "Simple meal entry" ON
3. Only fill in name and nutrition
4. No ingredients/steps required
5. Save

### Meal Planning

1. Navigate to "Meal Planning"
2. View 2-week calendar starting from Monday
3. Click "+ Add Meal" on any meal slot
4. Choose a recipe or enter custom text (e.g., "Eating out")
5. Add daily extras (snacks, coffee) as needed

### Import/Export

**Export:**
- Click "Export" button in Recipes page
- Downloads `recipes-export.json` with all recipes

**Import:**
- Click "Import" button
- Select a JSON file
- All recipes will be added to your database

### Shopping List

- Automatically generates from your 2-week meal plan
- Consolidates duplicate ingredients
- Check off items as you shop

## Data Structure Examples

### Recipe with Ingredients (Full)
```json
{
  "name": "Chicken Stir Fry",
  "servings": 4,
  "prep_time": 15,
  "cook_time": 20,
  "is_simple": false,
  "ingredients": [
    { "amount": "500g", "item": "chicken breast" },
    { "amount": "2 cups", "item": "mixed vegetables" }
  ],
  "steps": [
    "Cut chicken into strips",
    "Stir fry chicken until golden",
    "Add vegetables and cook"
  ],
  "nutrition": {
    "calories": 350,
    "protein": 45,
    "carbs": 20,
    "fat": 10
  }
}
```

### Simple Meal Entry
```json
{
  "name": "Restaurant Meal",
  "servings": 1,
  "is_simple": true,
  "nutrition": {
    "calories": 800,
    "protein": 35,
    "carbs": 90,
    "fat": 30
  }
}
```

## Mobile Responsiveness

The app is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

All data syncs automatically via Supabase across all devices.

## Customization

### Colors & Theme

Edit the CSS variables in the `<style>` section:

```css
:root {
    --primary: #1a5f3d;      /* Main green color */
    --accent: #e67e22;       /* Orange accent */
    --bg: #faf8f5;          /* Background color */
    /* ... other colors */
}
```

### Fonts

Current fonts:
- **Display:** Crimson Pro (serif)
- **Body:** DM Sans (sans-serif)

Change in the Google Fonts link at the top of the file.

## Troubleshooting

**Problem:** "Failed to fetch" errors
- **Solution:** Check Supabase URL and API key are correct
- **Solution:** Verify RLS policies are enabled

**Problem:** Data not syncing
- **Solution:** Check browser console for errors
- **Solution:** Verify internet connection
- **Solution:** Check Supabase project is active

**Problem:** Meal plans not showing
- **Solution:** Ensure meal plan dates are within the next 2 weeks from Monday
- **Solution:** Check database has entries with correct date format

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Mobile)

## Security Notes

- Keep your Supabase anon key secure
- For production, implement proper authentication
- Use Row Level Security policies based on user authentication
- Consider environment variables for sensitive data

## Contributing

This is a single-file application for easy deployment. To modify:
1. Edit the HTML file
2. Test locally by opening in a browser
3. Push changes to GitHub
4. GitHub Pages will auto-deploy

## License

MIT License - Feel free to use and modify for personal or commercial projects.

## Support

For issues or questions:
- Check Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
- Review the code comments in the HTML file
- Check browser console for error messages

---

**Enjoy cooking and tracking your nutrition! 🍳📊**
