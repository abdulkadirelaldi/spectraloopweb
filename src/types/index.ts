/**
 * Shared domain types — single entry point.
 *
 * Import from anywhere via the `@/types` alias, e.g.:
 *   import type { User, Role, ApplicationInput } from "@/types";
 *
 * These are pure TypeScript domain types (unions + entity shapes), NOT Mongoose
 * models. Models arrive later (Faz 1/2) alongside their API tasks and live in
 * `src/models`. `src/types` is a shared/coordinated area — future changes go
 * through the chief.
 *
 * Source of truth: PROGRAM.md §8 (data models) + RBAC matrix.
 */

export * from "./common";
export * from "./user";
export * from "./subteam";
export * from "./task";
export * from "./document";
export * from "./announcement";
export * from "./event";
export * from "./sponsor";
export * from "./application";
export * from "./contact";
