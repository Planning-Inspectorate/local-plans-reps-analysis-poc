import type { PrismaClient } from '@pins/service-name-database/src/client/client.ts';

// Seed helper to upsert a user by email
async function upsertUser(db: PrismaClient, user: { entraId: string; email: string; fullName: string; role: string }) {
	return db.user.upsert({
		where: { email: user.email },
		update: {
			fullName: user.fullName,
			role: user.role
		},
		create: {
			entraId: user.entraId,
			email: user.email,
			fullName: user.fullName,
			role: user.role
		}
	});
}

// Seed helper to upsert a prompt by slug and ensure author relation
async function upsertPrompt(
	db: PrismaClient,
	prompt: { slug: string; displayName: string; category?: string | null; authorId: string }
) {
	return db.prompt.upsert({
		where: { slug: prompt.slug },
		update: {
			displayName: prompt.displayName,
			category: prompt.category ?? null,
			authorId: prompt.authorId
		},
		create: {
			slug: prompt.slug,
			displayName: prompt.displayName,
			category: prompt.category ?? null,
			Author: { connect: { id: prompt.authorId } }
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
	const welcomePrompt = await upsertPrompt(dbClient, {
		slug: 'welcome-message',
		displayName: 'Welcome Message',
		category: 'general',
		authorId: editor.id
	});

	const goodbyePrompt = await upsertPrompt(dbClient, {
		slug: 'goodbye-message',
		displayName: 'Goodbye Message',
		category: 'general',
		authorId: admin.id
	});

	const planningPrompt = await upsertPrompt(dbClient, {
		slug: 'planning-overview',
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
