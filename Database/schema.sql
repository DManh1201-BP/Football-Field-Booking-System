/* SportHub SQL Server schema aligned with Backend/SportHub.API EF Core models. */

IF DB_ID(N'SportHubDb') IS NULL CREATE DATABASE [SportHubDb];
GO
USE [SportHubDb];
GO

CREATE TABLE dbo.users
(
	id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_users PRIMARY KEY,
	email NVARCHAR(100) NOT NULL CONSTRAINT UQ_users_email UNIQUE,
	password NVARCHAR(255) NOT NULL,
	google_sub NVARCHAR(255) NULL,
	full_name NVARCHAR(100) NOT NULL,
	phone NVARCHAR(20) NULL,
	address NVARCHAR(255) NULL,
	bio NVARCHAR(500) NULL,
	avatar_url NVARCHAR(500) NULL,
	role NVARCHAR(20) NOT NULL CONSTRAINT DF_users_role DEFAULT N'CUSTOMER',
	is_active BIT NOT NULL CONSTRAINT DF_users_is_active DEFAULT 1,
	elo_rating INT NOT NULL CONSTRAINT DF_users_elo_rating DEFAULT 1000,
	reliability_score INT NOT NULL CONSTRAINT DF_users_reliability_score DEFAULT 100,
	created_at DATETIME2 NOT NULL CONSTRAINT DF_users_created_at DEFAULT GETDATE(),
	updated_at DATETIME2 NOT NULL CONSTRAINT DF_users_updated_at DEFAULT GETDATE(),
	CONSTRAINT CK_users_role CHECK (role IN (N'CUSTOMER', N'OWNER', N'ADMIN'))
);
GO
CREATE UNIQUE INDEX ux_users_google_sub ON dbo.users(google_sub) WHERE google_sub IS NOT NULL;
GO

CREATE TABLE dbo.fields
(
	id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_fields PRIMARY KEY,
	name NVARCHAR(150) NOT NULL,
	description NVARCHAR(MAX) NULL,
	location NVARCHAR(255) NOT NULL,
	city NVARCHAR(100) NULL,
	province NVARCHAR(100) NULL,
	image_url NVARCHAR(MAX) NULL,
	price_per_hour DECIMAL(10,2) NOT NULL,
	capacity INT NULL,
	sport_type NVARCHAR(50) NOT NULL,
	amenities NVARCHAR(500) NULL,
	is_available BIT NOT NULL CONSTRAINT DF_fields_is_available DEFAULT 1,
	owner_id BIGINT NULL,
	venue_source NVARCHAR(30) NOT NULL CONSTRAINT DF_fields_venue_source DEFAULT N'PARTNER',
	verification_status NVARCHAR(30) NOT NULL CONSTRAINT DF_fields_verification_status DEFAULT N'APPROVED',
	latitude DECIMAL(9,6) NULL,
	longitude DECIMAL(9,6) NULL,
	map_url NVARCHAR(500) NULL,
	verification_doc_url NVARCHAR(500) NULL,
	verification_notes NVARCHAR(500) NULL,
	verified_at DATETIME2 NULL,
	verified_by_admin_id BIGINT NULL,
	is_indoor BIT NOT NULL CONSTRAINT DF_fields_is_indoor DEFAULT 0,
	created_at DATETIME2 NOT NULL CONSTRAINT DF_fields_created_at DEFAULT GETDATE(),
	updated_at DATETIME2 NOT NULL CONSTRAINT DF_fields_updated_at DEFAULT GETDATE(),
	CONSTRAINT FK_fields_owner FOREIGN KEY (owner_id) REFERENCES dbo.users(id) ON DELETE SET NULL,
	CONSTRAINT CK_fields_price CHECK (price_per_hour > 0)
);
GO

CREATE TABLE dbo.bookings
(
	id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_bookings PRIMARY KEY,
	user_id BIGINT NOT NULL,
	field_id BIGINT NOT NULL,
	booking_date DATE NOT NULL,
	start_time TIME NOT NULL,
	end_time TIME NOT NULL,
	total_price DECIMAL(10,2) NOT NULL,
	status NVARCHAR(20) NOT NULL CONSTRAINT DF_bookings_status DEFAULT N'PENDING',
	hold_expires_at DATETIME2 NULL,
	customer_phone NVARCHAR(20) NULL,
	notes NVARCHAR(MAX) NULL,
	cancellation_reason NVARCHAR(300) NULL,
	booking_type NVARCHAR(20) NOT NULL CONSTRAINT DF_bookings_type DEFAULT N'ONLINE',
	expected_players INT NULL,
	deposit_amount DECIMAL(10,2) NOT NULL CONSTRAINT DF_bookings_deposit DEFAULT 0,
	payment_status NVARCHAR(20) NOT NULL CONSTRAINT DF_bookings_payment_status DEFAULT N'UNPAID',
	cancellation_policy_applied NVARCHAR(120) NULL,
	checked_in_at DATETIME2 NULL,
	row_version ROWVERSION NOT NULL,
	created_at DATETIME2 NOT NULL CONSTRAINT DF_bookings_created_at DEFAULT GETDATE(),
	updated_at DATETIME2 NOT NULL CONSTRAINT DF_bookings_updated_at DEFAULT GETDATE(),
	CONSTRAINT FK_bookings_user FOREIGN KEY (user_id) REFERENCES dbo.users(id),
	CONSTRAINT FK_bookings_field FOREIGN KEY (field_id) REFERENCES dbo.fields(id),
	CONSTRAINT CK_bookings_time CHECK (start_time < end_time),
	CONSTRAINT CK_bookings_status CHECK (status IN (N'PENDING', N'HOLD', N'CONFIRMED', N'COMPLETED', N'CANCELLED', N'EXPIRED', N'RAIN_OUT'))
);
GO

CREATE TABLE dbo.matches
(
	id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_matches PRIMARY KEY,
	title NVARCHAR(150) NOT NULL,
	sport_type NVARCHAR(50) NOT NULL,
	skill_level NVARCHAR(50) NOT NULL CONSTRAINT DF_matches_skill_level DEFAULT N'INTERMEDIATE',
	city NVARCHAR(100) NULL,
	location NVARCHAR(255) NULL,
	field_id BIGINT NULL,
	host_user_id BIGINT NOT NULL,
	challenger_user_id BIGINT NULL,
	match_date DATE NOT NULL,
	start_time TIME NOT NULL,
	end_time TIME NOT NULL,
	missing_players INT NOT NULL CONSTRAINT DF_matches_missing_players DEFAULT 1,
	status NVARCHAR(20) NOT NULL CONSTRAINT DF_matches_status DEFAULT N'OPEN',
	host_score INT NULL,
	challenger_score INT NULL,
	notes NVARCHAR(MAX) NULL,
	match_mode NVARCHAR(20) NOT NULL CONSTRAINT DF_matches_mode DEFAULT N'TEAM_CHALLENGE',
	max_slots INT NOT NULL CONSTRAINT DF_matches_max_slots DEFAULT 2,
	pre_reserved_slots INT NOT NULL CONSTRAINT DF_matches_pre_reserved DEFAULT 1,
	booking_id BIGINT NULL,
	is_ranked BIT NOT NULL CONSTRAINT DF_matches_is_ranked DEFAULT 1,
	score_status NVARCHAR(30) NOT NULL CONSTRAINT DF_matches_score_status DEFAULT N'NONE',
	proposed_host_score INT NULL,
	proposed_challenger_score INT NULL,
	score_submitted_by_user_id BIGINT NULL,
	score_submitted_at DATETIME2 NULL,
	score_confirm_deadline DATETIME2 NULL,
	disputed_host_score INT NULL,
	disputed_challenger_score INT NULL,
	dispute_reason NVARCHAR(500) NULL,
	dispute_evidence_url NVARCHAR(500) NULL,
	created_at DATETIME2 NOT NULL CONSTRAINT DF_matches_created_at DEFAULT GETDATE(),
	updated_at DATETIME2 NOT NULL CONSTRAINT DF_matches_updated_at DEFAULT GETDATE(),
	CONSTRAINT FK_matches_field FOREIGN KEY (field_id) REFERENCES dbo.fields(id) ON DELETE SET NULL,
	CONSTRAINT FK_matches_booking FOREIGN KEY (booking_id) REFERENCES dbo.bookings(id) ON DELETE NO ACTION,
	CONSTRAINT FK_matches_host FOREIGN KEY (host_user_id) REFERENCES dbo.users(id),
	CONSTRAINT FK_matches_challenger FOREIGN KEY (challenger_user_id) REFERENCES dbo.users(id),
	CONSTRAINT CK_matches_missing_players CHECK (missing_players BETWEEN 0 AND 50)
);
GO

CREATE TABLE dbo.field_claim_requests
(
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
GO

CREATE TABLE dbo.field_reports
(
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
GO

CREATE TABLE dbo.match_participants
(
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
GO

CREATE TABLE dbo.user_sport_ratings
(
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
GO
CREATE UNIQUE INDEX UX_user_sport_ratings_user_sport ON dbo.user_sport_ratings(user_id, sport_type);
GO
GO

CREATE TABLE dbo.notifications
(
	id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_notifications PRIMARY KEY,
	user_id BIGINT NOT NULL,
	booking_id BIGINT NULL,
	category NVARCHAR(30) NOT NULL CONSTRAINT DF_notifications_category DEFAULT N'BOOKING',
	reference_id BIGINT NULL,
	message NVARCHAR(500) NOT NULL,
	is_read BIT NOT NULL CONSTRAINT DF_notifications_is_read DEFAULT 0,
	created_at DATETIME2 NOT NULL CONSTRAINT DF_notifications_created_at DEFAULT GETDATE(),
	CONSTRAINT FK_notifications_user FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
	CONSTRAINT FK_notifications_booking FOREIGN KEY (booking_id) REFERENCES dbo.bookings(id) ON DELETE SET NULL
);
GO

CREATE INDEX IX_notifications_user_read_created ON dbo.notifications(user_id, is_read, created_at DESC);
GO

CREATE INDEX IX_fields_search ON dbo.fields(sport_type, city, is_available);
CREATE INDEX IX_bookings_schedule ON dbo.bookings(field_id, booking_date, start_time, end_time, status);
CREATE INDEX IX_bookings_user ON dbo.bookings(user_id, booking_date DESC);
CREATE INDEX IX_matches_discovery ON dbo.matches(sport_type, city, status, match_date);
GO

CREATE TABLE dbo.friend_requests
(
	id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_friend_requests PRIMARY KEY,
	from_user_id BIGINT NOT NULL,
	to_user_id BIGINT NOT NULL,
	status NVARCHAR(20) NOT NULL CONSTRAINT DF_friend_requests_status DEFAULT N'PENDING',
	created_at DATETIME2 NOT NULL CONSTRAINT DF_friend_requests_created_at DEFAULT GETDATE(),
	updated_at DATETIME2 NOT NULL CONSTRAINT DF_friend_requests_updated_at DEFAULT GETDATE(),
	CONSTRAINT FK_friend_requests_from FOREIGN KEY (from_user_id) REFERENCES dbo.users(id),
	CONSTRAINT FK_friend_requests_to FOREIGN KEY (to_user_id) REFERENCES dbo.users(id),
	CONSTRAINT CK_friend_requests_status CHECK (status IN (N'PENDING', N'ACCEPTED', N'REJECTED'))
);
GO
CREATE INDEX IX_friend_requests_from_to_status ON dbo.friend_requests(from_user_id, to_user_id, status);
GO

CREATE TABLE dbo.conversations
(
	id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_conversations PRIMARY KEY,
	participant_one_id BIGINT NOT NULL,
	participant_two_id BIGINT NOT NULL,
	created_at DATETIME2 NOT NULL CONSTRAINT DF_conversations_created_at DEFAULT GETDATE(),
	CONSTRAINT FK_conversations_one FOREIGN KEY (participant_one_id) REFERENCES dbo.users(id),
	CONSTRAINT FK_conversations_two FOREIGN KEY (participant_two_id) REFERENCES dbo.users(id),
	CONSTRAINT CK_conversations_order CHECK (participant_one_id < participant_two_id)
);
GO
CREATE UNIQUE INDEX UX_conversations_participants ON dbo.conversations(participant_one_id, participant_two_id);
GO

CREATE TABLE dbo.chat_messages
(
	id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_chat_messages PRIMARY KEY,
	conversation_id BIGINT NOT NULL,
	sender_user_id BIGINT NOT NULL,
	content NVARCHAR(2000) NOT NULL,
	created_at DATETIME2 NOT NULL CONSTRAINT DF_chat_messages_created_at DEFAULT GETDATE(),
	CONSTRAINT FK_chat_messages_conversation FOREIGN KEY (conversation_id) REFERENCES dbo.conversations(id) ON DELETE CASCADE,
	CONSTRAINT FK_chat_messages_sender FOREIGN KEY (sender_user_id) REFERENCES dbo.users(id)
);
GO
CREATE INDEX IX_chat_messages_conversation_id ON dbo.chat_messages(conversation_id, id);
GO

/* Booking overlap is enforced by BookingService in a Serializable transaction. */
