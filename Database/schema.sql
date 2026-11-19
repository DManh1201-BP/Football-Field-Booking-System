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
	full_name NVARCHAR(100) NOT NULL,
	phone NVARCHAR(20) NULL,
	address NVARCHAR(255) NULL,
	role NVARCHAR(20) NOT NULL CONSTRAINT DF_users_role DEFAULT N'CUSTOMER',
	is_active BIT NOT NULL CONSTRAINT DF_users_is_active DEFAULT 1,
	elo_rating INT NOT NULL CONSTRAINT DF_users_elo_rating DEFAULT 1000,
	created_at DATETIME2 NOT NULL CONSTRAINT DF_users_created_at DEFAULT GETDATE(),
	updated_at DATETIME2 NOT NULL CONSTRAINT DF_users_updated_at DEFAULT GETDATE(),
	CONSTRAINT CK_users_role CHECK (role IN (N'CUSTOMER', N'OWNER', N'ADMIN'))
);
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
	row_version ROWVERSION NOT NULL,
	created_at DATETIME2 NOT NULL CONSTRAINT DF_bookings_created_at DEFAULT GETDATE(),
	updated_at DATETIME2 NOT NULL CONSTRAINT DF_bookings_updated_at DEFAULT GETDATE(),
	CONSTRAINT FK_bookings_user FOREIGN KEY (user_id) REFERENCES dbo.users(id),
	CONSTRAINT FK_bookings_field FOREIGN KEY (field_id) REFERENCES dbo.fields(id),
	CONSTRAINT CK_bookings_time CHECK (start_time < end_time),
	CONSTRAINT CK_bookings_status CHECK (status IN (N'PENDING', N'HOLD', N'CONFIRMED', N'COMPLETED', N'CANCELLED'))
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
	created_at DATETIME2 NOT NULL CONSTRAINT DF_matches_created_at DEFAULT GETDATE(),
	updated_at DATETIME2 NOT NULL CONSTRAINT DF_matches_updated_at DEFAULT GETDATE(),
	CONSTRAINT FK_matches_field FOREIGN KEY (field_id) REFERENCES dbo.fields(id) ON DELETE SET NULL,
	CONSTRAINT FK_matches_host FOREIGN KEY (host_user_id) REFERENCES dbo.users(id),
	CONSTRAINT FK_matches_challenger FOREIGN KEY (challenger_user_id) REFERENCES dbo.users(id),
	CONSTRAINT CK_matches_missing_players CHECK (missing_players BETWEEN 0 AND 1)
);
GO

CREATE TABLE dbo.notifications
(
	id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_notifications PRIMARY KEY,
	user_id BIGINT NOT NULL,
	booking_id BIGINT NULL,
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

/* Booking overlap is enforced by BookingService in a Serializable transaction. */
