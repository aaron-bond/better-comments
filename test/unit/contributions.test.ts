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
        assert.deepStrictEqual(read({ contributes: { languages: { id: 'a', configuration: 'a.json' } } }), []);
        assert.deepStrictEqual(read(null), []);
    });

    it('skips entries whose id could never be looked up', () => {
        assert.deepStrictEqual(read({ contributes: { languages: [{ configuration: 'c.json' }, { id: 5, configuration: 'c.json' }, 'x', 7] } }), []);
    });

    it('skips null entries and configurations that are not strings, and keeps the entries around them', () => {
        assert.deepStrictEqual(read({
            contributes: {
                languages: [
                    { id: 'a', configuration: 'a.json' },
                    null,
                    undefined,
                    { id: 'b', configuration: 5 },
                    { id: 'c', configuration: { path: 'c.json' } },
                    { id: 'd', configuration: 'd.json' },
                ],
            },
        }), [{ id: 'a', configuration: 'a.json' }, { id: 'd', configuration: 'd.json' }]);
    });
});
