/**
 * Session_Manager subsystem for article research sessions
 * Feature: article-research-session
 *
 * Responsible for session lifecycle: creation, state transitions,
 * pause/resume, and finalization of article research sessions.
 */

export { transitionState, InvalidTransitionError } from './state-transitions';
export {
  createSession,
  validateArticleInput,
  recordArticleInputType,
  cleanupSession,
} from './create-session';
export type {
  CreateSessionResult,
  ValidateArticleInputResult,
} from './create-session';
export {
  pauseSession,
  resumeSession,
  PauseError,
  ResumeError,
} from './pause-resume';
export type { ResumeResult, CompletedStep } from './pause-resume';
export {
  generateFindingsSummary,
  updateFindingsSummary,
  completeSynthesizeStep,
  parseAnalysisMarkdown,
  buildFindingsSummaryMarkdown,
  generateRecommendedWikiPages,
} from './synthesize-step';
export {
  getMetadataForConfirmation,
  confirmMetadata,
  completeExploreStep,
} from './explore-step';
export type { ExtractedMetadata } from './explore-step';
export {
  getFindingsSummaryForReview,
  declinePublication,
  acceptPublication,
  finalizeSession,
} from './finalize-step';
export type { PublicationResult } from './finalize-step';
