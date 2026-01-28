BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] NVARCHAR(1000) NOT NULL,
    [entraId] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [fullName] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_entraId_key] UNIQUE NONCLUSTERED ([entraId]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Prompt] (
    [id] NVARCHAR(1000) NOT NULL,
    [slug] NVARCHAR(1000) NOT NULL,
    [displayName] NVARCHAR(1000) NOT NULL,
    [category] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Prompt_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [authorId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Prompt_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Prompt_slug_key] UNIQUE NONCLUSTERED ([slug])
);

-- CreateTable
CREATE TABLE [dbo].[PromptVersion] (
    [id] NVARCHAR(1000) NOT NULL,
    [content] TEXT NOT NULL,
    [changeNote] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [PromptVersion_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [promptId] NVARCHAR(1000) NOT NULL,
    [editorId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [PromptVersion_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[Prompt] ADD CONSTRAINT [Prompt_authorId_fkey] FOREIGN KEY ([authorId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[PromptVersion] ADD CONSTRAINT [PromptVersion_promptId_fkey] FOREIGN KEY ([promptId]) REFERENCES [dbo].[Prompt]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[PromptVersion] ADD CONSTRAINT [PromptVersion_editorId_fkey] FOREIGN KEY ([editorId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
