// 用修复后的真实逻辑验证 encode/decode/cwd 改写
function encode(p) {
  if (/^[A-Za-z]:/.test(p)) return p.replace(/:/, '-').replace(/\\/g, '-');
  return p.replace(/\//g, '-');
}
function decode(encoded) {
  if (/^[A-Za-z]--/.test(encoded)) {
    const drive = encoded[0];
    const rest = encoded.slice(2).replace(/-/g, '\\');
    return `${drive}:${rest}`;
  }
  return encoded.replace(/^-/, '/').replace(/-/g, '/');
}

const round = ['D:\\code\\VibeCoding', 'C:\\Users\\micak\\AppData\\Local\\GitHubDesktop', 'E:\\new dir\\Project-B'];
let ok = true;
for (const p of round) {
  const enc = encode(p);
  const dec = decode(enc);
  const pass = dec === p;
  if (!pass) ok = false;
  console.log(`${p} -> ${enc} -> ${dec} ${pass ? '✓' : '✗ MISMATCH'}`);
}
// 与磁盘真实目录名交叉验证
console.log('真实 slug D--code-VibeCoding 解码为:', JSON.stringify(decode('D--code-VibeCoding')));
if (decode('D--code-VibeCoding') !== 'D:\\code\\VibeCoding') ok = false;

// cwd 改写
function rewrite(content, oldPath, newPath) {
  const normOld = oldPath.toLowerCase();
  return content.split('\n').map(line => {
    if (!line.trim()) return line;
    try {
      const obj = JSON.parse(line);
      if (typeof obj.cwd === 'string' && obj.cwd.toLowerCase() === normOld) {
        obj.cwd = newPath;
        return JSON.stringify(obj);
      }
      return line;
    } catch { return line; }
  }).join('\n');
}
const lines = [
  JSON.stringify({ type: 'user', cwd: 'D:\\code\\VibeCoding', text: 'hi' }),
  JSON.stringify({ type: 'assistant', cwd: 'd:\\code\\vibecoding', text: 'hello' }),
  JSON.stringify({ type: 'user', cwd: 'D:\\code\\Other', text: 'keep' }),
  'broken',
];
const out = rewrite(lines.join('\n'), 'D:\\code\\VibeCoding', 'E:\\new\\Target').split('\n').map(l => { try { return JSON.parse(l); } catch { return l; } });
if (out[0].cwd !== 'E:\\new\\Target' || out[1].cwd !== 'E:\\new\\Target' || out[2].cwd !== 'D:\\code\\Other' || out[3] !== 'broken') ok = false;
console.log('cwd 改写: ' + (out[0].cwd === 'E:\\new\\Target' && out[1].cwd === 'E:\\new\\Target' && out[2].cwd === 'D:\\code\\Other' ? '✓' : '✗'));

console.log(ok ? '=== 全部通过 ===' : '=== 存在失败 ===');
process.exit(ok ? 0 : 1);
