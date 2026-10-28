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

    it('drops a colour that is not a string, which a decoration could not use', () => {
        assert.strictEqual(tag({ color: '#fff' }).color, '#fff');
        assert.strictEqual(tag({ color: 5 }).color, undefined);
        assert.strictEqual(tag({ backgroundColor: { r: 0 } }).backgroundColor, undefined);
        assert.strictEqual(tag({}).color, undefined);
    });

    it('throws for a tag that is not a string, as the parser always has', () => {
        assert.throws(() => readSettings({ tags: [{ tag: 5 }] }), TypeError);
        assert.throws(() => readSettings({ tags: [{ color: '#fff' }] }), TypeError);
        assert.throws(() => readSettings({ tags: [null] }), TypeError);
        assert.throws(() => readSettings({ tags: ['!'] }), TypeError);
    });

    it('throws for tags that are not a list, as the parser always has, except an empty string', () => {
        assert.throws(() => readSettings({}), TypeError);
        assert.throws(() => readSettings({ tags: { tag: '!' } }), TypeError);
        assert.throws(() => readSettings({ tags: '!' }), TypeError);
        // for...of over "" ran no iterations, so it gave no tags
        assert.deepStrictEqual(readSettings({ tags: '' }).tags, []);
    });
});
