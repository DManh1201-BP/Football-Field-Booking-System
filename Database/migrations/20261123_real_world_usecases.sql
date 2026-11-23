/* Migration: Real-world use cases (Venue verification, Community/Unclaimed venues,
   Walk-in & Booking policies, Solo Lobby participants, Dual-Confirmation Scoring & Sport Elo). */

IF OBJECT_ID(N'dbo.users', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.users', N'reliability_score') IS NULL
    EXEC(N'ALTER TABLE dbo.users ADD reliability_score INT NOT NULL CONSTRAINT DF_users_reliability_score DEFAULT 100');
GO

IF OBJECT_ID(N'dbo.fields', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.fields', N'venue_source') IS NULL
        EXEC(N'ALTER TABLE dbo.fields ADD venue_source NVARCHAR(30) NOT NULL CONSTRAINT DF_fields_venue_source DEFAULT N''PARTNER''');
    IF COL_LENGTH(N'dbo.fields', N'verification_status') IS NULL
        EXEC(N'ALTER TABLE dbo.fields ADD verification_status NVARCHAR(30) NOT NULL CONSTRAINT DF_fields_verification_status DEFAULT N''APPROVED''');
    IF COL_LENGTH(N'dbo.fields', N'latitude') IS NULL
        EXEC(N'ALTER TABLE dbo.fields ADD latitude DECIMAL(9,6) NULL');
    IF COL_LENGTH(N'dbo.fields', N'longitude') IS NULL
        EXEC(N'ALTER TABLE dbo.fields ADD longitude DECIMAL(9,6) NULL');
    IF COL_LENGTH(N'dbo.fields', N'map_url') IS NULL
        EXEC(N'ALTER TABLE dbo.fields ADD map_url NVARCHAR(500) NULL');
    IF COL_LENGTH(N'dbo.fields', N'verification_doc_url') IS NULL
        EXEC(N'ALTER TABLE dbo.fields ADD verification_doc_url NVARCHAR(500) NULL');
    IF COL_LENGTH(N'dbo.fields', N'verification_notes') IS NULL
        EXEC(N'ALTER TABLE dbo.fields ADD verification_notes NVARCHAR(500) NULL');
    IF COL_LENGTH(N'dbo.fields', N'verified_at') IS NULL
        EXEC(N'ALTER TABLE dbo.fields ADD verified_at DATETIME2 NULL');
    IF COL_LENGTH(N'dbo.fields', N'verified_by_admin_id') IS NULL
        EXEC(N'ALTER TABLE dbo.fields ADD verified_by_admin_id BIGINT NULL');
    IF COL_LENGTH(N'dbo.fields', N'is_indoor') IS NULL
        EXEC(N'ALTER TABLE dbo.fields ADD is_indoor BIT NOT NULL CONSTRAINT DF_fields_is_indoor DEFAULT 0');
END;
GO

IF OBJECT_ID(N'dbo.field_claim_requests', N'U') IS NULL AND OBJECT_ID(N'dbo.fields', N'U') IS NOT NULL
BEGIN
    CREATE TABLE dbo.field_claim_requests (
        id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_field_claim_requests PRIMARY KEY,
        field_id BIGINT NOT NULL,
        claimant_user_id BIGINT NOT NULL,
        evidence_doc_url NVARCHAR(500) NULL,
        map_url NVARCHAR(500) NULL,
        notes NVARCHAR(500) NULL,
        status NVARCHAR(20) NOT NULL CONSTRAINT DF_field_claims_status DEFAULT N'PENDING',
        admin_note NVARCHAR(500) NULL,
        reviewed_by_admin_id BIGINT NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_field_claims_created DEFAULT GETDATE(),
        reviewed_at DATETIME2 NULL,
        CONSTRAINT FK_field_claims_field FOREIGN KEY (field_id) REFERENCES dbo.fields(id) ON DELETE CASCADE,
        CONSTRAINT FK_field_claims_user FOREIGN KEY (claimant_user_id) REFERENCES dbo.users(id)
    );
    CREATE INDEX IX_field_claim_requests_field_status ON dbo.field_claim_requests(field_id, status);
END;
GO

IF OBJECT_ID(N'dbo.field_reports', N'U') IS NULL AND OBJECT_ID(N'dbo.fields', N'U') IS NOT NULL
BEGIN
    CREATE TABLE dbo.field_reports (
        id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_field_reports PRIMARY KEY,
        field_id BIGINT NOT NULL,
        reporter_user_id BIGINT NOT NULL,
        reason NVARCHAR(100) NOT NULL,
        details NVARCHAR(500) NULL,
        status NVARCHAR(20) NOT NULL CONSTRAINT DF_field_reports_status DEFAULT N'OPEN',
        created_at DATETIME2 NOT NULL CONSTRAINT DF_field_reports_created DEFAULT GETDATE(),
        CONSTRAINT FK_field_reports_field FOREIGN KEY (field_id) REFERENCES dbo.fields(id) ON DELETE CASCADE,
        CONSTRAINT FK_field_reports_user FOREIGN KEY (reporter_user_id) REFERENCES dbo.users(id)
    );
    CREATE INDEX IX_field_reports_field_status ON dbo.field_reports(field_id, status);
END;
GO

IF OBJECT_ID(N'dbo.bookings', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.bookings', N'booking_type') IS NULL
        EXEC(N'ALTER TABLE dbo.bookings ADD booking_type NVARCHAR(20) NOT NULL CONSTRAINT DF_bookings_type DEFAULT N''ONLINE''');
    IF COL_LENGTH(N'dbo.bookings', N'expected_players') IS NULL
        EXEC(N'ALTER TABLE dbo.bookings ADD expected_players INT NULL');
    IF COL_LENGTH(N'dbo.bookings', N'deposit_amount') IS NULL
        EXEC(N'ALTER TABLE dbo.bookings ADD deposit_amount DECIMAL(10,2) NOT NULL CONSTRAINT DF_bookings_deposit DEFAULT 0');
    IF COL_LENGTH(N'dbo.bookings', N'payment_status') IS NULL
        EXEC(N'ALTER TABLE dbo.bookings ADD payment_status NVARCHAR(20) NOT NULL CONSTRAINT DF_bookings_payment_status DEFAULT N''UNPAID''');
    IF COL_LENGTH(N'dbo.bookings', N'cancellation_policy_applied') IS NULL
        EXEC(N'ALTER TABLE dbo.bookings ADD cancellation_policy_applied NVARCHAR(120) NULL');
    IF COL_LENGTH(N'dbo.bookings', N'checked_in_at') IS NULL
        EXEC(N'ALTER TABLE dbo.bookings ADD checked_in_at DATETIME2 NULL');

    IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_bookings_status' AND parent_object_id = OBJECT_ID(N'dbo.bookings'))
        EXEC(N'ALTER TABLE dbo.bookings DROP CONSTRAINT CK_bookings_status');
    EXEC(N'ALTER TABLE dbo.bookings ADD CONSTRAINT CK_bookings_status CHECK (status IN (N''PENDING'', N''HOLD'', N''CONFIRMED'', N''COMPLETED'', N''CANCELLED'', N''EXPIRED'', N''RAIN_OUT''))');
END;
GO

IF OBJECT_ID(N'dbo.matches', N'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_matches_missing_players' AND parent_object_id = OBJECT_ID(N'dbo.matches'))
        EXEC(N'ALTER TABLE dbo.matches DROP CONSTRAINT CK_matches_missing_players');
    EXEC(N'ALTER TABLE dbo.matches ADD CONSTRAINT CK_matches_missing_players CHECK (missing_players BETWEEN 0 AND 50)');

    IF COL_LENGTH(N'dbo.matches', N'match_mode') IS NULL
        EXEC(N'ALTER TABLE dbo.matches ADD match_mode NVARCHAR(20) NOT NULL CONSTRAINT DF_matches_mode DEFAULT N''TEAM_CHALLENGE''');
    IF COL_LENGTH(N'dbo.matches', N'max_slots') IS NULL
        EXEC(N'ALTER TABLE dbo.matches ADD max_slots INT NOT NULL CONSTRAINT DF_matches_max_slots DEFAULT 2');
    IF COL_LENGTH(N'dbo.matches', N'pre_reserved_slots') IS NULL
        EXEC(N'ALTER TABLE dbo.matches ADD pre_reserved_slots INT NOT NULL CONSTRAINT DF_matches_pre_reserved DEFAULT 1');
    IF COL_LENGTH(N'dbo.matches', N'booking_id') IS NULL
        EXEC(N'ALTER TABLE dbo.matches ADD booking_id BIGINT NULL');
    IF COL_LENGTH(N'dbo.matches', N'is_ranked') IS NULL
        EXEC(N'ALTER TABLE dbo.matches ADD is_ranked BIT NOT NULL CONSTRAINT DF_matches_is_ranked DEFAULT 1');
    IF COL_LENGTH(N'dbo.matches', N'score_status') IS NULL
        EXEC(N'ALTER TABLE dbo.matches ADD score_status NVARCHAR(30) NOT NULL CONSTRAINT DF_matches_score_status DEFAULT N''NONE''');
    IF COL_LENGTH(N'dbo.matches', N'proposed_host_score') IS NULL
        EXEC(N'ALTER TABLE dbo.matches ADD proposed_host_score INT NULL');
    IF COL_LENGTH(N'dbo.matches', N'proposed_challenger_score') IS NULL
        EXEC(N'ALTER TABLE dbo.matches ADD proposed_challenger_score INT NULL');
    IF COL_LENGTH(N'dbo.matches', N'score_submitted_by_user_id') IS NULL
        EXEC(N'ALTER TABLE dbo.matches ADD score_submitted_by_user_id BIGINT NULL');
    IF COL_LENGTH(N'dbo.matches', N'score_submitted_at') IS NULL
        EXEC(N'ALTER TABLE dbo.matches ADD score_submitted_at DATETIME2 NULL');
    IF COL_LENGTH(N'dbo.matches', N'score_confirm_deadline') IS NULL
        EXEC(N'ALTER TABLE dbo.matches ADD score_confirm_deadline DATETIME2 NULL');
    IF COL_LENGTH(N'dbo.matches', N'disputed_host_score') IS NULL
        EXEC(N'ALTER TABLE dbo.matches ADD disputed_host_score INT NULL');
    IF COL_LENGTH(N'dbo.matches', N'disputed_challenger_score') IS NULL
        EXEC(N'ALTER TABLE dbo.matches ADD disputed_challenger_score INT NULL');
    IF COL_LENGTH(N'dbo.matches', N'dispute_reason') IS NULL
        EXEC(N'ALTER TABLE dbo.matches ADD dispute_reason NVARCHAR(500) NULL');
    IF COL_LENGTH(N'dbo.matches', N'dispute_evidence_url') IS NULL
        EXEC(N'ALTER TABLE dbo.matches ADD dispute_evidence_url NVARCHAR(500) NULL');

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_matches_booking')
        EXEC(N'ALTER TABLE dbo.matches ADD CONSTRAINT FK_matches_booking FOREIGN KEY (booking_id) REFERENCES dbo.bookings(id) ON DELETE NO ACTION');
END;
GO

IF OBJECT_ID(N'dbo.match_participants', N'U') IS NULL AND OBJECT_ID(N'dbo.matches', N'U') IS NOT NULL
BEGIN
    CREATE TABLE dbo.match_participants (
        id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_match_participants PRIMARY KEY,
        match_id BIGINT NOT NULL,
        user_id BIGINT NOT NULL,
        team_side NVARCHAR(10) NOT NULL CONSTRAINT DF_match_participants_side DEFAULT N'ANY',
        guest_count INT NOT NULL CONSTRAINT DF_match_participants_guest DEFAULT 0,
        status NVARCHAR(20) NOT NULL CONSTRAINT DF_match_participants_status DEFAULT N'JOINED',
        joined_at DATETIME2 NOT NULL CONSTRAINT DF_match_participants_joined DEFAULT GETDATE(),
        checked_in_at DATETIME2 NULL,
        CONSTRAINT FK_match_participants_match FOREIGN KEY (match_id) REFERENCES dbo.matches(id) ON DELETE CASCADE,
        CONSTRAINT FK_match_participants_user FOREIGN KEY (user_id) REFERENCES dbo.users(id)
    );
    CREATE INDEX IX_match_participants_match_user ON dbo.match_participants(match_id, user_id, status);
END;
GO

IF OBJECT_ID(N'dbo.user_sport_ratings', N'U') IS NULL AND OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
BEGIN
    CREATE TABLE dbo.user_sport_ratings (
        id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_user_sport_ratings PRIMARY KEY,
        user_id BIGINT NOT NULL,
        sport_type NVARCHAR(50) NOT NULL,
        elo_rating INT NOT NULL CONSTRAINT DF_user_sport_ratings_elo DEFAULT 1000,
        matches_played INT NOT NULL CONSTRAINT DF_user_sport_ratings_played DEFAULT 0,
        wins INT NOT NULL CONSTRAINT DF_user_sport_ratings_wins DEFAULT 0,
        draws INT NOT NULL CONSTRAINT DF_user_sport_ratings_draws DEFAULT 0,
        losses INT NOT NULL CONSTRAINT DF_user_sport_ratings_losses DEFAULT 0,
        updated_at DATETIME2 NOT NULL CONSTRAINT DF_user_sport_ratings_updated DEFAULT GETDATE(),
        CONSTRAINT FK_user_sport_ratings_user FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX UX_user_sport_ratings_user_sport ON dbo.user_sport_ratings(user_id, sport_type);
END;
GO
