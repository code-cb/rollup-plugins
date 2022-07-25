/**
 * Reference: https://github.com/rollup/plugins/tree/master/packages/strip
 */

import { traverse } from '@codecb/estree-traverse';
import { createFilter, FilterPattern } from '@rollup/pluginutils';
import { parseModule } from 'esprima';
import { Expression, Super } from 'estree';
import { Plugin } from 'rollup';
import { SourceCode } from './SourceCode';

interface StripOptions {
  debugger?: boolean;
  exclude?: FilterPattern;
  functions?: string[];
  include?: FilterPattern;
  labels?: string[];
  sourcemap?: boolean;
}

const defaultFunctions = ['console.*', 'assert.*'];
const defaultInclude: FilterPattern = ['**/*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}'];

const tryParseAst = (code: string, id: string) => {
  try {
    return parseModule(code, { range: true });
  } catch (error) {
    throw new Error(`${(error as Error).message} in ${id}`);
  }
};

const getObjectName = (node: Expression | Super) => {
  switch (node.type) {
    case 'Identifier':
      return node.name;

    case 'ThisExpression':
      return 'this';

    case 'Super':
      return 'super';

    default:
      return null;
  }
};

const flattenFunctionName = (node: Expression | Super) => {
  const parts = [];
  while (node.type === 'MemberExpression') {
    if (node.property.type !== 'Identifier') return null;
    parts.push(node.property.name);
    node = node.object;
  }
  const name = getObjectName(node);
  if (!name) return null;
  parts.push(name);
  return parts.reverse().join('.');
};

export const strip = ({
  debugger: removeDebugger = true,
  exclude,
  functions = defaultFunctions,
  include = defaultInclude,
  labels = [],
  sourcemap,
}: StripOptions): Plugin => {
  const filter = createFilter(include, exclude);
  const functionPatterns = functions.map(s =>
    s.replaceAll('*', '\\w+').replaceAll('.', '\\s*\\.\\s*'),
  );
  const labelPatterns = labels.map(s => `${s}\\s*:`);
  const allPatterns = [
    ...functionPatterns,
    ...labelPatterns,
    ...(removeDebugger ? ['debugger\\b'] : []),
  ];
  const functionsRegex = new RegExp(`^(?:${functionPatterns.join('|')})$`);
  const patternsRegex = new RegExp(`\\b(?:${allPatterns.join('|')})`);

  return {
    name: 'strip',
    transform(code, id) {
      if (!filter(id) || !patternsRegex.test(code)) return null;
      const sourceCode = new SourceCode(code);
      const program = tryParseAst(code, id);

      for (const { node, parent, skipChildren } of traverse(program)) {
        if (sourcemap) sourceCode.addSourceMapRange(node);
        if (node.type === 'DebuggerStatement' && removeDebugger) {
          console.log(`Found ${node.type} at ${node.range}`);
          sourceCode.removeStatement(node, parent);
          skipChildren();
          continue;
        }
        if (
          node.type === 'LabeledStatement' &&
          labels.includes(node.label.name)
        ) {
          console.log(`Found ${node.type} ${node.label.name} at ${node.range}`);
          sourceCode.removeStatement(node, parent);
          skipChildren();
          continue;
        }
        if (node.type === 'CallExpression') {
          const functionName = flattenFunctionName(node.callee);
          if (functionName && functionsRegex.test(functionName)) {
            console.log(`Found ${node.type} ${functionName} at ${node.range}`);
            sourceCode.removeExpression(node, parent);
            skipChildren();
            continue;
          }
        }
      }

      return !sourceCode.edited ? null : sourceCode.generateSourceDescription();
    },
  };
};

export default strip;
