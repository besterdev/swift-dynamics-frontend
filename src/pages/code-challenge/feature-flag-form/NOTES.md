# Feature Flag Editor

Setup was verified with Node.js 22 and pnpm 11. Run `pnpm install --frozen-lockfile`, then `pnpm dev` from the repository root. Open `/code-challenge/feature-flag-form#feature-flag-editor`. Run `pnpm lint`, `pnpm test`, `pnpm exec tsc --noEmit`, and `pnpm build` for the submission checks.

## Targeting context

Groups and roles are reusable targeting definitions within a flag draft. The application evaluating the flag supplies membership through a string `group` or an array of strings `groups`. It supplies roles through `role` or `roles` in the same way. A group with roles requires both membership and at least one assigned role. For example, a rule can match the `beta` group with the `tester` role using this context.

```json
{
  "targetingKey": "user-123",
  "groups": ["beta"],
  "roles": ["tester"]
}
```

Rules run in order and the first match wins. Drag a rule by its handle with a mouse or touch, or use the up/down buttons. Reorder user groups and reorder conditions or nested groups within their current AND/OR group using the same controls. Conditions can combine custom attributes, user groups, and roles at any nesting level. Enter a number or boolean to compare by type. Use double quotes to match a string such as `"7"`.

## Preview and export

The downloaded `.goff.json` is a GO Feature Flag configuration file keyed by flag name. Targeting conditions compile to JsonLogic strings. A rule serves either a single variation or a weighted rollout. Positive weights are relative to their sum. The same options are available on the default rule.

The editor holds its draft in memory. After export, groups and role checks are represented by the compiled conditions in the config. Membership and authorization remain the responsibility of the application that supplies the evaluation context.

## Form structure

TanStack Form owns draft state. Zod validates recursive groups and checks references to roles, groups, and variations. Validation results for unchanged condition trees are reused; individual condition components subscribe to their own messages. Preview has a separate subscription and loads Monaco on the client.

## Editor folders

- `your-codes/index.tsx` composes the editor and its live preview.
- `components/` contains editor sections, inputs, reorder controls, and the Monaco preview.
- `hooks/` contains form setup, error subscriptions, and drag-and-drop behavior.
- `types/` contains the shared feature flag draft and targeting types.
- `lib/` contains options, Zod validation, JSON serialization, and their tests.
