/**
 * Application Layer use cases for the Content_Extractor subsystem.
 * Feature: article-research-session
 *
 * Responsible for parsing raw article content into a structured intermediate
 * representation and generating analysis artifacts.
 */

export {
  parseArticle,
  extractCodeBlocks,
  extractLinks,
  extractH1Title,
  ArticleParseError,
  TitleRequiredError,
} from './lib/parse-article';

export { identifyCandidates } from './lib/identify-candidates';

export {
  generateAnalysis,
  buildAnalysisMarkdown,
  generateSummary,
  generateEntityDescription,
  generateConceptDescription,
  AnalysisGenerationError,
} from './lib/generate-analysis';

export { saveArticleContent, loadArticleContent } from './lib/save-article-content';

export {
  fetchWithRetries,
  MAX_RETRIES,
} from './lib/fetch-with-retries';
export type {
  FetchFailureChoice,
  FetchWithRetriesResult,
} from './lib/fetch-with-retries';
