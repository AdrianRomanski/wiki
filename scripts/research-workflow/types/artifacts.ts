/**
 * Type definitions for artifact generation and management
 * Feature: polished-research-workflow
 */

import { ArtifactType, Phase } from './core.js';

/**
 * Artifact metadata
 */
export interface ArtifactMetadata {
  createdAt: string;
  phase: Phase;
  relatedLibraries: string[];
  tags: string[];
}

/**
 * Artifact structure
 */
export interface Artifact {
  type: ArtifactType;
  name: string;
  content: string;
  metadata: ArtifactMetadata;
}

/**
 * Bundle size information
 */
export interface BundleSize {
  minified: number;
  gzipped: number;
  raw: number;
}

/**
 * Token usage estimate
 */
export interface TokenEstimate {
  setup: number;
  implementation: number;
  debugging: number;
  total: number;
  model: string;
}

/**
 * Comparison data for decision making
 */
export interface ComparisonData {
  complexityScores: Map<string, number>;
  modularityScores: Map<string, number>;
  bundleSizes: Map<string, BundleSize>;
  tokenEstimates: Map<string, TokenEstimate>;
}

/**
 * Decision information
 */
export interface Decision {
  selectedLibrary: string | null;
  rationale: string;
  comparisonData: ComparisonData;
}
