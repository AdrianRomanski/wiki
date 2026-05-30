/**
 * Content_Extractor subsystem
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
} from './parse-article';

export { identifyCandidates } from './identify-candidates';

export {
  generateAnalysis,
  buildAnalysisMarkdown,
  generateSummary,
  generateEntityDescription,
  generateConceptDescription,
  AnalysisGenerationError,
} from './generate-analysis';

export { saveArticleContent, loadArticleContent } from './save-article-content';
