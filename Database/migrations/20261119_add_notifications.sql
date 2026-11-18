IF OBJECT_ID(N'dbo.notifications', N'U') IS NULL
BEGIN
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
    CREATE INDEX IX_notifications_user_read_created ON dbo.notifications(user_id, is_read, created_at DESC);
END;
GO
