const { SKILL_CATALOG, KEYWORD_PHRASES } = require('./skillCatalog');

const STOPWORDS = new Set(`a an the and or of to for in on with without from by at as is are was were be been being this that those these your you we our their its it into over under than then so such not no yes per via using use used within across about into including include across each other more most any all can may will just also have has had do does did if when where while who which what how why should must need needs required requirement requirements preferred plus ability able strong excellent great good well team teams work working role roles job jobs company looking seek seeking join opportunity opportunities experience experienced years year yr yrs plus`.split(/\s+/));

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const SKILL_IMPLICATIONS = [
  ['PySpark', 'Spark'],
  ['PostgreSQL', 'SQL'],
];

function detectSkills(text) {
  if (!text) return [];
  let masked = text.toLowerCase();
  const counts = new Map();
  const aliases = [];
  SKILL_CATALOG.forEach((skill) => {
    skill.aliases.forEach((alias) => {
      aliases.push({ name: skill.name, alias: alias.toLowerCase() });
    });
  });
  aliases.sort((a, b) => b.alias.length - a.alias.length || a.name.localeCompare(b.name));

  aliases.forEach(({ name, alias }) => {
    const pattern = new RegExp(`(?<![a-z0-9+.#])${escapeRegExp(alias)}(?![a-z0-9+.#])`, 'g');
    masked = masked.replace(pattern, (match) => {
      counts.set(name, (counts.get(name) || 0) + 1);
      return ' '.repeat(match.length);
    });
  });

  SKILL_IMPLICATIONS.forEach(([child, parent]) => {
    if (counts.has(child) && !counts.has(parent)) counts.set(parent, counts.get(child));
  });

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function skillAliasSet() {
  return new Set(SKILL_CATALOG.flatMap((skill) => skill.aliases.map((alias) => alias.toLowerCase())));
}

function phraseIn(text, phrase) {
  const pattern = new RegExp(`(?<![a-z0-9+.#])${escapeRegExp(phrase.toLowerCase())}(?![a-z0-9+.#])`, 'i');
  return pattern.test(text);
}

function sectionMode(line) {
  const compact = line.trim().toLowerCase();
  if (!compact || compact.length > 80) return null;
  if (/preferred|nice to have|bonus|plus if|good to have/.test(compact)) return 'preferred';
  if (/requirement|qualification|what you(?:'|’)ll bring|what you bring|must have|required|we(?:'|’)re looking/.test(compact)) return 'required';
  if (/responsibilit|what you(?:'|’)ll do|what you will do|the role|about the role|you will/.test(compact)) return 'body';
  return null;
}

function classifyJobSkills(description) {
  const lines = String(description || '').split(/\n/);
  let mode = 'body';
  const map = new Map();

  lines.forEach((line) => {
    const nextMode = sectionMode(line);
    if (nextMode) {
      mode = nextMode;
      return;
    }
    const weight = mode === 'required' ? 3 : mode === 'preferred' ? 1 : 2;
    detectSkills(line).forEach((skill) => {
      const current = map.get(skill.name) || { name: skill.name, weight: 0, count: 0, section: mode };
      map.set(skill.name, {
        name: skill.name,
        weight: Math.max(current.weight, weight),
        count: current.count + skill.count,
        section: current.weight > weight ? current.section : mode,
      });
    });
  });

  return [...map.values()];
}

function extractKeywords(description) {
  const aliases = skillAliasSet();
  const lines = String(description || '').split(/\n/);
  let mode = 'body';
  const found = new Map();

  const consider = (phrase, weight) => {
    const key = phrase.toLowerCase();
    if (aliases.has(key) || STOPWORDS.has(key)) return;
    const current = found.get(key) || { phrase, weight: 0 };
    found.set(key, { phrase: current.phrase, weight: current.weight + weight });
  };

  lines.forEach((line) => {
    const nextMode = sectionMode(line);
    if (nextMode) {
      mode = nextMode;
      return;
    }
    const weight = mode === 'required' ? 2 : 1;
    KEYWORD_PHRASES.forEach((phrase) => {
      if (phraseIn(line, phrase)) consider(phrase, weight);
    });
  });

  return [...found.values()].sort((a, b) => b.weight - a.weight || a.phrase.localeCompare(b.phrase));
}

function yearsFromText(text) {
  const source = String(text || '');
  const explicit = [...source.matchAll(/(\d{1,2})\s*\+?\s*(?:years|yrs)\b/gi)]
    .map((match) => Number(match[1]))
    .filter((value) => value >= 1 && value <= 40);
  const now = new Date().getFullYear();
  let rangeYears = 0;
  const rangePattern = /(\d{4})\s*[–—-]\s*(present|current|\d{4})/gi;
  [...source.matchAll(rangePattern)].forEach((match) => {
    const start = Number(match[1]);
    const end = /present|current/i.test(match[2]) ? now : Number(match[2]);
    if (end >= start && end - start <= 50) rangeYears = Math.max(rangeYears, end - start);
  });
  const explicitYears = explicit.length ? Math.max(...explicit) : 0;
  return Math.max(explicitYears, rangeYears);
}

function requiredYears(description) {
  const values = [...String(description || '').matchAll(/(\d{1,2})\s*\+?\s*(?:years|yrs)\b/gi)]
    .map((match) => Number(match[1]))
    .filter((value) => value >= 1 && value <= 20);
  if (!values.length) return null;
  return Math.max(...values);
}

function extractExperience(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const datePattern = /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+)?(?:19|20)\d{2}\s*[–—-]\s*((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+)?(?:(?:19|20)\d{2}|present|current)/i;
  const sectionHeading = /^(summary|skills|experience|education|projects|certifications)\b/i;
  const entries = [];
  let pendingTitle = '';
  let capturing = true;

  lines.forEach((line) => {
    if (sectionHeading.test(line) && line.length < 40) {
      capturing = /^experience\b/i.test(line);
      pendingTitle = '';
      return;
    }
    if (!capturing) return;
    const dated = line.match(datePattern);
    const isBullet = /^[-•*–]/.test(line);
    if (dated && !isBullet && line.length < 180) {
      const headline = line
        .replace(datePattern, '')
        .replace(/[|•–—-]+\s*$/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
      entries.push({
        headline: headline || pendingTitle || line,
        dates: dated[0],
        highlights: [],
      });
      pendingTitle = '';
      return;
    }
    if (entries.length && isBullet) {
      entries[entries.length - 1].highlights.push(line.replace(/^[-•*–]\s*/, ''));
      return;
    }
    const current = entries[entries.length - 1];
    if (current && current.highlights.length && /^[a-z0-9]/.test(line)) {
      current.highlights[current.highlights.length - 1] += ` ${line}`;
      return;
    }
    if (!isBullet && line.length < 140) pendingTitle = line;
  });

  return entries.slice(0, 8);
}

function extractSummary(text) {
  const source = String(text || '').replace(/\r/g, '');
  const headed = source.match(/summary\s*\n+([\s\S]{40,700}?)(?:\n\s*\n|\nexperience\b|\nskills\b|\neducation\b)/i);
  if (headed) return headed[1].replace(/\s+/g, ' ').trim();
  const paragraphs = source
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter((paragraph) => paragraph.length > 80 && !/^skills\b/i.test(paragraph));
  return paragraphs[0] ? paragraphs[0].slice(0, 420) : '';
}

function resumeBullets(text) {
  const fromRoles = extractExperience(text).flatMap((entry) => entry.highlights).filter((line) => line.length > 25);
  if (fromRoles.length) return fromRoles;
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[-•*]/.test(line) && line.length > 25)
    .map((line) => line.replace(/^[-•*]\s*/, ''));
}

function hasDegree(text, level) {
  const source = String(text || '');
  if (level === 'master') return /master(?:'|’)?s\b|\bm\.s\.|\bm\.sc\b|\bmba\b|\bph\.?d\b|\bdoctorate\b/i.test(source);
  return /bachelor(?:'|’)?s\b|\bb\.s\.|\bb\.sc\b|\bb\.a\.|\bundergraduate degree\b/i.test(source);
}

function titleTokens(title) {
  return String(title || '')
    .toLowerCase()
    .split(/[^a-z0-9+]+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

module.exports = {
  detectSkills,
  classifyJobSkills,
  extractKeywords,
  phraseIn,
  yearsFromText,
  requiredYears,
  extractExperience,
  extractSummary,
  resumeBullets,
  hasDegree,
  titleTokens,
};
