/**
 * Debug Feature - Public API
 * 
 * Exports the debug console feature with composed graph editor capability.
 * Follows Bulletproof React architecture with feature-based organization.
 * 
 * Composition Pattern:
 * - DebugView accepts graphViewSlot prop for composed content
 * - Consumer (App) injects DeveloperGraphView at composition root
 * - Maintains decoupling between debug and developer-graph features
 */

export { default as DebugView } from './components/debug-view';
export * from './api/test-injections';
