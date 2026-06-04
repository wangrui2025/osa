interface ScholarlyArticleSchema {
  title: string;
  authors: string[];
  description?: string;
  url: string;
  image?: string;
  venue: string;
  pdfUrl?: string;
  codeUrl?: string;
}

export function getScholarlyArticleSchema({
  title,
  authors,
  description,
  url,
  image,
  venue,
  pdfUrl,
  codeUrl,
}: ScholarlyArticleSchema) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    headline: title,
    name: title,
    author: authors.map((name) => ({
      '@type': 'Person',
      name,
    })),
    description,
    url,
    image,
    publication: {
      '@type': 'PublicationEvent',
      name: venue,
    },
    ...(pdfUrl && {
      encoding: {
        '@type': 'MediaObject',
        contentUrl: pdfUrl,
        encodingFormat: 'application/pdf',
      },
    }),
    ...(codeUrl && {
      codeRepository: codeUrl,
    }),
  };
}
