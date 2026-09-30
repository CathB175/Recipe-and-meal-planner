-- Preserve every recipe and existing meal-plan reference.
ALTER TABLE public.recipes ADD COLUMN archived boolean NOT NULL DEFAULT false;
