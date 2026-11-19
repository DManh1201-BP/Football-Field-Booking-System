/*
    Enables Google Identity Services authentication.
    Run this once against SportHubDb before starting the updated API.
*/
USE [SportHubDb];
GO

IF OBJECT_ID(N'dbo.users', N'U') IS NULL
    THROW 50001, 'dbo.users does not exist in SportHubDb. Check the selected database.', 1;
GO

IF COL_LENGTH(N'dbo.users', N'google_sub') IS NULL
    ALTER TABLE dbo.users ADD google_sub NVARCHAR(255) NULL;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.users')
      AND name = N'ux_users_google_sub'
)
    CREATE UNIQUE INDEX ux_users_google_sub
        ON dbo.users(google_sub)
        WHERE google_sub IS NOT NULL;
GO
