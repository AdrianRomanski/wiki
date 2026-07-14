/**
 * Application Layer use cases for the Session_Manager subsystem.
 * Feature: article-research-session
 *
 * Responsible for session lifecycle: creation, state transitions,
 * pause/resume, and finalization of article research sessions.
 */

export { transitionState, InvalidTransitionError } from './lib/state-transitions';
export {
  createSession,
  validateArticleInput,
  recordArticleInputType,
  cleanupSession,
} from './lib/create-session';
export type {
  CreateSessionResult,
  ValidateArticleInputResult,
} from './lib/create-session';
export {
  pauseSession,
  resumeSession,
  PauseError,
  ResumeError,
} from './lib/pause-resume';
export type { ResumeResult, CompletedStep } from './lib/pause-resume';
export {
  generateFindingsSummary,
  updateFindingsSummary,
  completeSynthesizeStep,
  parseAnalysisMarkdown,
  buildFindingsSummaryMarkdown,
  generateRecommendedWikiPages,
} from './lib/synthesize-step';
export {
  getMetadataForConfirmation,
  confirmMetadata,
  completeExploreStep,
} from './lib/explore-step';
export type { ExtractedMetadata } from './lib/explore-step';
export {
  getFindingsSummaryForReview,
  declinePublication,
  acceptPublication,
  finalizeSession,
} from './lib/finalize-step';
export type { PublicationResult } from './lib/finalize-step';
