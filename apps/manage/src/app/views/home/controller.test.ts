import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { configureNunjucks } from '../../nunjucks.ts';
import { buildViewHome, buildPostHome } from './controller.ts';
import { mockLogger } from '@pins/service-name-lib/testing/mock-logger.ts';
import XLSX from 'xlsx';
import type { HomeView } from './interface.ts';
import type { Request, Response } from 'express';
import type { ManageService } from '#service';
import type { FileUpload } from '../../comments/interface.ts';

// Helper to create a csv buffer for testing
export const mockCsvFile = (content: string): FileUpload => {
	const buffer = Buffer.from(content);
	return {
		fieldname: 'comments',
		originalname: 'upload.csv',
		encoding: '7bit',
		mimetype: 'text/csv',
		size: buffer.length,
		buffer
	} as FileUpload;
};

// Helper to create an xlsx buffer for testing
export const mockExcelFile = (rows: Array<Record<string, string>>): FileUpload => {
	const worksheet = XLSX.utils.json_to_sheet(rows);
	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
	const buffer: Buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
	return {
		fieldname: 'comments',
		originalname: 'upload.xlsx',
		encoding: '7bit',
		mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		size: buffer.length,
		buffer
	} as FileUpload;
};

// configure nunjucks once for all tests
const nunjucks = configureNunjucks();

// minimal helpers to create req/res mocks
const createRender = (nunjucks: ReturnType<typeof configureNunjucks>) =>
	mock.fn((view: string, data?: HomeView) => nunjucks.render(view, (data ?? {}) as object));

type RequestWithFile = Request & { file?: FileUpload };

describe('home controller', () => {
	it('GET buildViewHome should render home view', async () => {
		const render = createRender(nunjucks);
		const res = { render } as Partial<Response> as Response;
		const req = {} as Request;

		// @ts-ignore
		const service: ManageService = { logger: mockLogger() };
		const handler = buildViewHome(service);
		await assert.doesNotReject(() => handler(req, res));

		assert.strictEqual(render.mock.callCount(), 1);
		const [view] = render.mock.calls[0].arguments as [string];
		assert.strictEqual(view, 'views/home/view.njk');
	});

	it('POST buildPostHome should render error when no file provided', async () => {
		const render = createRender(nunjucks);
		const res = { render } as Partial<Response> as Response;
		const req = {} as RequestWithFile;

		// @ts-ignore
		const service: ManageService = { logger: mockLogger() };
		const handler = buildPostHome(service);
		await assert.doesNotReject(() => handler(req, res));

		assert.strictEqual(render.mock.callCount(), 1);
		const [view, data] = render.mock.calls[0].arguments as [string, HomeView];
		assert.strictEqual(view, 'views/home/view.njk');
		assert.ok(data);
		assert.ok(data.errorMessage);
		assert.strictEqual(data.errorMessage?.text, 'Please Select a file');
	});

	it('POST buildPostHome should parse CSV and render analysis', async () => {
		const render = createRender(nunjucks);
		const res = { render } as Partial<Response> as Response;
		const csvContent = ['Comments,Other', 'First,1', ',2', 'Third,3'].join('\n');
		const req = { file: mockCsvFile(csvContent) } as RequestWithFile;

		// @ts-ignore
		const service: ManageService = { logger: mockLogger() };
		const handler = buildPostHome(service);
		await assert.doesNotReject(() => handler(req, res));

		assert.strictEqual(render.mock.callCount(), 1);
		const [view, data] = render.mock.calls[0].arguments as [string, HomeView];
		assert.strictEqual(view, 'views/home/view.njk');
		assert.ok(data);
		// expect commentsData populated and errorMessage not set
		assert.ok(data.commentsData);
		assert.strictEqual(data.commentsData?.fileType, 'csv');
		assert.strictEqual(data.commentsData?.fileName, 'upload.csv');
		assert.strictEqual(data.commentsData?.totalCount, 2);
		assert.deepStrictEqual(data.commentsData?.comments, ['First', 'Third']);
		assert.ok(!data.errorMessage);
	});

	it('POST buildPostHome should parse excel and render analysis', async () => {
		const render = createRender(nunjucks);
		const res = { render } as Partial<Response> as Response;
		const rows = [
			{ Comments: 'First', Other: '1' },
			{ Comments: '', Other: '2' },
			{ Comments: 'Third', Other: '3' }
		];
		const req = { file: mockExcelFile(rows) } as RequestWithFile;

		// @ts-ignore
		const service: ManageService = { logger: mockLogger() };
		const handler = buildPostHome(service);
		await assert.doesNotReject(() => handler(req, res));

		assert.strictEqual(render.mock.callCount(), 1);
		const [view, data] = render.mock.calls[0].arguments as [string, HomeView];
		assert.strictEqual(view, 'views/home/view.njk');
		assert.ok(data);
		assert.ok(data.commentsData);
		assert.strictEqual(data.commentsData?.fileType, 'excel');
		assert.strictEqual(data.commentsData?.fileName, 'upload.xlsx');
		assert.strictEqual(data.commentsData?.totalCount, 2);
		assert.deepStrictEqual(data.commentsData?.comments, ['First', 'Third']);
		assert.ok(!data.errorMessage);
	});
});
