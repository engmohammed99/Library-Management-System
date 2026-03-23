DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_name = 'borrowers' AND column_name = 'hashed_password'
	) THEN
		ALTER TABLE borrowers ADD COLUMN hashed_password varchar(256) DEFAULT 'unset' NOT NULL;
	END IF;
END $$;