/**
 * Manual Test Dataset
 * 
 * Contains pre-structured entries with manual action tags. 
 * Used for testing the core logic of the Journal Store, CDAG Topology merging, 
 * and EXP propagation without incurring AI processing latency or costs.
 */
export const MANUAL_TEST_ENTRIES = [
  { c: "Optimized SQL queries for the dashboard", a: ["Optimize", "Query"] },
  { c: "Morning yoga session", a: ["Stretch", "Breathe"] },
  { c: "Researched decentralized finance", a: ["Research", "Analyze"] },
  { c: "Wrote documentation for the API", a: ["Document", "Write"] },
  { c: "Practiced piano for an hour", a: ["Practice", "Perform"] },
  { c: "Refactored the authentication module", a: ["Refactor", "Secure"] },
  { c: "Configured multi-region AWS infrastructure", a: ["Cloud", "DevOps", "Scaling"] },
  { c: "Sketched a new UI layout for the analytics page", a: ["Design", "Prototyping"] },
  { c: "Completed a high-intensity interval training session", a: ["Fitness", "Cardio"] },
  { c: "Read three chapters of a deep learning textbook", a: ["Learning", "AI"] }
];