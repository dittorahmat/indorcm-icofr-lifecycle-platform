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

const WRITE_METHODS = new Set(['insert', 'update', 'delete', 'execute']);
const MUTATING_VERBS = new Set(['post', 'put', 'patch', 'delete']);
const GUARD_CALLEES = new Set(['rbac', 'assertDevAllowed']);

/**
 * A route registration has a path literal first — a string starting with '/' —
 * AND at least one more argument (its handler). Both conditions matter: the path
 * keeps `map.get(key)` and `db.delete(row)` out, and the second argument keeps
 * `cache.delete('/tmp/x')` out.
 */
function isRouteRegistration(node) {
  const args = node.arguments || [];
  if (args.length < 2) return false;
  const first = args[0];
  return Boolean(
    first && first.type === 'Literal' && typeof first.value === 'string' && first.value.startsWith('/'),
  );
}

function calleeNameOf(node) {
  return node && node.type === 'CallExpression' && node.callee && node.callee.type === 'Identifier'
    ? node.callee.name
    : null;
}

function memberMethod(node) {
  const callee = node.callee;
  if (!callee || callee.type !== 'MemberExpression' || callee.computed) return null;
  if (!callee.property || callee.property.type !== 'Identifier') return null;
  return callee.property.name;
}

/**
 * `db.execute(sql\`…\`)` is used for reads AND writes in this repo, so the raw
 * SQL decides: a `SELECT` is a read; anything else — DELETE, UPDATE, an
 * unrecognised shape — counts as a write (fail-safe: unknown = write).
 */
function isReadOnlyExecute(node) {
  const arg = node.arguments && node.arguments[0];
  const quasi = arg && arg.type === 'TaggedTemplateExpression' ? arg.quasi : null;
  const first = quasi && quasi.quasis && quasi.quasis[0];
  const raw = first && first.value ? first.value.raw : null;
  return typeof raw === 'string' && /^\s*select\b/i.test(raw);
}

/** Walks a handler subtree for a write call, `parent` links skipped. */
function containsWrite(node) {
  let found = false;
  const visit = (current) => {
    if (found || !current || typeof current.type !== 'string') return;
    if (current.type === 'CallExpression') {
      const method = memberMethod(current);
      if (method && WRITE_METHODS.has(method)) {
        if (method !== 'execute' || !isReadOnlyExecute(current)) {
          found = true;
          return;
        }
      }
    }
    for (const [key, value] of Object.entries(current)) {
      if (key === 'parent') continue;
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object') visit(value);
    }
  };
  visit(node);
  return found;
}

const noWritingGet = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'A route registered on GET/ALL must not write: destructive work belongs on POST/DELETE (AGENTS.md "GET mutating & tanpa guard").',
    },
    messages: {
      writingGet:
        'This GET/ALL route writes (insert/update/delete/execute). Move it to POST or DELETE — a GET must stay safe to retry and to prefetch.',
    },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        const method = memberMethod(node);
        if (method !== 'get' && method !== 'all') return;
        if (!isRouteRegistration(node)) return;
        if (!containsWrite(node)) return;
        context.report({ node, messageId: 'writingGet' });
      },
    };
  },
};

const routesRequireRbac = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'A mutating route (POST/PUT/PATCH/DELETE) must carry a guard — rbac(...) or assertDevAllowed(...) — in its argument list.',
    },
    messages: {
      missingGuard:
        'This route mutates without a guard. Add rbac([...]) (or assertDevAllowed for /dev tooling) as middleware — AGENTS.md requires rbac on write routes.',
    },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        const method = memberMethod(node);
        if (!MUTATING_VERBS.has(method)) return;
        if (!isRouteRegistration(node)) return;
        const guarded = node.arguments.some((argument) => GUARD_CALLEES.has(calleeNameOf(argument)));
        if (!guarded) context.report({ node, messageId: 'missingGuard' });
      },
    };
  },
};

export default {
  rules: {
    'mutation-requires-onerror': mutationRequiresOnerror,
    'no-writing-get': noWritingGet,
    'routes-require-rbac': routesRequireRbac,
  },
};
