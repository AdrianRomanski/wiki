
import { ProgressState } from './progress.models';

export type QuestionType = 'open-ended' | 'scenario' | 'application';

export type AssessmentStatus = 'active' | 'completed' | 'cancelled';

export interface Question {

  id: string;

  text: string;

  type: QuestionType;
}

export interface Response {

  questionId: string;

  text: string;

  timestamp: string;
}

export interface AssessmentSession {

  sessionId: string;

  conceptId: string;

  conceptTitle: string;

  questions: Question[];

  responses: Response[];

  status: AssessmentStatus;
}

export interface AssessmentResult {

  sessionId: string;

  evaluatedState: ProgressState;

  confidence: number;

  feedback: string;
}
