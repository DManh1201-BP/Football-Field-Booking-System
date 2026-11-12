/*
	SportHub 2.0 - SQL Server schema
	Database-First source of truth for the initial domain.
	Run this script in SQL Server Management Studio or Azure Data Studio.
*/

IF DB_ID(N'SportHubDb') IS NULL
BEGIN
	CREATE DATABASE [SportHubDb];
END;
GO

USE [SportHubDb];
GO

IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
	CREATE TABLE dbo.Users
	(
		UserId UNIQUEIDENTIFIER NOT NULL
			CONSTRAINT PK_Users PRIMARY KEY
			CONSTRAINT DF_Users_UserId DEFAULT NEWSEQUENTIALID(),
		UserName NVARCHAR(100) NOT NULL,
		Email NVARCHAR(320) NOT NULL,
		PasswordHash NVARCHAR(500) NOT NULL,
		FullName NVARCHAR(200) NOT NULL,
		PhoneNumber NVARCHAR(30) NULL,
		Role NVARCHAR(20) NOT NULL
			CONSTRAINT DF_Users_Role DEFAULT N'Player',
		IsActive BIT NOT NULL
			CONSTRAINT DF_Users_IsActive DEFAULT 1,
		CreatedAt DATETIME2(0) NOT NULL
			CONSTRAINT DF_Users_CreatedAt DEFAULT SYSUTCDATETIME(),
		CONSTRAINT UQ_Users_UserName UNIQUE (UserName),
		CONSTRAINT UQ_Users_Email UNIQUE (Email),
		CONSTRAINT CK_Users_Role CHECK (Role IN (N'Player', N'Owner', N'Admin'))
	);
END;
GO

IF OBJECT_ID(N'dbo.Fields', N'U') IS NULL
BEGIN
	CREATE TABLE dbo.Fields
	(
		FieldId UNIQUEIDENTIFIER NOT NULL
			CONSTRAINT PK_Fields PRIMARY KEY
			CONSTRAINT DF_Fields_FieldId DEFAULT NEWSEQUENTIALID(),
		OwnerUserId UNIQUEIDENTIFIER NOT NULL,
		Name NVARCHAR(200) NOT NULL,
		SportType NVARCHAR(50) NOT NULL,
		Address NVARCHAR(500) NOT NULL,
		City NVARCHAR(100) NOT NULL,
		Description NVARCHAR(2000) NULL,
		PricePerHour DECIMAL(12, 2) NOT NULL,
		OpeningTime TIME(0) NULL,
		ClosingTime TIME(0) NULL,
		IsActive BIT NOT NULL
			CONSTRAINT DF_Fields_IsActive DEFAULT 1,
		CreatedAt DATETIME2(0) NOT NULL
			CONSTRAINT DF_Fields_CreatedAt DEFAULT SYSUTCDATETIME(),
		CONSTRAINT FK_Fields_OwnerUser
			FOREIGN KEY (OwnerUserId) REFERENCES dbo.Users(UserId),
		CONSTRAINT CK_Fields_PricePerHour CHECK (PricePerHour >= 0),
		CONSTRAINT CK_Fields_OpeningHours CHECK
			(OpeningTime IS NULL OR ClosingTime IS NULL OR OpeningTime < ClosingTime)
	);
END;
GO

IF OBJECT_ID(N'dbo.Bookings', N'U') IS NULL
BEGIN
	CREATE TABLE dbo.Bookings
	(
		BookingId UNIQUEIDENTIFIER NOT NULL
			CONSTRAINT PK_Bookings PRIMARY KEY
			CONSTRAINT DF_Bookings_BookingId DEFAULT NEWSEQUENTIALID(),
		FieldId UNIQUEIDENTIFIER NOT NULL,
		UserId UNIQUEIDENTIFIER NOT NULL,
		StartTime DATETIME2(0) NOT NULL,
		EndTime DATETIME2(0) NOT NULL,
		TotalAmount DECIMAL(12, 2) NOT NULL,
		Status NVARCHAR(20) NOT NULL
			CONSTRAINT DF_Bookings_Status DEFAULT N'Pending',
		Notes NVARCHAR(1000) NULL,
		CreatedAt DATETIME2(0) NOT NULL
			CONSTRAINT DF_Bookings_CreatedAt DEFAULT SYSUTCDATETIME(),
		UpdatedAt DATETIME2(0) NULL,
		CONSTRAINT FK_Bookings_Field
			FOREIGN KEY (FieldId) REFERENCES dbo.Fields(FieldId),
		CONSTRAINT FK_Bookings_User
			FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId),
		CONSTRAINT CK_Bookings_Time CHECK (StartTime < EndTime),
		CONSTRAINT CK_Bookings_TotalAmount CHECK (TotalAmount >= 0),
		CONSTRAINT CK_Bookings_Status CHECK
			(Status IN (N'Pending', N'Confirmed', N'Cancelled', N'Completed', N'Expired'))
	);
END;
GO

IF OBJECT_ID(N'dbo.Matches', N'U') IS NULL
BEGIN
	CREATE TABLE dbo.Matches
	(
		MatchId UNIQUEIDENTIFIER NOT NULL
			CONSTRAINT PK_Matches PRIMARY KEY
			CONSTRAINT DF_Matches_MatchId DEFAULT NEWSEQUENTIALID(),
		CreatorUserId UNIQUEIDENTIFIER NOT NULL,
		FieldId UNIQUEIDENTIFIER NULL,
		Title NVARCHAR(200) NOT NULL,
		SportType NVARCHAR(50) NOT NULL,
		Description NVARCHAR(2000) NULL,
		SkillLevel NVARCHAR(30) NULL,
		StartTime DATETIME2(0) NOT NULL,
		EndTime DATETIME2(0) NOT NULL,
		MaxPlayers INT NOT NULL,
		Status NVARCHAR(20) NOT NULL
			CONSTRAINT DF_Matches_Status DEFAULT N'Open',
		CreatedAt DATETIME2(0) NOT NULL
			CONSTRAINT DF_Matches_CreatedAt DEFAULT SYSUTCDATETIME(),
		CONSTRAINT FK_Matches_CreatorUser
			FOREIGN KEY (CreatorUserId) REFERENCES dbo.Users(UserId),
		CONSTRAINT FK_Matches_Field
			FOREIGN KEY (FieldId) REFERENCES dbo.Fields(FieldId),
		CONSTRAINT CK_Matches_Time CHECK (StartTime < EndTime),
		CONSTRAINT CK_Matches_MaxPlayers CHECK (MaxPlayers BETWEEN 2 AND 100),
		CONSTRAINT CK_Matches_Status CHECK
			(Status IN (N'Open', N'Full', N'InProgress', N'Completed', N'Cancelled'))
	);
END;
GO

IF NOT EXISTS
(
	SELECT 1
	FROM sys.indexes
	WHERE name = N'IX_Fields_Search'
	  AND object_id = OBJECT_ID(N'dbo.Fields')
)
BEGIN
	CREATE INDEX IX_Fields_Search
		ON dbo.Fields (SportType, City, IsActive)
		INCLUDE (Name, PricePerHour);
END;
GO

IF NOT EXISTS
(
	SELECT 1
	FROM sys.indexes
	WHERE name = N'IX_Bookings_FieldTime'
	  AND object_id = OBJECT_ID(N'dbo.Bookings')
)
BEGIN
	CREATE INDEX IX_Bookings_FieldTime
		ON dbo.Bookings (FieldId, StartTime, EndTime, Status);
END;
GO

IF NOT EXISTS
(
	SELECT 1
	FROM sys.indexes
	WHERE name = N'IX_Bookings_User'
	  AND object_id = OBJECT_ID(N'dbo.Bookings')
)
BEGIN
	CREATE INDEX IX_Bookings_User
		ON dbo.Bookings (UserId, StartTime DESC);
END;
GO

IF NOT EXISTS
(
	SELECT 1
	FROM sys.indexes
	WHERE name = N'IX_Matches_Search'
	  AND object_id = OBJECT_ID(N'dbo.Matches')
)
BEGIN
	CREATE INDEX IX_Matches_Search
		ON dbo.Matches (SportType, StartTime, Status);
END;
GO

CREATE OR ALTER TRIGGER dbo.TR_Bookings_PreventOverlap
ON dbo.Bookings
AFTER INSERT, UPDATE
AS
BEGIN
	SET NOCOUNT ON;

	IF EXISTS
	(
		SELECT 1
		FROM inserted AS i
		INNER JOIN dbo.Bookings AS b WITH (UPDLOCK, HOLDLOCK)
			ON b.FieldId = i.FieldId
		   AND b.BookingId <> i.BookingId
		   AND i.StartTime < b.EndTime
		   AND i.EndTime > b.StartTime
		WHERE i.Status IN (N'Pending', N'Confirmed', N'Completed')
		  AND b.Status IN (N'Pending', N'Confirmed', N'Completed')
	)
	BEGIN
		ROLLBACK TRANSACTION;
		THROW 51000, 'The field is already booked for the selected time range.', 1;
	END;
END;
GO

/* Sample data: fictional values only, for local development. */
DECLARE @DemoPlayerId UNIQUEIDENTIFIER = '11111111-1111-1111-1111-111111111111';
DECLARE @DemoOwnerId UNIQUEIDENTIFIER = '22222222-2222-2222-2222-222222222222';
DECLARE @DemoFieldId UNIQUEIDENTIFIER = '33333333-3333-3333-3333-333333333333';
DECLARE @DemoBookingId UNIQUEIDENTIFIER = '44444444-4444-4444-4444-444444444444';
DECLARE @DemoMatchId UNIQUEIDENTIFIER = '55555555-5555-5555-5555-555555555555';

IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE UserId = @DemoPlayerId)
BEGIN
	INSERT INTO dbo.Users (UserId, UserName, Email, PasswordHash, FullName, Role)
	VALUES
	(
		@DemoPlayerId,
		N'demo.player',
		N'demo.player@example.invalid',
		N'REPLACE_WITH_A_REAL_PASSWORD_HASH',
		N'Demo Player',
		N'Player'
	);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE UserId = @DemoOwnerId)
BEGIN
	INSERT INTO dbo.Users (UserId, UserName, Email, PasswordHash, FullName, Role)
	VALUES
	(
		@DemoOwnerId,
		N'demo.owner',
		N'demo.owner@example.invalid',
		N'REPLACE_WITH_A_REAL_PASSWORD_HASH',
		N'Demo Owner',
		N'Owner'
	);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.Fields WHERE FieldId = @DemoFieldId)
BEGIN
	INSERT INTO dbo.Fields
		(FieldId, OwnerUserId, Name, SportType, Address, City, Description, PricePerHour, OpeningTime, ClosingTime)
	VALUES
	(
		@DemoFieldId,
		@DemoOwnerId,
		N'Demo Football Field',
		N'Football',
		N'100 Example Street',
		N'Ho Chi Minh City',
		N'Fictional field for local development.',
		250000.00,
		'06:00',
		'23:00'
	);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.Bookings WHERE BookingId = @DemoBookingId)
BEGIN
	INSERT INTO dbo.Bookings
		(BookingId, FieldId, UserId, StartTime, EndTime, TotalAmount, Status, Notes)
	VALUES
	(
		@DemoBookingId,
		@DemoFieldId,
		@DemoPlayerId,
		DATEADD(DAY, 1, DATEADD(HOUR, 18, CAST(CAST(SYSUTCDATETIME() AS DATE) AS DATETIME2(0)))),
		DATEADD(DAY, 1, DATEADD(HOUR, 20, CAST(CAST(SYSUTCDATETIME() AS DATE) AS DATETIME2(0)))),
		500000.00,
		N'Confirmed',
		N'Sample booking for local development.'
	);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.Matches WHERE MatchId = @DemoMatchId)
BEGIN
	INSERT INTO dbo.Matches
		(MatchId, CreatorUserId, FieldId, Title, SportType, Description, SkillLevel, StartTime, EndTime, MaxPlayers)
	VALUES
	(
		@DemoMatchId,
		@DemoPlayerId,
		@DemoFieldId,
		N'Demo friendly match',
		N'Football',
		N'Sample match for local development.',
		N'Intermediate',
		DATEADD(DAY, 2, DATEADD(HOUR, 18, CAST(CAST(SYSUTCDATETIME() AS DATE) AS DATETIME2(0)))),
		DATEADD(DAY, 2, DATEADD(HOUR, 20, CAST(CAST(SYSUTCDATETIME() AS DATE) AS DATETIME2(0)))),
		10
	);
END;
GO
