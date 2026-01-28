import { describe, test } from 'node:test';
import assert from 'assert';
import { validateAddPromptForm, parseString } from './validate-form.ts';
import type { AddPromptFormInput } from './interface.d.ts';

const ALLOWED = ['General', 'Planning', 'Consultation'];

describe('prompts/validate-form', () => {
	describe('parseString', () => {
		test('returns undefined for non-string', () => {
			assert.strictEqual(parseString(undefined), undefined);
			assert.strictEqual(parseString(null as unknown as string), undefined);
			assert.strictEqual(parseString(123 as unknown as string), undefined);
			assert.strictEqual(parseString({} as unknown as string), undefined);
		});
		test('trims and returns undefined for empty/whitespace', () => {
			assert.strictEqual(parseString(''), undefined);
			assert.strictEqual(parseString('   '), undefined);
		});
		test('trims and returns value for non-empty string', () => {
			assert.strictEqual(parseString('  hello  '), 'hello');
		});
	});

	describe('validateAddPromptForm', () => {
		test('flags missing required fields', () => {
			const input = {
				displayName: '   ',
				category: '   ',
				content: '   ',
				changeNote: '   '
			} as AddPromptFormInput;

			const result = validateAddPromptForm(input, ALLOWED);

			assert.strictEqual(result.isValid, false);
			assert.ok(result.fieldErrors);
			assert.ok(result.errorSummary);

			// fieldErrors content
			assert.strictEqual(result.fieldErrors?.displayName, 'Enter a name');
			assert.strictEqual(result.fieldErrors?.category, 'Select a category');
			assert.strictEqual(result.fieldErrors?.content, 'Content cannot be empty');

			// errorSummary order and anchors
			assert.deepStrictEqual(result.errorSummary?.[0], { text: 'Enter a name', href: '#displayName' });
			assert.deepStrictEqual(result.errorSummary?.[1], { text: 'Select a category', href: '#category' });
			assert.deepStrictEqual(result.errorSummary?.[2], { text: 'Content cannot be empty', href: '#content' });

			// trimmed form values should be undefined
			assert.deepStrictEqual(result.form, {
				displayName: undefined,
				category: undefined,
				content: undefined,
				changeNote: undefined
			});
		});

		test('valid when all fields provided and category allowed', () => {
			const input: AddPromptFormInput = {
				displayName: '  Good Name  ',
				category: '  General  ',
				content: '  Some content  ',
				changeNote: '  optional note  '
			};

			const result = validateAddPromptForm(input, ALLOWED);

			assert.strictEqual(result.isValid, true);
			assert.strictEqual(result.fieldErrors, undefined);
			assert.strictEqual(result.errorSummary, undefined);

			// trimmed form values and allowed category retained
			assert.deepStrictEqual(result.form, {
				displayName: 'Good Name',
				category: 'General',
				content: 'Some content',
				changeNote: 'optional note'
			});
		});

		test('handles undefined changeNote gracefully', () => {
			const input = {
				displayName: 'Name',
				category: 'General',
				content: 'Content'
			} as Partial<AddPromptFormInput> as AddPromptFormInput;

			const result = validateAddPromptForm(input, ALLOWED);
			assert.strictEqual(result.isValid, true);
			assert.strictEqual(result.form.changeNote, undefined);
		});
	});
});
