IF OBJECT_ID(N'dbo.users', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.users', N'bio') IS NULL
    EXEC(N'ALTER TABLE dbo.users ADD bio NVARCHAR(500) NULL');
GO
IF OBJECT_ID(N'dbo.users', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.users', N'avatar_url') IS NULL
    EXEC(N'ALTER TABLE dbo.users ADD avatar_url NVARCHAR(500) NULL');
GO

IF OBJECT_ID(N'dbo.notifications', N'U') IS NULL AND OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
BEGIN
    EXEC(N'CREATE TABLE dbo.notifications (
        id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_notifications PRIMARY KEY,
        user_id BIGINT NOT NULL,
        booking_id BIGINT NULL,
        category NVARCHAR(30) NOT NULL CONSTRAINT DF_notifications_category DEFAULT N''BOOKING'',
        reference_id BIGINT NULL,
        message NVARCHAR(500) NOT NULL,
        is_read BIT NOT NULL CONSTRAINT DF_notifications_is_read DEFAULT 0,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_notifications_created_at DEFAULT GETDATE(),
        CONSTRAINT FK_notifications_user FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
    )');
END;
GO
IF OBJECT_ID(N'dbo.notifications', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.notifications', N'category') IS NULL
    EXEC(N'ALTER TABLE dbo.notifications ADD category NVARCHAR(30) NOT NULL CONSTRAINT DF_notifications_category DEFAULT N''BOOKING''');
GO
IF OBJECT_ID(N'dbo.notifications', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.notifications', N'reference_id') IS NULL
    EXEC(N'ALTER TABLE dbo.notifications ADD reference_id BIGINT NULL');
GO
IF OBJECT_ID(N'dbo.friend_requests', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.friend_requests (
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
    CREATE INDEX IX_friend_requests_from_to_status ON dbo.friend_requests(from_user_id, to_user_id, status);
END;
GO

IF OBJECT_ID(N'dbo.conversations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.conversations (
        id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_conversations PRIMARY KEY,
        participant_one_id BIGINT NOT NULL,
        participant_two_id BIGINT NOT NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_conversations_created_at DEFAULT GETDATE(),
        CONSTRAINT FK_conversations_one FOREIGN KEY (participant_one_id) REFERENCES dbo.users(id),
        CONSTRAINT FK_conversations_two FOREIGN KEY (participant_two_id) REFERENCES dbo.users(id),
        CONSTRAINT CK_conversations_order CHECK (participant_one_id < participant_two_id)
    );
    CREATE UNIQUE INDEX UX_conversations_participants ON dbo.conversations(participant_one_id, participant_two_id);
END;
GO

IF OBJECT_ID(N'dbo.chat_messages', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.chat_messages (
        id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_chat_messages PRIMARY KEY,
        conversation_id BIGINT NOT NULL,
        sender_user_id BIGINT NOT NULL,
        content NVARCHAR(2000) NOT NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_chat_messages_created_at DEFAULT GETDATE(),
        CONSTRAINT FK_chat_messages_conversation FOREIGN KEY (conversation_id) REFERENCES dbo.conversations(id) ON DELETE CASCADE,
        CONSTRAINT FK_chat_messages_sender FOREIGN KEY (sender_user_id) REFERENCES dbo.users(id)
    );
    CREATE INDEX IX_chat_messages_conversation_id ON dbo.chat_messages(conversation_id, id);
END;
GO
