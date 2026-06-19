ALTER TABLE "fixed_expenses" ADD COLUMN "reference_date" date;
UPDATE "fixed_expenses" SET "reference_date" = '1970-01-01' WHERE "reference_date" IS NULL;
ALTER TABLE "fixed_expenses" ALTER COLUMN "reference_date" SET NOT NULL;
