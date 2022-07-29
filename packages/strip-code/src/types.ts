import { FilterPattern } from '@rollup/pluginutils';

export interface CommentBoundary {
  end: string;
  start: string;
}

export type StripCodeOptions = {
  exclude?: FilterPattern;
  include?: FilterPattern;
  sourcemap?: boolean;
} & ({ pattern: string | RegExp } | { comments: CommentBoundary[] });
