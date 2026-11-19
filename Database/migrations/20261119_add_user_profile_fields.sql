IF OBJECT_ID(N'dbo.users', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.users', N'bio') IS NULL
    ALTER TABLE dbo.users ADD bio NVARCHAR(500) NULL;
GO
IF OBJECT_ID(N'dbo.users', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.users', N'avatar_url') IS NULL
    ALTER TABLE dbo.users ADD avatar_url NVARCHAR(500) NULL;
GO
