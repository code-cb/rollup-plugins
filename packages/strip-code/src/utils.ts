import { CommentBoundary } from './types';

export const buildCommentPattern = (comments: CommentBoundary[]) =>
  new RegExp(
    `[ \\t]*\\/\\*+\\s*(${comments
      .map(
        ({ end, start }) =>
          `${start}\\s*\\*\\/[\\s\\S]*?[ \\t]*\\/\\*+\\s*${end}`,
      )
      .join('|')})\\s*\\*\\/[ \\t]*`,
    'g',
  );
