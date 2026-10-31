import * as assert from 'assert';
import { readSettings } from '../../src/core/settings';

// What settings.json can hand the parser: any JSON value, whatever the schema in package.json says
describe('readSettings', () => {
    const tag = (fields: Record<string, unknown>) => readSettings({ tags: [{ tag: '!', ...fields }] }).tags[0];

    it('reads valid settings unchanged', () => {
        assert.deepStrictEqual(readSettings({
            tags: [{ tag: '!', color: '#FF2D00', strikethrough: false, underline: false, backgroundColor: 'transparent', bold: false, italic: false }],
            multilineComments: true,
            highlightPlainText: false,
        }), {
            tags: [{ tag: '!', color: '#FF2D00', strikethrough: false, underline: false, backgroundColor: 'transparent', bold: false, italic: false }],
            multilineComments: true,
            highlightPlainText: false,
        });
    });

    it('reads any flag value by its truthiness, as the parser always has', () => {
        assert.strictEqual(tag({ bold: 'yes' }).bold, true);
        assert.strictEqual(tag({ bold: 0 }).bold, false);
        assert.strictEqual(tag({}).italic, false);
        assert.strictEqual(readSettings({ tags: [], highlightPlainText: 'yes' }).highlightPlainText, true);
        assert.strictEqual(readSettings({ tags: [] }).multilineComments, false);
    });

    it('keeps a colour string', () => {
        assert.strictEqual(tag({ color: '#fff' }).color, '#fff');
        assert.strictEqual(tag({ backgroundColor: 'transparent' }).backgroundColor, 'transparent');
    });

    it('keeps a theme colour, an object with a string id, as VS Code reads it', () => {
        assert.deepStrictEqual(tag({ color: { id: 'editorError.foreground' } }).color, { id: 'editorError.foreground' });
        assert.deepStrictEqual(tag({ backgroundColor: { id: 'editor.background', alpha: 1 } }).backgroundColor, { id: 'editor.background' });
    });

    it('drops any other colour, which VS Code could not use', () => {
        for (const value of [5, true, ['#fff'], {}, { id: 5 }, null]) {
            assert.strictEqual(tag({ color: value, backgroundColor: value }).color, undefined, JSON.stringify(value));
            assert.strictEqual(tag({ color: value, backgroundColor: value }).backgroundColor, undefined, JSON.stringify(value));
        }
        assert.strictEqual(tag({}).color, undefined);
    });

    it('skips a tag that is not a string, and keeps the others in order (#552)', () => {
        const tags = readSettings({ tags: [{ tag: 5 }, { tag: '!' }, { color: '#fff' }, null, '!', { tag: '?' }] }).tags;
        assert.deepStrictEqual(tags.map(t => t.tag), ['!', '?']);
    });

    it('gives no tags for tags that are not a list', () => {
        for (const tags of [undefined, null, { tag: '!' }, '!', '', 5]) {
            assert.deepStrictEqual(readSettings({ tags }).tags, [], JSON.stringify(tags));
        }
        assert.deepStrictEqual(readSettings({}).tags, []);
    });

    it('never throws, whatever the settings hold', () => {
        for (const raw of [undefined, null, 5, 'x', [], { tags: [[]] }, { tags: [{ tag: '!', color: { id: null } }] }]) {
            assert.doesNotThrow(() => readSettings(raw), JSON.stringify(raw));
        }
    });
});
