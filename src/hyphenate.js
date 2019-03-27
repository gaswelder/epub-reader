// soft hyphen character (not every editor shows)
const SoftHyphen = "­";

/**
 * Hyphenates a given text.
 */
exports.hyphenate = function(text, hyphen = SoftHyphen) {
  return split(text)
    .map(str => (isWord(str) ? hyphenateWord(str, hyphen) : str))
    .join("");
};

function split(text) {
  const parts = [];

  const n = text.length;
  let i = 0;
  while (i < n) {
    let part = "";
    while (i < n && isSpace(text[i])) {
      part += text[i];
      i++;
    }
    if (part.length > 0) {
      parts.push(part);
      part = "";
    }

    while (i < n && !isSpace(text[i])) {
      part += text[i];
      i++;
    }
    if (part.length > 0) {
      parts.push(part);
      part = "";
    }
  }

  return parts;
}

function isWord(str) {
  return !isSpace(str[0]);
}

function isSpace(ch) {
  return ch.match(/\s/);
}

function hyphenateWord(word, hyphen) {
  if (word.match(/\d/)) {
    return word;
  }
  return syllables(word).join(hyphen);
}

function syllables(word) {
  if (word == "") {
    return [];
  }

  const first = syllable(word);
  return [first, ...syllables(word.substr(first.length))];
}

function syllable(word) {
  // A syllable requires at least two "atoms".
  const [a, rest] = atom(word);
  if (!rest) {
    return a;
  }

  const [b, rest2] = atom(rest);
  if (!rest2) {
    return a + b;
  }

  if (rest2.length < 3) {
    return a + b + rest2;
  }

  const next = syllable(rest2);

  // If the next syllable is too short, append it here.
  if (next.length < 2) {
    return a + b + next;
  }

  // If the next syllable ends up with two consonants, take one consonant here.
  if (next.length == 2 && next.split("").every(isConsonant)) {
    return a + b + next.charAt(0);
  }

  // If the next syllable ends up with two vowels, take one vowel here.
  if (next.length == 2 && next.split("").every(isVowel)) {
    return a + b + next.charAt(0);
  }

  return a + b;
}

const atoms = ["ch", "th", "sh", "wh", "ph", "ae", "oe", "ee", "ck"];

const vowels = "aeioyu";
const consonants = "bcdfghjklmnpqrstvwxz";

function isConsonant(ch) {
  return consonants.split("").some(c => c == ch);
}

function isVowel(ch) {
  return vowels.split("").some(c => c == ch);
}

function atom(word) {
  if (word.length < 3) {
    return [word];
  }

  for (const a of atoms) {
    if (word.startsWith(a)) {
      return [a, word.substr(a.length)];
    }
  }

  return [word.charAt(0), word.substr(1)];
}
