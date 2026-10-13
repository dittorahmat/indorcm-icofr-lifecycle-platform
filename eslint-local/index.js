// eslint-local — repo-owned ESLint rules (flat config, no external plugin).
// Warn-first per CODING_STANDARDS.md: a rule stays `warn` until its baseline
// burns down to zero, then escalates to `error`.
const mutationRequiresOnerror = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Write mutations (useMutation) must surface failures via onError user feedback; silent failures lose user data (see the missing-PUT post-mortem).',
    },
    messages: {
      missingOnError:
        'useMutation without onError fails silently: add an onError handler that surfaces the server error to the user (toast).',
    },
    schema: [],
  },
  create(context) {
    return {
      'CallExpression[callee.name="useMutation"] > ObjectExpression'(node) {
        const hasOnError = node.properties.some(
          (p) =>
            p.type === 'Property' &&
            ((p.key.type === 'Identifier' && p.key.name === 'onError') ||
              (p.key.type === 'Literal' && p.key.value === 'onError')),
        );
        if (!hasOnError) {
          context.report({ node, messageId: 'missingOnError' });
        }
      },
    };
  },
};

export default {
  rules: {
    'mutation-requires-onerror': mutationRequiresOnerror,
  },
};
