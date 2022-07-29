/**
 * Reference: https://github.com/rollup/plugins/tree/master/packages/json
 */

import {
  createFilter,
  dataToEsm,
  DataToEsmOptions,
  FilterPattern,
} from '@rollup/pluginutils';
import { Plugin } from 'rollup';

export interface JsonOptions
  extends Pick<
    DataToEsmOptions,
    'compact' | 'indent' | 'namedExports' | 'preferConst'
  > {
  exclude?: FilterPattern;
  include?: FilterPattern;
}

export const json = ({
  compact,
  exclude,
  include,
  indent = '\t',
  namedExports,
  preferConst,
}: JsonOptions = {}): Plugin => {
  const filter = createFilter(include, exclude);

  return {
    name: 'json',
    transform(code, id) {
      if (id.slice(-5) !== '.json' || !filter(id)) return null;
      try {
        const parsed = JSON.parse(code);
        return {
          code: dataToEsm(parsed, {
            compact,
            indent,
            namedExports,
            preferConst,
          }),
          map: { mappings: '' },
        };
      } catch (error) {
        this.warn({
          id,
          message: 'Could not parse JSON',
          pos: parseInt((error as Error).message.match(/\d+/)![0]!, 10),
        });
        return null;
      }
    },
  };
};

export default json;
