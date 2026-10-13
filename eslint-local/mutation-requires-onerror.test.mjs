import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import plugin from './index.js';

const rule = plugin.rules['mutation-requires-onerror'];

const tester = new RuleTester();

describe('local/mutation-requires-onerror', () => {
  tester.run('mutation-requires-onerror', rule, {
      valid: [
        'useMutation({ mutationFn, onError })',
        'useMutation({ mutationFn: fn, onError: handler })',
        "useMutation({ mutationFn, onError: (e) => toast.error('x') })",
        'useMutation()',
        'notAMutation({ mutationFn })',
      ],
      invalid: [
        {
          code: 'useMutation({ mutationFn })',
          errors: [{ messageId: 'missingOnError' }],
        },
        {
          code: 'useMutation({ mutationFn, onSuccess })',
          errors: [{ messageId: 'missingOnError' }],
        },
      ],
  });
});
