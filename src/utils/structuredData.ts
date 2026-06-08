interface ScholarlyArticleSchema {
  title: string;
  authors: string[];
  description?: string;
  url: string;
  image?: string;
  venue: string;
  pdfUrl?: string;
  codeUrl?: string;
  /**
   * ISO 8601 date the paper was first published (e.g. "2026-06-01").
   * Required by Google Rich Results test for ScholarlyArticle; without it
   * the validator warns and the result may not surface as a rich result.
   */
  datePublished?: string;
  /**
   * BCP-47 language tag for the article's primary content language
   * (e.g. "en" or "zh"). Surfaced as `inLanguage` in JSON-LD.
   */
  inLanguage?: string;
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
  datePublished,
  inLanguage,
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
    datePublished,
    inLanguage,
    publication: {
      '@type': 'PublicationEvent',
      name: venue,
    },
    isAccessibleForFree: true,
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
