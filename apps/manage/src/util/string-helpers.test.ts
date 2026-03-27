import { describe, it } from 'node:test';
import assert from 'node:assert';
import { capitalizeWords } from '#util/string-helpers.ts';

describe('String Helpers: capitalizeWords', () => {
	it('should capitalize the first letter of each word', () => {
		const input = 'sarah jane';
		const result = capitalizeWords(input);
		assert.strictEqual(result, 'Sarah Jane');
	});

	it('should fix "SHOUTING" text by making lowercase after the first letter', () => {
		const input = 'HELLO WORLD';
		const result = capitalizeWords(input);
		assert.strictEqual(result, 'Hello World');
	});

	it('should handle messy extra spaces between words', () => {
		const input = '  too    many   spaces  ';
		const result = capitalizeWords(input).trim();
		assert.strictEqual(result, 'Too Many Spaces');
	});

	it('should return an empty string if given an empty input', () => {
		assert.strictEqual(capitalizeWords(''), '');
	});

	it('should handle words that are already correct', () => {
		const input = 'London';
		assert.strictEqual(capitalizeWords(input), 'London');
	});

	it('should capitalize single letters', () => {
		assert.strictEqual(capitalizeWords('a b c'), 'A B C');
	});
});
