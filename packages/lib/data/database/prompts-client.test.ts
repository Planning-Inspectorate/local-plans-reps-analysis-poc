import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';
import { PromptsClient } from './prompts-client.ts';
import type {
	PrismaClient,
	Prompt,
	PromptVersion,
	User,
	Category
} from '@pins/service-name-database/src/client/client.ts';
import type { Prisma } from '@pins/service-name-database/src/client/client.d.ts';

// Helper type for typed mock functions
type MockFn<T extends (...args: any[]) => any> = ReturnType<typeof mock.fn<T>>;

type PromptWithAuthorRelations = Prompt & {
	Author: User;
	Category?: Category | null;
	CurrentVersion?: PromptVersion | null;
	History: PromptVersion[];
};
type PromptVersionWithEditor = Prisma.PromptVersionGetPayload<{ include: { Editor: true } }>;

function makeMockUser(overrides: Partial<User> = {}): User {
	return {
		id: 'user-1',
		entraId: 'entra-1',
		email: 'user@example.com',
		fullName: 'Test User',
		roleId: 'role-1',
		Role: { id: 'role-1', name: 'editor', users: [] },
		PromptsCreated: [],
		EditsMade: [],
		...overrides
	} as unknown as User;
}

function makeMockCategory(overrides: Partial<Category> = {}): Category {
	return {
		id: 'cat-1',
		name: 'general',
		prompts: [],
		...overrides
	} as unknown as Category;
}

function makeMockPrompt(overrides: Partial<PromptWithAuthorRelations> = {}): PromptWithAuthorRelations {
	return {
		id: 'prompt-1',
		displayName: 'Welcome Message',
		createdAt: new Date('2025-01-01T00:00:00Z'),
		categoryId: null,
		Category: null,
		authorId: 'user-1',
		Author: makeMockUser(),
		currentVersionId: null,
		CurrentVersion: null,
		History: [],
		...overrides
	} as unknown as PromptWithAuthorRelations;
}

function makeMockVersion(overrides: Partial<PromptVersion> = {}): PromptVersion {
	return {
		id: 'version-1',
		content: 'Hello world',
		changeNote: 'Initial',
		createdAt: new Date('2025-01-02T00:00:00Z'),
		promptId: 'prompt-1',
		IsCurrentFor: null,
		editorId: 'user-1',
		Editor: makeMockUser(),
		...overrides
	} as unknown as PromptVersion;
}

function makeMockVersionWithEditor(overrides: Partial<PromptVersionWithEditor> = {}): PromptVersionWithEditor {
	return {
		id: 'version-1',
		content: 'Hello world',
		changeNote: 'Initial',
		createdAt: new Date('2025-01-02T00:00:00Z'),
		promptId: 'prompt-1',
		editorId: 'user-1',
		Editor: makeMockUser(),
		...overrides
	} as unknown as PromptVersionWithEditor;
}

// Create a mock prisma client object with only used methods
function makeMockPrisma(): {
	prompt: {
		findMany: MockFn<(args?: unknown) => Promise<PromptWithAuthorRelations[]>>;
		findUnique: MockFn<(args: unknown) => Promise<PromptWithAuthorRelations | null>>;
		findFirst: MockFn<(args: unknown) => Promise<PromptWithAuthorRelations | null>>;
		create: MockFn<(args: unknown) => Promise<PromptWithAuthorRelations>>;
		update: MockFn<(args: unknown) => Promise<PromptWithAuthorRelations>>;
		delete: MockFn<(args: unknown) => Promise<unknown>>;
	};
	promptVersion: {
		findMany: MockFn<(args: unknown) => Promise<PromptVersionWithEditor[]>>;
		create: MockFn<(args: unknown) => Promise<PromptVersion>>;
		deleteMany: MockFn<(args: unknown) => Promise<{ count: number }>>;
	};
	category: {
		findMany: MockFn<(args?: unknown) => Promise<Category[]>>;
	};
} {
	return {
		prompt: {
			findMany: mock.fn(),
			findUnique: mock.fn(),
			findFirst: mock.fn(),
			create: mock.fn(),
			update: mock.fn(),
			delete: mock.fn()
		},
		promptVersion: {
			findMany: mock.fn(),
			create: mock.fn(),
			deleteMany: mock.fn()
		},
		category: {
			findMany: mock.fn()
		}
	};
}

describe('PromptsClient', () => {
	let prisma: ReturnType<typeof makeMockPrisma>;
	let client: PromptsClient;

	beforeEach(() => {
		prisma = makeMockPrisma();
		client = new PromptsClient(prisma as unknown as PrismaClient);
	});

	it('should getAllPrompts returns summaries including author and latestVersion', async () => {
		const v1 = makeMockVersion({ id: 'v1', createdAt: new Date('2025-01-02T00:00:00Z') });
		const p1 = makeMockPrompt({ id: 'p1', displayName: 'Welcome', CurrentVersion: v1 });
		const p2 = makeMockPrompt({ id: 'p2', displayName: 'Goodbye', CurrentVersion: null });
		prisma.prompt.findMany = mock.fn(async () => [p1, p2]);

		const results = await client.getAllPrompts();
		assert.strictEqual(results.length, 2);

		assert.strictEqual(results[0].id, 'p1');
		assert.strictEqual(results[0].author.email, 'user@example.com');
		assert.ok(results[0].latestVersion);
		assert.strictEqual(results[0].latestVersion?.id, 'v1');

		assert.strictEqual(results[1].id, 'p2');
		assert.strictEqual(results[1].latestVersion, undefined);
		assert.strictEqual(prisma.prompt.findMany.mock.callCount(), 1);
	});

	it('should getPromptById returns prompt with latestVersion', async () => {
		const v1 = makeMockVersion({ id: 'v1' });
		const prompt = makeMockPrompt({ CurrentVersion: v1 });
		prisma.prompt.findUnique = mock.fn(async () => prompt);

		const result = await client.getPromptById('prompt-1');
		assert.ok(result);
		assert.strictEqual(result?.id, 'prompt-1');
		// result includes latestVersion per client implementation
		assert.ok((result as unknown as { latestVersion?: PromptVersion }).latestVersion);
		assert.strictEqual((result as unknown as { latestVersion?: PromptVersion }).latestVersion?.id, 'v1');
		assert.strictEqual(prisma.prompt.findUnique.mock.callCount(), 1);
	});

	it('should return null when getPromptById not found', async () => {
		prisma.prompt.findUnique = mock.fn(async () => null);
		const result = await client.getPromptById('missing');
		assert.strictEqual(result, null);
	});

	it('should createPrompt creates prompt and initial version', async () => {
		const createdPrompt = makeMockPrompt();
		prisma.prompt.create = mock.fn(async (_args: unknown) => createdPrompt);
		const input = {
			displayName: 'Welcome Message',
			category: 'general',
			content: 'Hello world',
			changeNote: 'Initial',
			editorUserId: 'user-1'
		};
		const result = await client.createPrompt(input as any);
		assert.strictEqual(result.id, createdPrompt.id);
		assert.strictEqual(prisma.prompt.create.mock.callCount(), 1);

		// Validate the shape of the create call
		const args = prisma.prompt.create.mock.calls[0].arguments[0] as { data: any };
		assert.strictEqual(args.data.displayName, input.displayName);
		// Category connected by unique name
		assert.deepStrictEqual(args.data.Category?.connect, { name: 'general' });
		assert.deepStrictEqual(args.data.Author.connect, { id: 'user-1' });
		assert.strictEqual(args.data.History.create.content, input.content);
		assert.deepStrictEqual(args.data.History.create.Editor.connect, { id: 'user-1' });
	});

	it('should updatePrompt appends a new version and sets CurrentVersion', async () => {
		prisma.prompt.findUnique = mock.fn(async () => makeMockPrompt());
		const createdVersion = makeMockVersion({ id: 'v2', changeNote: 'Update' });
		prisma.promptVersion.create = mock.fn(async (_args: unknown) => createdVersion);
		prisma.prompt.update = mock.fn(async (_args: unknown) => makeMockPrompt({ CurrentVersion: createdVersion }));

		const input = { promptId: 'prompt-1', content: 'Updated text', changeNote: 'Update', editorUserId: 'user-1' };
		const result = await client.updatePrompt(input);
		assert.strictEqual(result.id, 'v2');
		assert.strictEqual(prisma.promptVersion.create.mock.callCount(), 1);
		assert.strictEqual(prisma.prompt.update.mock.callCount(), 1);

		const args = prisma.promptVersion.create.mock.calls[0].arguments[0] as { data: any };
		assert.strictEqual(args.data.content, input.content);
		assert.strictEqual(args.data.changeNote, input.changeNote);
		assert.deepStrictEqual(args.data.Prompt.connect, { id: 'prompt-1' });
		assert.deepStrictEqual(args.data.Editor.connect, { id: 'user-1' });

		const updArgs = prisma.prompt.update.mock.calls[0].arguments[0] as { data: any };
		assert.deepStrictEqual(updArgs.data.CurrentVersion.connect, { id: 'v2' });
	});

	it('should listPromptHistory returns versions with Editor included', async () => {
		const v1 = makeMockVersionWithEditor({ id: 'v1' });
		const v2 = makeMockVersionWithEditor({ id: 'v2' });
		prisma.promptVersion.findMany = mock.fn(async () => [v2, v1]);

		const result = await client.listPromptHistory('prompt-1');
		assert.strictEqual(result.length, 2);
		assert.strictEqual(result[0].id, 'v2');
		assert.strictEqual((result as unknown as Array<{ Editor: User }>)[0].Editor.email, 'user@example.com');
		assert.strictEqual(prisma.promptVersion.findMany.mock.callCount(), 1);
	});

	it('should deletePrompt removes versions and prompt', async () => {
		prisma.promptVersion.deleteMany = mock.fn(async () => ({ count: 2 }));
		prisma.prompt.delete = mock.fn(async () => ({}));

		await client.deletePrompt('prompt-1');

		assert.strictEqual(prisma.promptVersion.deleteMany.mock.callCount(), 1);
		assert.strictEqual(prisma.prompt.delete.mock.callCount(), 1);
		const delManyArgs = prisma.promptVersion.deleteMany.mock.calls[0].arguments[0] as { where: any };
		const delArgs = prisma.prompt.delete.mock.calls[0].arguments[0] as { where: any };
		assert.deepStrictEqual(delManyArgs.where, { promptId: 'prompt-1' });
		assert.deepStrictEqual(delArgs.where, { id: 'prompt-1' });
	});

	it('should listPromptCategories returns sorted category names', async () => {
		const c1 = makeMockCategory({ id: 'c1', name: 'alpha' });
		const c2 = makeMockCategory({ id: 'c2', name: 'beta' });
		prisma.category.findMany = mock.fn(async () => [c1, c2]);

		const result = await client.listPromptCategories();
		assert.deepStrictEqual(result, ['alpha', 'beta']);
		assert.strictEqual(prisma.category.findMany.mock.callCount(), 1);
		const args = prisma.category.findMany.mock.calls[0].arguments[0] as { orderBy: any };
		assert.deepStrictEqual(args.orderBy, { name: 'asc' });
	});
});
