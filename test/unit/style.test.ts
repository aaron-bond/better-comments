import * as assert from 'assert';
import { toTagStyle } from '../../src/core/style';
import { prepareTag } from '../../src/core/tags';

describe('style', () => {
    // pinned 5: textDecoration is built by joining strings
    const decorations: Array<[boolean, boolean, string]> = [
        [false, false, ''],
        [true, false, 'line-through'],
        [false, true, ' underline'],
        [true, true, 'line-through underline'],
    ];
    for (const [strikethrough, underline, expected] of decorations) {
        it(`pinned 5: textDecoration is ${JSON.stringify(expected)} for strikethrough=${strikethrough}, underline=${underline}`, () => {
            assert.strictEqual(toTagStyle({ tag: '!', color: '#fff', strikethrough, underline }).textDecoration, expected);
        });
    }

    it('sets fontWeight and fontStyle only when asked', () => {
        assert.deepStrictEqual(toTagStyle({ tag: '!', color: '#fff', bold: true, italic: true }),
            { color: '#fff', backgroundColor: undefined, textDecoration: '', fontWeight: 'bold', fontStyle: 'italic' });
        const plain = toTagStyle({ tag: '!', color: '#fff', bold: false, italic: false });
        assert.ok(!('fontWeight' in plain) && !('fontStyle' in plain));
    });

    it('always has a backgroundColor key, even when not configured', () => {
        const style = toTagStyle({ tag: '!', color: '#fff' });
        assert.ok('backgroundColor' in style);
        assert.strictEqual(style.backgroundColor, undefined);
    });

    it('keeps the key order the parser has always produced', () => {
        const style = toTagStyle({ tag: '!', color: '#fff', backgroundColor: 'transparent', strikethrough: true, bold: true, italic: true });
        assert.deepStrictEqual(Object.keys(style), ['color', 'backgroundColor', 'textDecoration', 'fontWeight', 'fontStyle']);
    });

    it('treats style flags by truthiness, as settings.json allows any value', () => {
        assert.strictEqual(toTagStyle({ tag: '!', color: '#fff', bold: 'yes' as any }).fontWeight, 'bold');
        assert.strictEqual(toTagStyle({ tag: '!', color: '#fff', bold: 0 as any }).fontWeight, undefined);
    });

    describe('prepareTag', () => {
        it('combines the tag, its escaped form and its style', () => {
            assert.deepStrictEqual(prepareTag({ tag: '?', color: '#3498DB', backgroundColor: 'transparent' }), {
                tag: '?',
                escapedTag: '\\?',
                style: { color: '#3498DB', backgroundColor: 'transparent', textDecoration: '' },
            });
        });

        it('throws for a tag that is not a string, as the parser always has', () => {
            assert.throws(() => prepareTag({ tag: 5 as any, color: '#fff' }), TypeError);
        });
    });
});
