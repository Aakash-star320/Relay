# Coding Standards

These standards apply to all application code in this repository. They supplement `AGENTS.md`, `GUIDELINES.md`, `REQUIREMENTS.md`, and `INSTRUCTIONS.md`.

If this file conflicts with any of those project contract files, the project contract takes precedence. These standards must not be used to change the approved stack, add dependencies, bypass transcript logging, weaken validation or authorization, or alter the required setup and submission flow.

## Organize code by responsibility

- Keep frontend and backend code organized by product feature.
- Give each file a clear purpose. Separate UI components, API clients, models, routes, controllers, services, repositories, schemas, and utilities when they perform different jobs.
- Keep code that changes together close together. Do not create extra files that only add indirection without clarifying ownership or behavior.
- Put reusable, domain-neutral behavior under the appropriate `shared` directory. Keep feature-specific behavior inside its feature directory.
- Avoid catch-all files such as `helpers.js`, `utils.js`, or oversized components that contain unrelated behavior. Name utility modules after the capability they provide.

## Write focused functions

- Each function should perform one well-defined task at one level of abstraction.
- Break complex work into named functions whose names explain the steps of the operation.
- Keep HTTP handling, business rules, and database access separate. Backend product flows follow `route -> controller -> service -> repository -> database`.
- Keep route handlers and controllers thin. Validate input at the boundary, place product rules in services, and keep MongoDB queries in repositories.
- Prefer pure functions for parsing, transformation, variable resolution, assertions, response analysis, and other deterministic logic.
- Use early returns when they make validation and failure paths easier to read.
- Avoid deeply nested conditions, repeated logic, hidden side effects, and functions controlled by many unrelated Boolean parameters.
- Extract repeated behavior only when the extracted function has a clear name and stable responsibility.

## Use meaningful names

- Choose names that describe the value, action, or business concept represented.
- Name functions with verbs such as `resolveVariables`, `createCollection`, or `findRequestById`.
- Name Boolean values as questions or states, such as `isSaving`, `hasUnsavedChanges`, or `canCancel`.
- Use established product terms consistently: collection, saved request, environment, execution, assertion, extraction, and collection run.
- Avoid vague names such as `data`, `item`, `temp`, `obj`, `handle`, or `process` when a more specific name is available.
- Avoid unexplained abbreviations and single-letter names except for familiar, very small local operations.

## Keep code readable

- Prefer straightforward code over clever or compressed expressions.
- Keep related statements together and present operations in the order a reader expects them to occur.
- Replace unexplained literals with named constants when the value represents a limit, policy, status, or reusable configuration.
- Keep function inputs and return shapes predictable. Avoid mutating arguments unless the contract explicitly requires it.
- Handle success, empty, validation, authorization, cancellation, timeout, and failure outcomes explicitly where they apply.
- Remove dead code, debugging output, unused imports, commented-out implementations, and temporary workarounds before considering a change complete.
- Follow the repository's existing Prettier and editor configuration.

## Write efficient code

- Choose data structures and algorithms that fit the expected data size and access pattern. Avoid repeated scans, nested searches, and unnecessary sorting when a map, set, index, or single pass expresses the work more efficiently.
- Perform expensive parsing, transformation, variable resolution, and response analysis once per operation unless the underlying input changes.
- Keep network and database work bounded. Enforce pagination, request-size limits, response-size limits, timeouts, and maximum collection sizes at the backend boundary.
- Fetch only the fields and records required for the operation. Avoid unbounded queries, unnecessary document hydration, and database calls inside loops.
- Add MongoDB indexes when they support demonstrated ownership, ordering, filtering, or lookup patterns. Do not add speculative indexes without a corresponding query.
- Combine related writes when atomicity or round-trip reduction justifies it, while preserving clear validation, ownership checks, and error handling.
- Avoid sending duplicate or unused data between the frontend and backend. Keep API response shapes focused and predictable.
- Prevent avoidable React work by keeping state near its owner, using stable identifiers, and avoiding duplicated derived state. Use memoization only when it prevents meaningful repeated work or stabilizes an important dependency.
- Cancel or clean up obsolete requests, timers, listeners, and other resources when components unmount or operations are superseded.
- Use concurrency only for independent operations, with explicit limits and deterministic error handling. Preserve sequential execution where request order or chaining requires it.
- Prefer a clear implementation with appropriate complexity over difficult micro-optimizations. Measure or demonstrate a bottleneck before adding complexity solely for performance.

## Write useful comments

- Add a short module-level comment when a file's purpose or boundary is not clear from its name and exports.
- Comment non-obvious decisions, constraints, safety rules, compatibility requirements, and reasons for unusual behavior.
- Explain why a limit, workaround, ordering rule, or security check exists when removing it could introduce a defect.
- Document important assumptions for request execution, variable precedence, credential redaction, history snapshots, cancellation, and run isolation.
- Do not narrate obvious syntax or repeat what a well-named function already says.
- Keep comments current when behavior changes. Remove comments that no longer describe the code.

## Design frontend modules deliberately

- Keep page or workspace orchestration separate from focused controls and panels.
- Keep server calls in feature API modules rather than embedding `fetch` calls throughout components.
- Keep transient editor state separate from persisted server data and general interface state.
- Extract custom hooks when they own a coherent stateful behavior, not merely to shorten a component.
- Keep accessible names, keyboard behavior, loading states, validation messages, and error recovery close to the interaction they support.
- Avoid large components that mix data loading, business transformations, dialogs, navigation, and detailed rendering in one file.

## Design backend modules deliberately

- Routes declare endpoints and middleware.
- Controllers translate HTTP requests and responses.
- Services enforce ownership, product rules, and multi-step operations.
- Repositories contain MongoDB access and owner-scoped queries.
- Models define persistence structure and database constraints.
- Validation schemas define accepted external input and reject unknown or invalid values where appropriate.
- Shared middleware and utilities must remain independent of individual product features.
- Return consistent, concise errors without exposing stack traces, credentials, or implementation details.

## Protect data and credentials

- Read application secrets from environment variables only.
- Never log or persist resolved passwords, bearer tokens, API keys, cookies, or authorization headers unless a documented product requirement makes storage necessary and safe.
- Scope every user-owned read and write by the authenticated account.
- Treat saved definitions and historical execution snapshots as different data with different lifecycles.
- Validate identifiers, enumerated values, string sizes, collection sizes, and pagination limits before performing work.

## Review before completion

Before considering a change complete, confirm that:

- files and functions have clear, focused responsibilities;
- names communicate intent without requiring comments to decode them;
- comments explain important reasons and constraints;
- work is bounded and avoids unnecessary computation, database access, network transfer, and rendering;
- duplicated logic has an appropriate shared owner;
- frontend behavior maps to a real backend flow and MongoDB persistence when applicable;
- validation and ownership rules are enforced at the backend boundary;
- loading, empty, success, and failure states are handled where applicable;
- no secrets, temporary output, dead code, or unrelated dependency changes were introduced;
- the relevant build, runtime, and feature checks pass.
