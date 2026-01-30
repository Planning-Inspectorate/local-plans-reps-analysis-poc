import type { PrismaClient } from '@pins/service-name-database/src/client/client.ts';

// Ensure a role exists and return it
async function ensureRole(db: PrismaClient, name: string) {
	return db.userRole.upsert({
		where: { name },
		update: {},
		create: { name }
	});
}

// Ensure a category exists (by unique name) and return it
async function ensureCategory(db: PrismaClient, name: string | null | undefined) {
	if (!name) return null;
	return db.category.upsert({
		where: { name },
		update: {},
		create: { name }
	});
}

// Seed helper to upsert a user by email and assign role by name
async function upsertUser(db: PrismaClient, user: { entraId: string; email: string; fullName: string; role: string }) {
	const role = await ensureRole(db, user.role);
	return db.user.upsert({
		where: { email: user.email },
		update: {
			fullName: user.fullName,
			roleId: role.id
		},
		create: {
			entraId: user.entraId,
			email: user.email,
			fullName: user.fullName,
			roleId: role.id
		}
	});
}

// Seed helper to find or create a prompt (slug removed from schema), ensuring author and category
async function getOrCreatePrompt(
	db: PrismaClient,
	prompt: { displayName: string; category?: string | null; authorId: string }
) {
	const category = await ensureCategory(db, prompt.category ?? null);

	// No unique identifier on Prompt other than id/currentVersionId, so we findFirst by displayName+authorId
	const existing = await db.prompt.findFirst({
		where: { displayName: prompt.displayName, authorId: prompt.authorId }
	});

	if (existing) {
		// Keep displayName up-to-date and category association
		return db.prompt.update({
			where: { id: existing.id },
			data: {
				displayName: prompt.displayName,
				categoryId: category?.id ?? null,
				authorId: prompt.authorId
			}
		});
	}

	return db.prompt.create({
		data: {
			displayName: prompt.displayName,
			categoryId: category?.id ?? null,
			authorId: prompt.authorId
		}
	});
}

// Seed helper to create a new version only if an identical version content doesn't already exist
async function ensurePromptVersion(
	db: PrismaClient,
	version: { promptId: string; editorId: string; content: string; changeNote?: string | null }
) {
	const candidates = await db.promptVersion.findMany({
		where: {
			promptId: version.promptId,
			changeNote: version.changeNote ?? null
		}
	});

	const existing = candidates.find((pv) => pv.content === version.content);
	if (existing) return existing;

	return db.promptVersion.create({
		data: {
			content: version.content,
			changeNote: version.changeNote ?? null,
			Prompt: { connect: { id: version.promptId } },
			Editor: { connect: { id: version.editorId } }
		}
	});
}

export async function seedDev(dbClient: PrismaClient) {
	// Create a small set of users
	const admin = await upsertUser(dbClient, {
		entraId: '00000000-0000-0000-0000-000000000001',
		email: 'admin@example.com',
		fullName: 'Admin User',
		role: 'admin'
	});

	const editor = await upsertUser(dbClient, {
		entraId: '00000000-0000-0000-0000-000000000002',
		email: 'editor@example.com',
		fullName: 'Editor User',
		role: 'editor'
	});

	// Create an extra viewer user (not used elsewhere)
	await upsertUser(dbClient, {
		entraId: '00000000-0000-0000-0000-000000000003',
		email: 'viewer@example.com',
		fullName: 'Viewer User',
		role: 'viewer'
	});

	// Create prompts authored by users
	const welcomePrompt = await getOrCreatePrompt(dbClient, {
		displayName: 'Welcome Message',
		category: 'general',
		authorId: editor.id
	});

	const goodbyePrompt = await getOrCreatePrompt(dbClient, {
		displayName: 'Goodbye Message',
		category: 'general',
		authorId: admin.id
	});

	const planningPrompt = await getOrCreatePrompt(dbClient, {
		displayName: 'Planning Overview',
		category: 'planning',
		authorId: editor.id
	});

	// Seed versions for each prompt, linking to editors
	await ensurePromptVersion(dbClient, {
		promptId: welcomePrompt.id,
		editorId: editor.id,
		content: 'Hello and welcome to our service! Please follow the setup steps.',
		changeNote: 'Initial version'
	});

	await ensurePromptVersion(dbClient, {
		promptId: welcomePrompt.id,
		editorId: admin.id,
		content: 'Updated welcome with a link to the documentation.',
		changeNote: 'Added docs link'
	});

	await ensurePromptVersion(dbClient, {
		promptId: goodbyePrompt.id,
		editorId: admin.id,
		content: 'Thanks for visiting! See you next time.',
		changeNote: 'Initial version'
	});

	await ensurePromptVersion(dbClient, {
		promptId: planningPrompt.id,
		editorId: editor.id,
		content: 'Provide a summary of the local plan including key dates and stakeholders.',
		changeNote: 'Initial guidance'
	});

	await ensurePromptVersion(dbClient, {
		promptId: planningPrompt.id,
		editorId: editor.id,
		content: 'Add sections for risk assessment and community feedback.',
		changeNote: 'Expanded sections'
	});

	const promptCount = await dbClient.prompt.count();
	const userCount = await dbClient.user.count();
	const versionCount = await dbClient.promptVersion.count();

	console.log(`Dev seed complete: users=${userCount}, prompts=${promptCount}, versions=${versionCount}`);
}
