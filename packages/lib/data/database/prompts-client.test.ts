import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';
import { PromptsClient } from './prompts-client.ts';
import {
	Prisma,
	type Prompt,
	type PromptVersion,
	type User,
	type Category
} from '@pins/local-plans-reps-analysis-poc-database/src/client/client.ts';
import { PrismaClient } from '@pins/local-plans-reps-analysis-poc-database/src/client/client.ts';
import type { CreatePromptInput } from '../interface.d.ts';

// Types with relations for easier mocking
export type PromptWithRelations = Prisma.PromptGetPayload<{
	include: { Author: true; Category: true; CurrentVersion: true; History: true };
}>;

export type VersionWithRelations = Prisma.PromptVersionGetPayload<{
	include: { Editor: true; Prompt: true };
}>;

// Mock Prisma client for testing.
class MockPrismaClient {
	user = {
		upsert: mock.fn<(args: Prisma.UserUpsertArgs) => Promise<User>>()
	};
	category = {
		findMany: mock.fn<(args: Prisma.CategoryFindManyArgs) => Promise<Category[]>>()
	};
	promptVersion = {
		findMany: mock.fn<(args: Prisma.PromptVersionFindManyArgs) => Promise<VersionWithRelations[]>>(),
		create: mock.fn<(args: Prisma.PromptVersionCreateArgs) => Promise<PromptVersion>>(),
		deleteMany: mock.fn<(args: Prisma.PromptVersionDeleteManyArgs) => Promise<Prisma.BatchPayload>>()
	};
	prompt = {
		findMany: mock.fn<(args: Prisma.PromptFindManyArgs) => Promise<PromptWithRelations[]>>(),
		findUnique: mock.fn<(args: Prisma.PromptFindUniqueArgs) => Promise<PromptWithRelations | null>>(),
		create: mock.fn<(args: Prisma.PromptCreateArgs) => Promise<PromptWithRelations>>(),
		update: mock.fn<(args: Prisma.PromptUpdateArgs) => Promise<PromptWithRelations>>(),
		delete: mock.fn<(args: Prisma.PromptDeleteArgs) => Promise<Prompt>>()
	};

	async $transaction<T>(action: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
		// Cast 'this' to TransactionClient as the mock structure mirrors the interface
		return await action(this as unknown as Prisma.TransactionClient);
	}
}

export function createMockUser(overrides: Partial<User> = {}): User {
	return {
		id: 'user-1',
		entraId: 'entra-1',
		email: 'user@example.com',
		fullName: 'Test User',
		roleId: 'role-1',
		...overrides
	} as User;
}

export function createMockPrompt(overrides: Partial<PromptWithRelations> = {}): PromptWithRelations {
	return {
		id: 'prompt-1',
		displayName: 'Welcome Message',
		createdAt: new Date('2025-01-01T00:00:00Z'),
		categoryId: 'cat-1',
		authorId: 'user-1',
		currentVersionId: 'v1',
		Author: createMockUser(),
		Category: { id: 'cat-1', name: 'general' } as Category,
		CurrentVersion: { id: 'v1', content: 'Hello', createdAt: new Date() } as PromptVersion,
		History: [],
		...overrides
	};
}

describe('PromptsClient', () => {
	let mockDb: MockPrismaClient;
	let client: PromptsClient;

	beforeEach(() => {
		mockDb = new MockPrismaClient();
		client = new PromptsClient(mockDb as unknown as PrismaClient);
	});

	describe('getAllPrompts', () => {
		it('should return mapped prompt summaries', async () => {
			mockDb.prompt.findMany.mock.mockImplementation(async () => [createMockPrompt()]);
			const result = await client.getAllPrompts();
			assert.strictEqual(result[0].displayName, 'Welcome Message');
		});
	});

	describe('getPromptById', () => {
		it('should return a prompt with its latest version when found', async () => {
			mockDb.prompt.findUnique.mock.mockImplementation(async () => createMockPrompt());
			const result = await client.getPromptById('prompt-1');
			assert.strictEqual(result?.id, 'prompt-1');
		});

		it('should return null when the prompt does not exist', async () => {
			mockDb.prompt.findUnique.mock.mockImplementation(async () => null);
			const result = await client.getPromptById('invalid');
			assert.strictEqual(result, null);
		});
	});

	describe('createPrompt', () => {
		it('should execute transaction to create prompt and set current version', async () => {
			const mockPrompt = createMockPrompt({ History: [{ id: 'v1' } as PromptVersion] });

			mockDb.user.upsert.mock.mockImplementation(async () => createMockUser());
			mockDb.prompt.create.mock.mockImplementation(async () => mockPrompt);
			mockDb.prompt.update.mock.mockImplementation(async () => mockPrompt);

			const input: CreatePromptInput = {
				displayName: 'New Prompt',
				content: 'Content',
				category: 'general',
				entraId: 'id-123',
				fullName: 'Test',
				email: 'test@test.com'
			};

			const result = await client.createPrompt(input);
			assert.ok(result);
			assert.strictEqual(mockDb.prompt.create.mock.callCount(), 1);
		});
	});

	describe('updatePrompt', () => {
		it('should create a new version and update the pointer', async () => {
			const mockPrompt = createMockPrompt();
			const mockVersion = { id: 'v2' } as PromptVersion;

			mockDb.prompt.findUnique.mock.mockImplementation(async () => mockPrompt);
			mockDb.user.upsert.mock.mockImplementation(async () => createMockUser());
			mockDb.promptVersion.create.mock.mockImplementation(async () => mockVersion);
			mockDb.prompt.update.mock.mockImplementation(async () => mockPrompt);

			const input: any = {
				promptId: 'prompt-1',
				content: 'New Content',
				entraId: 'user-123'
			};

			await client.updatePrompt(input);
			const updateArgs = mockDb.prompt.update.mock.calls[0].arguments[0];
			assert.deepStrictEqual(updateArgs.data.CurrentVersion?.connect, { id: 'v2' });
		});

		it('should throw error if prompt is not found', async () => {
			mockDb.prompt.findUnique.mock.mockImplementation(async () => null);
			await assert.rejects(
				client.updatePrompt({ promptId: 'invalid', content: '', entraId: '' } as any),
				/Prompt not found/
			);
		});
	});

	describe('listPromptCategories', () => {
		it('should return names of all categories', async () => {
			mockDb.category.findMany.mock.mockImplementation(async () => [{ name: 'cat1' } as Category]);
			const result = await client.listPromptCategories();
			assert.deepStrictEqual(result, ['cat1']);
		});
	});

	describe('listPromptHistory', () => {
		it('should return all versions for a prompt', async () => {
			mockDb.promptVersion.findMany.mock.mockImplementation(async () => [{} as VersionWithRelations]);
			const result = await client.listPromptHistory('prompt-1');
			assert.strictEqual(result.length, 1);
		});
	});

	describe('deletePrompt', () => {
		it('should nullify current version, delete history, then delete prompt', async () => {
			mockDb.prompt.update.mock.mockImplementation(async () => createMockPrompt());
			mockDb.promptVersion.deleteMany.mock.mockImplementation(async () => ({ count: 5 }));
			mockDb.prompt.delete.mock.mockImplementation(async () => createMockPrompt());

			await client.deletePrompt('prompt-1');
			assert.strictEqual(mockDb.prompt.delete.mock.callCount(), 1);
		});
	});
});
