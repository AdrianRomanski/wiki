/**
 * Assessment models for AI-driven knowledge validation.
 * These models define the data structures for assessment sessions and results.
 */

import { ProgressState } from './progress.models';

/**
 * Type of question in an assessment
 */
export type QuestionType = 'open-ended' | 'scenario' | 'application';

/**
 * Status of an assessment session
 */
export type AssessmentStatus = 'active' | 'completed' | 'cancelled';

/**
 * Represents a single question in an assessment
 */
export interface Question {
  /** Unique identifier for the question */
  id: string;
  /** Question text to display to the user */
  text: string;
  /** Type of question */
  type: QuestionType;
}

/**
 * Represents a user's response to a question
 */
export interface Response {
  /** ID of the question this response is for */
  questionId: string;
  /** User's response text */
  text: string;
  /** ISO 8601 timestamp when the response was submitted */
  timestamp: string;
}

/**
 * Represents an active or completed assessment session
 */
export interface AssessmentSession {
  /** Unique identifier for the session */
  sessionId: string;
  /** ID of the concept being assessed */
  conceptId: string;
  /** Human-readable concept title */
  conceptTitle: string;
  /** Questions in this assessment */
  questions: Question[];
  /** User responses collected so far */
  responses: Response[];
  /** Current status of the assessment */
  status: AssessmentStatus;
}

/**
 * Result of a completed assessment
 */
export interface AssessmentResult {
  /** ID of the session this result is for */
  sessionId: string;
  /** Evaluated progress state based on responses */
  evaluatedState: ProgressState;
  /** Confidence score from 0 to 1 */
  confidence: number;
  /** Feedback message for the user */
  feedback: string;
}
