import {
  getOutput,
  getSpellingSuggestions,
  getTranslation,
  getTranslationDirection,
} from './translate';

describe('getTranslationDirection', () => {
  it('should return the default source language when the text contains only ASCII characters', () => {
    const text = 'Hello world';
    const result = getTranslationDirection(text);
    expect(result).toBe('en');
  });

  it('should return the default target language when the text contains non-ASCII characters', () => {
    const text = 'Привет мир';
    const result = getTranslationDirection(text);
    expect(result).toBe('ru');
  });
});

describe('getSpellingSuggestions', () => {
  it('should return an empty array when inputString has multiple words', async () => {
    const inputString = 'Hello world';
    const result = await getSpellingSuggestions(inputString);
    expect(result).toEqual([]);
  });

  it('should return an array of spelling suggestions', async () => {
    const inputString = 'Helo';
    const result = await getSpellingSuggestions(inputString);
    expect(result).toEqual(['Hello', 'Halo', 'Help']);
  });
});

describe('getTranslation', () => {
  it('should return the translation for the given text and language pair', async () => {
    const q = 'Hello';
    const sl = 'en';
    const tl = 'ru';
    const result = await getTranslation(q, sl, tl);
    expect(result).toBe('Привет');
  });
});

describe('getOutput', () => {
  it('should return a feedback object with a not found title when inputString is empty', async () => {
    const inputString = '';
    const result = await getOutput(inputString);
    expect(result).toEqual({
      items: [{ title: 'Translation not found', valid: 'no' }],
    });
  });

  it('should return a feedback object with translation results', async () => {
    const inputString = 'Hello world';
    const result = await getOutput(inputString);

    expect(result).toEqual(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({
            title: 'Привет, мир',
            arg: 'Привет, мир',
            subtitle: 'Hello world',
          }),
        ]),
      }),
    );
  });
});
