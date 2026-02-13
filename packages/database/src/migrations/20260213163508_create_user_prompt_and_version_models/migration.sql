BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] NVARCHAR(1000) NOT NULL,
    [entraId] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000),
    [fullName] NVARCHAR(1000),
    [roleId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_entraId_key] UNIQUE NONCLUSTERED ([entraId]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[UserRole] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [UserRole_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UserRole_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[Prompt] (
    [id] NVARCHAR(1000) NOT NULL,
    [displayName] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Prompt_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [categoryId] NVARCHAR(1000),
    [authorId] NVARCHAR(1000) NOT NULL,
    [currentVersionId] NVARCHAR(1000),
    CONSTRAINT [Prompt_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Category] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Category_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Category_name_key] UNIQUE NONCLUSTERED ([name])
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
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_roleId_fkey] FOREIGN KEY ([roleId]) REFERENCES [dbo].[UserRole]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Prompt] ADD CONSTRAINT [Prompt_categoryId_fkey] FOREIGN KEY ([categoryId]) REFERENCES [dbo].[Category]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Prompt] ADD CONSTRAINT [Prompt_authorId_fkey] FOREIGN KEY ([authorId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Prompt] ADD CONSTRAINT [Prompt_currentVersionId_fkey] FOREIGN KEY ([currentVersionId]) REFERENCES [dbo].[PromptVersion]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

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
