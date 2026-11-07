const sampleResources = [
  {
    id: 1,
    title: 'Algebra Foundations Lab',
    description: 'A guided practice set for equations, expressions, and variables.',
    subject: 'Mathematics',
    difficulty: 'Beginner',
    resource_type: 'Video Tutorial',
    keyword: 'algebra, equations, variables',
    url: 'https://example.com/ssr/algebra-foundations'
  },
  {
    id: 2,
    title: 'Web Layout Essentials',
    description: 'Learn the core ideas behind semantic HTML and responsive CSS layouts.',
    subject: 'Web Development',
    difficulty: 'Beginner',
    resource_type: 'Article / Guide',
    keyword: 'html, css, layout',
    url: 'https://example.com/ssr/web-layout-essentials'
  },
  {
    id: 3,
    title: 'JavaScript Problem Solving',
    description: 'Build confidence with functions, arrays, and practical debugging exercises.',
    subject: 'Programming',
    difficulty: 'Intermediate',
    resource_type: 'Interactive Lab',
    keyword: 'javascript, functions, debugging',
    url: 'https://example.com/ssr/javascript-problem-solving'
  },
  {
    id: 4,
    title: 'Data Structures in Practice',
    description: 'Explore how common data structures support efficient programs.',
    subject: 'Computer Science',
    difficulty: 'Advanced',
    resource_type: 'Article / Guide',
    keyword: 'data structures, algorithms',
    url: 'https://example.com/ssr/data-structures-practice'
  },
  {
    id: 5,
    title: 'Academic Writing Toolkit',
    description: 'A practical resource for planning, drafting, and revising assignments.',
    subject: 'Academic Skills',
    difficulty: 'Intermediate',
    resource_type: 'Article / Guide',
    keyword: 'academic writing, research, citation',
    url: 'https://example.com/ssr/academic-writing-toolkit'
  }
];

const allowedDifficulties = new Set(['Beginner', 'Intermediate', 'Advanced']);

function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength).toLowerCase() : '';
}

function normalizeHistory(history) {
  return history
    .slice(0, 20)
    .map((entry) => ({
      subject: cleanText(entry && entry.subject, 80),
      keyword: cleanText(entry && entry.keyword, 120),
      difficulty: allowedDifficulties.has(entry && entry.difficulty)
        ? entry.difficulty.toLowerCase()
        : '',
      createdAt: typeof (entry && entry.createdAt) === 'string' ? entry.createdAt : ''
    }))
    .filter((entry) => entry.subject || entry.keyword || entry.difficulty);
}

function tokenize(value) {
  return cleanText(value, 500)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1);
}

function resourceKeywords(resource) {
  if (resource.keyword) {
    const list = resource.keyword.split(/,\s*/).map((k) => k.trim()).filter(Boolean);
    if (list.length > 0) return list.slice(0, 6);
  }
  return Array.from(
    new Set(tokenize(`${resource.title} ${resource.description} ${resource.subject}`))
  ).slice(0, 6);
}

function recommendationForResource(resource, history) {
  let score = 0;
  const resourceText = tokenize(
    `${resource.title} ${resource.description} ${resource.subject} ${resource.keyword || ''}`
  );

  history.forEach((query, index) => {
    const recencyWeight = 1 - (index / Math.max(history.length, 1)) * 0.5;
    const queryTokens = tokenize(`${query.keyword} ${query.subject}`);
    const overlap = queryTokens.filter((token) => resourceText.includes(token)).length;
    score += overlap * recencyWeight;
    if (query.subject && resource.subject && query.subject === resource.subject.toLowerCase()) {
      score += 1.5 * recencyWeight;
    }
    if (
      query.difficulty &&
      resource.difficulty &&
      query.difficulty === resource.difficulty.toLowerCase()
    ) {
      score += 0.5 * recencyWeight;
    }
  });

  return score;
}

function toRecommendation(resource, score) {
  const resourceType =
    resource.resource_type ||
    (/tutorial|lab/i.test(resource.title) ? 'Video Tutorial' : 'Article / Guide');

  return {
    ...resource,
    category: resource.subject,
    resourceType,
    keywords: resourceKeywords(resource),
    ...(score > 0 ? { relevanceScore: Math.min(99, Math.round(50 + score * 12)) } : {})
  };
}

function getRecommendations(history, pool = null) {
  const dataset = Array.isArray(pool) && pool.length > 0 ? pool : sampleResources;
  const normalizedHistory = normalizeHistory(history);

  const ranked = dataset
    .map((resource, index) => ({
      resource,
      score: recommendationForResource(resource, normalizedHistory),
      index
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const usefulHistory = normalizedHistory.length > 0 && ranked.some((item) => item.score > 0);
  const selected = (
    usefulHistory
      ? ranked
      : ranked.sort((a, b) => {
          const beginnerA =
            (a.resource.difficulty || '').toLowerCase() === 'beginner' ? 0 : 1;
          const beginnerB =
            (b.resource.difficulty || '').toLowerCase() === 'beginner' ? 0 : 1;
          return beginnerA - beginnerB || a.index - b.index;
        })
  ).slice(0, 3);

  return selected.map((item) =>
    toRecommendation(item.resource, usefulHistory ? item.score : 0)
  );
}

module.exports = {
  getRecommendations,
  getSampleResources: () => sampleResources.map((resource) => ({ ...resource }))
};
