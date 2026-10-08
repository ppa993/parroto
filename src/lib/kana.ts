// Kana → typeable romaji "units". Each unit lists every accepted spelling (Hepburn first).

export type Unit = { options: string[] };

const T: Record<string, string[]> = {
  あ: ['a'], い: ['i'], う: ['u'], え: ['e'], お: ['o'],
  か: ['ka'], き: ['ki'], く: ['ku'], け: ['ke'], こ: ['ko'],
  さ: ['sa'], し: ['shi', 'si'], す: ['su'], せ: ['se'], そ: ['so'],
  た: ['ta'], ち: ['chi', 'ti'], つ: ['tsu', 'tu'], て: ['te'], と: ['to'],
  な: ['na'], に: ['ni'], ぬ: ['nu'], ね: ['ne'], の: ['no'],
  は: ['ha'], ひ: ['hi'], ふ: ['fu', 'hu'], へ: ['he'], ほ: ['ho'],
  ま: ['ma'], み: ['mi'], む: ['mu'], め: ['me'], も: ['mo'],
  や: ['ya'], ゆ: ['yu'], よ: ['yo'],
  ら: ['ra'], り: ['ri'], る: ['ru'], れ: ['re'], ろ: ['ro'],
  わ: ['wa'], を: ['wo', 'o'],
  が: ['ga'], ぎ: ['gi'], ぐ: ['gu'], げ: ['ge'], ご: ['go'],
  ざ: ['za'], じ: ['ji', 'zi'], ず: ['zu'], ぜ: ['ze'], ぞ: ['zo'],
  だ: ['da'], ぢ: ['ji', 'di'], づ: ['zu', 'du'], で: ['de'], ど: ['do'],
  ば: ['ba'], び: ['bi'], ぶ: ['bu'], べ: ['be'], ぼ: ['bo'],
  ぱ: ['pa'], ぴ: ['pi'], ぷ: ['pu'], ぺ: ['pe'], ぽ: ['po'],
  ぁ: ['xa', 'la'], ぃ: ['xi', 'li'], ぅ: ['xu', 'lu'], ぇ: ['xe', 'le'], ぉ: ['xo', 'lo'],
  ゃ: ['xya', 'lya'], ゅ: ['xyu', 'lyu'], ょ: ['xyo', 'lyo'], ゎ: ['xwa'],
  ゔ: ['vu'], ー: ['-'],
  // combos
  きゃ: ['kya'], きゅ: ['kyu'], きょ: ['kyo'],
  しゃ: ['sha', 'sya'], しゅ: ['shu', 'syu'], しょ: ['sho', 'syo'], しぇ: ['she', 'sye'],
  ちゃ: ['cha', 'tya', 'cya'], ちゅ: ['chu', 'tyu', 'cyu'], ちょ: ['cho', 'tyo', 'cyo'], ちぇ: ['che', 'tye'],
  にゃ: ['nya'], にゅ: ['nyu'], にょ: ['nyo'],
  ひゃ: ['hya'], ひゅ: ['hyu'], ひょ: ['hyo'],
  みゃ: ['mya'], みゅ: ['myu'], みょ: ['myo'],
  りゃ: ['rya'], りゅ: ['ryu'], りょ: ['ryo'],
  ぎゃ: ['gya'], ぎゅ: ['gyu'], ぎょ: ['gyo'],
  じゃ: ['ja', 'zya', 'jya'], じゅ: ['ju', 'zyu', 'jyu'], じょ: ['jo', 'zyo', 'jyo'], じぇ: ['je', 'zye'],
  びゃ: ['bya'], びゅ: ['byu'], びょ: ['byo'],
  ぴゃ: ['pya'], ぴゅ: ['pyu'], ぴょ: ['pyo'],
  ふぁ: ['fa'], ふぃ: ['fi'], ふぇ: ['fe'], ふぉ: ['fo'],
  てぃ: ['ti', 'thi'], でぃ: ['di', 'dhi'], でゅ: ['dyu', 'dhu'], とぅ: ['tu', 'twu'],
  うぃ: ['wi'], うぇ: ['we'], うぉ: ['wo'],
  ゔぁ: ['va'], ゔぃ: ['vi'], ゔぇ: ['ve'], ゔぉ: ['vo'],
};

const toHira = (s: string) =>
  Array.from(s)
    .map((c) => {
      const code = c.charCodeAt(0);
      return code >= 0x30a1 && code <= 0x30f6 ? String.fromCharCode(code - 0x60) : c;
    })
    .join('');

const isVowelish = (o: string) => /^[aiueoyn]/.test(o);

export function kanaToUnits(kana: string): Unit[] {
  const s = Array.from(toHira(kana.replace(/\s+/g, '')));
  // 1) basic tokens
  const raw: (string[] | 'small_tsu' | 'n')[] = [];
  for (let i = 0; i < s.length; i++) {
    const two = s[i] + (s[i + 1] ?? '');
    if (T[two]) {
      raw.push(T[two]);
      i++;
    } else if (s[i] === 'っ') raw.push('small_tsu');
    else if (s[i] === 'ん') raw.push('n');
    else if (T[s[i]]) raw.push(T[s[i]]);
    // unknown characters are skipped
  }
  // 2) resolve っ and ん against the following token
  const units: Unit[] = [];
  for (let i = 0; i < raw.length; i++) {
    const tok = raw[i];
    const next = raw[i + 1];
    if (tok === 'n') {
      if (next === undefined) units.push({ options: ['n', 'nn'] });
      else if (Array.isArray(next) && !next.some(isVowelish)) units.push({ options: ['n', 'nn', "n'"] });
      else units.push({ options: ['nn', "n'"] });
    } else if (tok === 'small_tsu') {
      if (Array.isArray(next) && next.some((o) => /^[^aiueon\-]/.test(o))) {
        const opts: string[] = [];
        for (const o of next) {
          if (/^[^aiueon\-]/.test(o)) opts.push(o[0] + o);
          if (o.startsWith('ch')) opts.push('t' + o);
        }
        for (const o of next) opts.push('xtu' + o, 'ltu' + o, 'xtsu' + o);
        units.push({ options: [...new Set(opts)] });
        i++;
      } else units.push({ options: ['xtu', 'ltu', 'xtsu'] });
    } else units.push({ options: tok });
  }
  return units;
}

export const unitsToRomaji = (units: Unit[]) => units.map((u) => u.options[0]).join('');
export const toRomaji = (kana: string) => unitsToRomaji(kanaToUnits(kana));
export const lettersToUnits = (word: string): Unit[] => Array.from(word).map((c) => ({ options: [c] }));

// ---------- Typing state machine ----------
export type TypeState = { ui: number; buf: string; done: string[] };
export const newTypeState = (): TypeState => ({ ui: 0, buf: '', done: [] });

export const canStart = (units: Unit[], c: string) => !!units[0]?.options.some((o) => o.startsWith(c));
export const isComplete = (units: Unit[], st: TypeState) => st.ui >= units.length;

/** Feed one character. Returns true if accepted (mutates st). */
export function feed(units: Unit[], st: TypeState, c: string): boolean {
  const u = units[st.ui];
  if (!u) return false;
  const nb = st.buf + c;
  if (u.options.some((o) => o.startsWith(nb))) {
    st.buf = nb;
    const exact = u.options.includes(nb);
    const longer = u.options.some((o) => o.length > nb.length && o.startsWith(nb));
    if (exact && (!longer || st.ui === units.length - 1)) {
      st.done.push(nb);
      st.ui++;
      st.buf = '';
    }
    return true;
  }
  // a pending exact match (e.g. "n" for ん) can be closed by the next unit's key
  if (st.buf && u.options.includes(st.buf)) {
    const saved = { ui: st.ui, buf: st.buf, len: st.done.length };
    st.done.push(st.buf);
    st.ui++;
    st.buf = '';
    if (feed(units, st, c)) return true;
    st.ui = saved.ui;
    st.buf = saved.buf;
    st.done.length = saved.len;
  }
  return false;
}

/** Split romaji for display: [typed, remaining] */
export function progressParts(units: Unit[], st: TypeState): [string, string] {
  const typed = st.done.join('') + st.buf;
  let rest = '';
  const u = units[st.ui];
  if (u) {
    const o = u.options.find((x) => x.startsWith(st.buf)) ?? u.options[0];
    rest += o.slice(st.buf.length);
    for (let k = st.ui + 1; k < units.length; k++) rest += units[k].options[0];
  }
  return [typed, rest];
}
