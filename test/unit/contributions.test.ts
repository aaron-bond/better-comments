import * as assert from 'assert';
import { readLanguageContributions } from '../../src/core/contributions';

// Other extensions' package.json, which nothing guarantees the shape of
describe('readLanguageContributions', () => {
    const read = (packageJSON: unknown) => [...readLanguageContributions(packageJSON)];

    it('lists the contributed languages that have a configuration', () => {
        assert.deepStrictEqual(read({
            contributes: {
                languages: [
                    { id: 'makefile', configuration: './language-configuration.json' },
                    { id: 'makefile-output' },
                ],
            },
        }), [{ id: 'makefile', configuration: './language-configuration.json' }]);
    });

    it('gives nothing for a manifest that contributes no languages', () => {
        assert.deepStrictEqual(read({}), []);
        assert.deepStrictEqual(read({ contributes: {} }), []);
        assert.deepStrictEqual(read({ contributes: null }), []);
        assert.deepStrictEqual(read({ contributes: { languages: 'makefile' } }), []);
    });

    it('skips entries whose id could never be looked up', () => {
        assert.deepStrictEqual(read({ contributes: { languages: [{ configuration: 'c.json' }, { id: 5, configuration: 'c.json' }, 'x', 7] } }), []);
    });

    it('throws where reading the manifest always has, after the entries before it', () => {
        const entries: unknown[] = [];
        const generator = readLanguageContributions({ contributes: { languages: [{ id: 'a', configuration: 'a.json' }, null] } });
        assert.throws(() => { for (const entry of generator) entries.push(entry); }, TypeError);
        assert.deepStrictEqual(entries, [{ id: 'a', configuration: 'a.json' }]);

        assert.throws(() => read({ contributes: { languages: { id: 'a' } } }), TypeError);
        assert.throws(() => read({ contributes: { languages: [{ id: 'a', configuration: 5 }] } }), TypeError);
    });
});
