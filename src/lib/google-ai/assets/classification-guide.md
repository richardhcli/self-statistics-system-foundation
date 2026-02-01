# Neural Classification Guide

This document defines the semantic hierarchy used by the Gemini AI to structure human effort into a Directed Acyclic Graph (DAG), styled as a real-life RPG status system.

## 1. Actions (The Leaf Layer)
**Color:** Emerald (#10b981)
**Definition:** Granular activities extracted from journal entries. These are the primary sources of EXP.
**Format:** Active-verb labels.
**Examples:** "Debugging", "Squats", "Piano practice".

## 2. Skills (The Intermediate Layer)
**Color:** Amber (#f59e0b)
**Definition:** Trainable concepts or competencies that encapsulate groups of actions. These represent the "Skill Trees" you are actively leveling up.
**Format:** Functional nouns or skill titles.
**Examples:** "Frontend Engineering", "Strength Training", "Financial Analysis".

## 3. Characteristics (The Attribute Layer)
**Color:** Indigo (#4f46e5)
**Definition:** High-level human traits representing fundamental potential. These map to the Statistics dashboard.
**Core Attribute Categories:**
- **Vitality**: Physical resilience and fitness.
- **Intellect**: Analytical capacity and technical rigor.
- **Wisdom**: Metacognition and judgment.
- **Social**: Charisma and empathy.
- **Discipline**: Focus and self-control.
- **Creativity**: Innovation and design.
- **Leadership**: Vision and strategic influence.

## 4. Abstraction Chain (The Hierarchy)
**Definition:** When a new characteristic is introduced, the AI generates a path upwards through increasingly general concepts until it reaches the root.
**The Root Node: "progression"**
- Every classification path eventually converges at **"progression"**.
- This node acts as the universal experience container for the entire brain.
- Proportions (Edge Weights) determine how much specific effort (e.g., "React") influences the global "progression" score.

## Determinism Note
All AI operations use **Temperature 0.0**. This ensures that the structure of your brain is logical, stable, and predictable. Identical inputs will always map to the same neural locations.