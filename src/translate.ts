import https from 'https';
import querystring from 'querystring';

interface SpellingResponse {
  [index: number]: {
    s: string[];
  };
}

interface TranslationResponse {
  [index: number]: {
    [index: number]: {
      [index: number]: string;
    };
  };
}

interface TranslationItem {
  title: string;
  arg?: string;
  subtitle?: string;
  icon?: { path: string };
  valid?: string;
}

interface Feedback {
  items: TranslationItem[];
}

const TRANSLATE_ICON = { path: './icon.png' };
const SPELL_ICON = { path: './spellcheck.png' };
const SPELL_CHECK_URL = 'https://speller.yandex.net/services/spellservice.json/checkText';
const TRANSLATE_URL = 'https://translate.googleapis.com/translate_a/single';
const TRANSLATE_URL_PARAMS = { format: 'json', client: 'gtx', dt: 't' };
const DEFAULT_SOURCE_LANG = 'en';
const DEFAULT_TARGET_LANG = 'ru';
const NOT_FOUND_TITLE = 'Translation not found';

export function getTranslationDirection(text: string): string {
  return /^[’ -~]*$/.test(text) ? DEFAULT_SOURCE_LANG : DEFAULT_TARGET_LANG;
}

export function httpRequest<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';

        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const responseJson = JSON.parse(data) as T;
            resolve(responseJson);
          } catch (error) {
            reject(error);
          }
        });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

export async function getSpellingSuggestions(inputString: string): Promise<string[]> {
  if (inputString.split(' ')?.length > 1) {
    return [];
  }

  const spellCheckParams = { text: inputString };
  const spellCheckUrl = `${SPELL_CHECK_URL}?${querystring.stringify(spellCheckParams)}`;

  const responseJson = await httpRequest<SpellingResponse>(spellCheckUrl);
  const spellingSuggestions = responseJson[0]?.s || [];

  return spellingSuggestions;
}

export async function getTranslation(q: string, sl: string, tl: string): Promise<string> {
  const translateUrlParams = {
    ...TRANSLATE_URL_PARAMS,
    sl,
    tl,
    q,
  };
  const translateUrl = `${TRANSLATE_URL}?${querystring.stringify(translateUrlParams)}`;
  const responseJson = await httpRequest<TranslationResponse>(translateUrl);
  const translation = responseJson?.[0]?.[0]?.[0] ?? '';

  return translation;
}

export async function getOutput(inputString: string): Promise<Feedback> {
  const fb: Feedback = { items: [] };
  const _inputString = inputString?.trim();

  if (!_inputString) {
    fb.items.push({ title: NOT_FOUND_TITLE, valid: 'no' });

    return fb;
  }

  const sl = getTranslationDirection(_inputString);
  const tl = sl === DEFAULT_SOURCE_LANG ? DEFAULT_TARGET_LANG : DEFAULT_SOURCE_LANG;

  try {
    const spellingSuggestions = await getSpellingSuggestions(_inputString);

    const translationResults = await Promise.all(
      spellingSuggestions.map(async (_) => {
        const title = await getTranslation(_, sl, tl);

        return {
          title,
          arg: title,
          subtitle: _,
          icon: SPELL_ICON,
        };
      }),
    );

    translationResults.push({
      title: await getTranslation(_inputString, sl, tl),
      get arg() {
        return this.title;
      },
      subtitle: _inputString,
      icon: TRANSLATE_ICON,
    });

    fb.items = translationResults;

    return fb;
  } catch (error) {
    console.error(error);

    return fb;
  }
}

const [, , ...inputString] = process.argv;

getOutput(inputString?.join(' '))
  .then((fb) => {
    console.log(JSON.stringify(fb));
  })
  .catch((error) => {
    console.error(error);
  });
