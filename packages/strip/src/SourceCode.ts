import { Node } from 'estree';
import MagicString from 'magic-string';
import { SourceDescription } from 'rollup';

const isBlock = ({ type }: Node) =>
  type === 'BlockStatement' || type === 'Program';

export class SourceCode {
  private _edited = false;
  get edited() {
    return this._edited;
  }
  private magicString: MagicString;

  constructor(private code: string) {
    this.magicString = new MagicString(code);
  }

  addSourceMapRange({ range }: Node) {
    this.magicString.addSourcemapLocation(range![0]);
    this.magicString.addSourcemapLocation(range![1]);
  }

  generateSourceDescription(): SourceDescription {
    return {
      code: this.magicString.toString(),
      map: this.magicString.generateMap(),
    };
  }

  removeExpression(node: Node, parent: Node) {
    if (parent.type === 'ExpressionStatement')
      this.removeStatement(node, parent);
    else {
      const [start, end] = node.range!;
      this.magicString.overwrite(start, end, '(void 0)');
    }
    this._edited = true;
  }

  removeStatement(node: Node, parent: Node) {
    const [start, end] = node.range!;
    if (isBlock(parent)) this.remove(start, end);
    else this.magicString.overwrite(start, end, '(void 0);');
    this._edited = true;
  }

  private remove(start: number, end: number) {
    for (; /\s/.test(this.code[start - 1]!); --start);
    this.magicString.remove(start, end);
  }
}
