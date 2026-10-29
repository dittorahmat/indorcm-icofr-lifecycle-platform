import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import importPlugin from 'eslint-plugin-import'
import localRules from './eslint-local/index.js'

// Render-body state-setter guards (shared by the base and anti-slop blocks below).
const RENDER_BODY_SETTERS = [
  {
    // This selector is more precise. In plain English, it means:
    // "Inside a function component (named in PascalCase), find any `set...` call,
    // but EXCLUDE any calls that are inside a nested function definition (like an event handler)."
    // This correctly finds the bug while ignoring the false positive.
    "selector": ":function[id.name=/^[A-Z]/] CallExpression[callee.name=/^set[A-Z]/]:not(ArrowFunctionExpression CallExpression, FunctionExpression CallExpression)",
    "message": "State setters should not be called directly in the component's render body. This will cause an infinite render loop. Use useEffect or an event handler instead."
  },
  {
    // This rule is a good backup to prevent setters inside memoization hooks.
    "selector": "CallExpression[callee.name=/^set[A-Z]/] > :function[parent.callee.name='useMemo'], CallExpression[callee.name=/^set[A-Z]/] > :function[parent.callee.name='useCallback']",
    "message": "State setters should not be called inside useMemo or useCallback. These hooks are for memoization, not for side effects."
  },
];

// Constant-outcome boolean operators (see message). Global: applies everywhere including tests.
const CONSTANT_BOOLEAN = {
  // `x || true` is always true and `x && false` is always false, so the left
  // side is dead logic. (Found live in the RCM importer as `...includes(...) || true`.)
  // Write the intended default explicitly instead (`?? true` for nullish
  // defaults, or a plain boolean expression).
  "selector": "LogicalExpression[operator='||'] > Literal[value=true], LogicalExpression[operator='&&'] > Literal[value=false]",
  "message": "Constant-outcome boolean: `|| true` is always true and `&& false` is always false. Use `??` for nullish defaults or simplify the expression."
};

// Mechanical anti-AI-slop guards (AGENTS.md Anti-AI Slop Checklist, enforced).
// Judgement-call items (decorative italic, design tokens) stay prose in AGENTS.md.
// Each pattern is matched on both plain string literals (className="…") and
// template-literal static parts (cn(`…${x}`)) so interpolation can't evade it.
const ANTISLOP = [
  {
    "selector": "Literal[value=/text-\\[(8|9|10|11)px\\]/]",
    "message": "No sub-12px font: use at least `text-xs` (12px) with `font-medium`/`font-semibold`. (Legit exception: none — bump the size.)"
  },
  {
    "selector": "Literal[value=/backdrop-(blur|filter)/]",
    "message": "No backdrop-blur/glassmorphism: use a solid surface (`bg-background`, `bg-card`, `bg-slate-50`) with `border border-border`."
  },
  {
    "selector": "Literal[value=/rounded-(2xl|3xl)/]",
    "message": "Institutional border radius: cards, modals, dialogs, sheets and buttons use `rounded-md`/`rounded-lg`, never `rounded-2xl`/`rounded-3xl`."
  },
  {
    "selector": "Literal[value=/animate-(pulse|ping|bounce)/]",
    "message": "No distracting animations on static badges/cards/buttons: animation only for isolated loading state (`<Skeleton />`, `Loader2 animate-spin`). Add an `// eslint-disable-next-line no-restricted-syntax -- loading state` with reason if this is one."
  },
  {
    "selector": "TemplateElement[value.raw=/text-\\[(8|9|10|11)px\\]/]",
    "message": "No sub-12px font (template-literal part): use at least `text-xs` (12px) with `font-medium`/`font-semibold`."
  },
  {
    "selector": "TemplateElement[value.raw=/backdrop-(blur|filter)/]",
    "message": "No backdrop-blur/glassmorphism (template-literal part): use a solid surface with `border border-border`."
  },
  {
    "selector": "TemplateElement[value.raw=/rounded-(2xl|3xl)/]",
    "message": "Institutional border radius (template-literal part): use `rounded-md`/`rounded-lg`, never `rounded-2xl`/`rounded-3xl`."
  },
  {
    "selector": "TemplateElement[value.raw=/animate-(pulse|ping|bounce)/]",
    "message": "No distracting animations (template-literal part): animation only for isolated loading state with an eslint-disable reason."
  },
];

// Shared-header squeeze guard (Deficiency Board desktop collapse, issue #59).
// A global `[&>*]:shrink-0` child lock stops every flex child from shrinking,
// so a wide actions block squeezes the title to min-content (one letter per
// line). Actions must wrap/scroll inside their own capped container instead.
// Same Literal + TemplateElement pairing as ANTISLOP so interpolation can't
// evade it. Test/spec files are excluded from this block (see below) because
// they assert the absence of the pattern.
const HEADER_SQUEEZE = [
  {
    "selector": "Literal[value=/\\[&>\\*\\]:shrink-0/]",
    "message": "No global `[&>*]:shrink-0` child lock: it prevents flex children from shrinking and squeezes titles to min-content. Cap + wrap the actions container instead (`sm:max-w-[58%] sm:flex-wrap sm:justify-end`). Add an `// eslint-disable-next-line no-restricted-syntax -- <reason>` only with a proven need."
  },
  {
    "selector": "TemplateElement[value.raw=/\\[&>\\*\\]:shrink-0/]",
    "message": "No global `[&>*]:shrink-0` child lock (template-literal part): cap + wrap the actions container instead."
  },
];

// SPA In-App Navigation Guard (anti-refresh invariant).
// Disallows raw HTML `<a href="/...">` for internal routes: use `<Link to="...">`
// from react-router-dom so React Query in-memory cache and app state are preserved.
const SPA_INTERNAL_LINK = [
  {
    "selector": "JSXOpeningElement[name.name='a'] > JSXAttribute[name.name='href'] > Literal[value=/^\\/[^\\/]/]",
    "message": "Do not use raw `<a href=\"/...\">` for internal SPA navigation: use `<Link to=\"...\">` from `react-router-dom` to preserve in-memory state and avoid full page reloads."
  },
];

export default tseslint.config(
  { ignores: ['dist', 'dist-whitelabel'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'import': importPlugin,
      'local': localRules,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...importPlugin.configs.recommended.rules,
      ...importPlugin.configs.typescript.rules,
      'prefer-const': 'off',
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      // Tech-debt gate (warn-first, escalate to error per-module as `any` is removed):
      '@typescript-eslint/no-unused-vars': "warn",
      '@typescript-eslint/no-explicit-any': 'warn',
      'react-refresh/only-export-components': [
        'error',
        { allowConstantExport: true },
      ],
      'import/named': 'error',
      'import/default': 'error',
      'import/no-unresolved': ['error', { 
        ignore: ['cloudflare:workers', 'agents', 'vitest'] 
      }],

      // CHANGED: Replaced the flawed rule with a more intelligent one.
      "no-restricted-syntax": [
        "error",
        ...RENDER_BODY_SETTERS,
        CONSTANT_BOOLEAN,
      ],
    },
    settings: {
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
  },
  // Disable react-refresh/only-export-components for UI components
  // as shadcn/ui components commonly export both components and utilities
  {
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  // Mechanical anti-slop enforcement for product frontend code. Test files
  // assert the absence of these patterns via string literals, so they are
  // excluded here (their assertions are the complementary enforcement).
  // local/mutation-requires-onerror stays warn-first (legacy baseline: 50
  // sites at introduction) — reviewer enforces onError on touched code per
  // CODING_STANDARDS.md; escalate to error once the baseline burns to zero.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['**/*.test.*', '**/*.spec.*', 'src/test/**'],
    rules: {
      'local/mutation-requires-onerror': 'warn',
      "no-restricted-syntax": [
        "error",
        ...RENDER_BODY_SETTERS,
        CONSTANT_BOOLEAN,
        ...ANTISLOP,
        ...HEADER_SQUEEZE,
        ...SPA_INTERNAL_LINK,
      ],
    },
  },
  // Import layering (AGENTS.md, retro 2026-10-16): shared/ is importable by
  // both tiers; product code never crosses src/ <-> worker/. Integration
  // tests (src/test/**, **/*.test.*) are the sole exception, hence ignores.
  // Route guards (issue #102). A route that writes must not be reachable by GET,
  // and a mutating route must carry its guard. Warn-first, like
  // local/mutation-requires-onerror: the reviewer enforces it on touched routes.
  // Measured baseline in worker/routes at introduction (2026-10-18):
  //   local/routes-require-rbac  61
  //   local/no-writing-get        0  -> READY TO ESCALATE to 'error'; the
  //     all-writes-must-not-be-GET rule is clean today, so promoting it is the
  //     maintainer's call rather than something this PR decides.
  // First burn-down pass (2026-10-19, issue #97): 61 -> 44, and
  // `npm run check:rbac-delta` is now the tooth — a touched worker/routes file
  // may not INCREASE its unguarded count (the gate runs this very rule in
  // memory over the working tree and the base blob, so the two can't disagree).
  // Second pass (same day): 44 -> 28 — nine more guards plus seven *documented*
  // exemptions for session-scoped writes, which say why no role applies with
  // `// rbac-exempt: <reason>` (the rule requires the reason and reports a
  // directive left on a route that does carry a guard). The remaining 28 stay
  // warn-only so the rest can be burned down per area.
  // Scoped to worker/routes so the rules only see route registrations, not every
  // `.get(`/`.delete(` in the worker.
  {
    files: ['worker/routes/**/*.ts'],
    ignores: ['**/*.test.*', '**/__tests__/**'],
    rules: {
      'local/no-writing-get': 'warn',
      'local/routes-require-rbac': 'warn',
    },
  },
  {
    files: ['worker/**/*.ts'],
    ignores: ['**/*.test.*', '**/*.spec.*'],
    rules: {
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './worker',
              from: './src',
              message: 'Import layering: worker/ must not import src/ — shared logic lives in shared/.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/test/**', '**/*.test.*', '**/*.spec.*'],
    rules: {
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './src',
              from: './worker',
              message: 'Import layering: src/ must not import worker/ — shared logic lives in shared/ (integration tests under src/test/** are exempt).',
            },
          ],
        },
      ],
    },
  },
)
