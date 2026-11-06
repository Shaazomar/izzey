-- Customer email is now optional. Existing emails and the unique index are kept;
-- Postgres allows any number of NULLs in a unique column, so customers without email never clash.
ALTER TABLE "Customer" ALTER COLUMN "email" DROP NOT NULL;
