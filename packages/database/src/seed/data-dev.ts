import type { Prisma, PrismaClient, User } from '@pins/local-plans-reps-analysis-poc-database/src/client/client.ts';

/**
 * Role Configuration
 */
const ROLES = {
	ADMIN: 'admin',
	EDITOR: 'editor',
	VIEWER: 'viewer'
} as const;

const MOCK_USERS: Prisma.UserCreateInput[] = [
	{
		id: '00000000-0000-0000-0000-000000000001',
		entraId: '00000000-0000-0000-0000-000000000001',
		email: 'admin@example.com',
		fullName: 'Admin User',
		Role: { connectOrCreate: { where: { name: ROLES.ADMIN }, create: { name: ROLES.ADMIN } } }
	},
	{
		id: '00000000-0000-0000-0000-000000000002',
		entraId: '00000000-0000-0000-0000-000000000002',
		email: 'editor@example.com',
		fullName: 'Editor User',
		Role: { connectOrCreate: { where: { name: ROLES.EDITOR }, create: { name: ROLES.EDITOR } } }
	}
];

/**
 * Defines the shape of prompt generation variations
 */
interface PromptVariation {
	displayName: string;
	categoryName: string;
	authorId: string;
}

/**
 * Generates prompt definitions using the variation pattern
 */
function generatePromptDefinitions(users: User[]): PromptVariation[] {
	const categories = ['General', 'Planning', 'Legal'];
	const promptNames = ['Summary', 'Reviewer'];

	const variations: PromptVariation[] = [];

	categories.forEach((cat) => {
		promptNames.forEach((name) => {
			variations.push({
				displayName: `${cat} ${name}`,
				categoryName: cat,
				// Assign author
				authorId: users[variations.length % users.length].id
			});
		});
	});

	return variations;
}

export async function seedDev(dbClient: PrismaClient): Promise<void> {
	console.log('Starting Dev Seed ...');
	await clearDatabase(dbClient);

	// Seed Users
	for (const user of MOCK_USERS) {
		await dbClient.user.upsert({
			where: { entraId: user.entraId },
			create: user,
			update: user
		});
	}

	const allUsers = await dbClient.user.findMany();
	const promptDefinitions = generatePromptDefinitions(allUsers);

	// Seed Prompts and multiple history versions
	for (const def of promptDefinitions) {
		// Ensure Category
		const category = await dbClient.category.upsert({
			where: { name: def.categoryName },
			update: {},
			create: { name: def.categoryName }
		});

		// Create the Base Prompt
		const prompt = await dbClient.prompt.create({
			data: {
				displayName: def.displayName,
				authorId: def.authorId,
				categoryId: category.id
			}
		});

		// Generate 3-4 Versions per prompt
		const versionCount = 3 + Math.floor(Math.random() * 2); // Results in 3 or 4
		let lastVersionId: string | null = null;

		for (let i = 1; i <= versionCount; i++) {
			const editor = allUsers[i % allUsers.length];
			const version = await dbClient.promptVersion.create({
				data: {
					promptId: prompt.id,
					editorId: editor.id,
					content: `v${i}: Content for ${def.displayName}. Detailed instructions included.`,
					changeNote: i === 1 ? 'Initial creation' : `Revision iteration ${i}`
				}
			});
			lastVersionId = version.id;
		}

		// Update Prompt to point to latest version
		if (lastVersionId) {
			await dbClient.prompt.update({
				where: { id: prompt.id },
				data: { currentVersionId: lastVersionId }
			});
		}
	}

	const counts = {
		users: await dbClient.user.count(),
		prompts: await dbClient.prompt.count(),
		versions: await dbClient.promptVersion.count()
	};

	console.log('Dev Seed Completed ...', counts);
}

// clearDatabase - Deletes all data from the database.
async function clearDatabase(db: PrismaClient): Promise<void> {
	await db.$transaction([
		db.prompt.updateMany({ data: { currentVersionId: null } }),
		db.promptVersion.deleteMany(),
		db.prompt.deleteMany(),
		db.category.deleteMany(),
		db.user.deleteMany(),
		db.userRole.deleteMany()
	]);
}
