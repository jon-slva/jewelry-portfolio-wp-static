// Minimal reader for PHP's serialize() format, which WordPress uses for some
// post meta. Example: a:1:{i:0;s:5:"video";} is an array holding "video".
//
// Supports what the theme meta contains: arrays, strings, integers, floats,
// booleans and null. PHP arrays become plain objects keyed by their PHP keys.

export type PhpValue = string | number | boolean | null | { [key: string]: PhpValue };

export function phpUnserialize(input: string): PhpValue {
  // String lengths are counted in bytes, so work on the UTF-8 bytes.
  const bytes = Buffer.from(input, 'utf8');
  let pos = 0;

  const fail = (message: string): never => {
    throw new Error(`Cannot read PHP serialized value at byte ${pos}: ${message}`);
  };

  const readUntil = (char: string): string => {
    const end = bytes.indexOf(char, pos);
    if (end === -1) fail(`expected "${char}"`);
    const text = bytes.subarray(pos, end).toString('utf8');
    pos = end + 1;
    return text;
  };

  const expect = (char: string) => {
    if (bytes.toString('utf8', pos, pos + 1) !== char) fail(`expected "${char}"`);
    pos += 1;
  };

  const readValue = (): PhpValue => {
    const type = bytes.toString('utf8', pos, pos + 1);
    pos += 1;
    if (type === 'N') {
      expect(';');
      return null;
    }
    expect(':');
    switch (type) {
      case 'b':
        return readUntil(';') === '1';
      case 'i':
      case 'd':
        return Number(readUntil(';'));
      case 's': {
        const length = Number(readUntil(':'));
        expect('"');
        const text = bytes.subarray(pos, pos + length).toString('utf8');
        pos += length;
        expect('"');
        expect(';');
        return text;
      }
      case 'a': {
        const count = Number(readUntil(':'));
        expect('{');
        const result: { [key: string]: PhpValue } = {};
        for (let i = 0; i < count; i++) {
          const key = readValue();
          if (typeof key !== 'string' && typeof key !== 'number')
            fail('array key must be a string or number');
          result[String(key)] = readValue();
        }
        expect('}');
        return result;
      }
      default:
        return fail(`unsupported type "${type}"`);
    }
  };

  const value = readValue();
  if (pos !== bytes.length) fail('unexpected text after the value');
  return value;
}
