function getStatus(request, response) {
  response.json({
    status: 'ok',
    message: 'SSR API is running'
  });
}

function getProducts(request, response) {
  // Temporary fictional records for the Week 7 foundation; no database is used yet.
  const sampleResources = [
    {
      id: 1,
      title: 'Algebra Foundations Lab',
      description: 'A guided practice set for equations, expressions, and variables.',
      subject: 'Mathematics',
      difficulty: 'Beginner',
      url: 'https://example.com/ssr/algebra-foundations'
    },
    {
      id: 2,
      title: 'Web Layout Essentials',
      description: 'Learn the core ideas behind semantic HTML and responsive CSS layouts.',
      subject: 'Web Development',
      difficulty: 'Beginner',
      url: 'https://example.com/ssr/web-layout-essentials'
    },
    {
      id: 3,
      title: 'JavaScript Problem Solving',
      description: 'Build confidence with functions, arrays, and practical debugging exercises.',
      subject: 'Programming',
      difficulty: 'Intermediate',
      url: 'https://example.com/ssr/javascript-problem-solving'
    },
    {
      id: 4,
      title: 'Data Structures in Practice',
      description: 'Explore how common data structures support efficient programs.',
      subject: 'Computer Science',
      difficulty: 'Advanced',
      url: 'https://example.com/ssr/data-structures-practice'
    },
    {
      id: 5,
      title: 'Academic Writing Toolkit',
      description: 'A practical resource for planning, drafting, and revising assignments.',
      subject: 'Academic Skills',
      difficulty: 'Intermediate',
      url: 'https://example.com/ssr/academic-writing-toolkit'
    }
  ];

  response.json(sampleResources);
}

module.exports = {
  getStatus,
  getProducts
};
