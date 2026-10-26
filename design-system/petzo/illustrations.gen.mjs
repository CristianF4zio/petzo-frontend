// Single source for the onboarding art: writes 1-3.svg (QA) and Onboarding.tsx (app)
import { writeFileSync } from 'node:fs';

const out = process.argv[2];
const C = {
  skin: '#F8C9A4', ear: '#F0B48C', cheek: '#F59A9A', ink: '#1C1917', mouth: '#9F3A38',
  hair: '#231C2E', hairBrown: '#4A2E22',
  white: '#FFFFFF', deep: '#3B6FD8',
  sweaterA: '#CFE0FF', sweaterB: '#FFCB5C', sweaterBDark: '#F2A93B', sweaterC: '#FF9F7A', sweaterCDark: '#F07F5A',
  dog: '#EE8A3C', dogDark: '#D46F25', earIn: '#FFD2AE', tongue: '#F26B6B',
  cat: '#B9C2D3', catDark: '#8C97AD', catNose: '#F4A0A8',
  pup: '#FFFFFF', pupShade: '#EEF1F7', pupBrown: '#B66E35', pupBrownDark: '#8A4E22',
  green: '#15803D', mint: '#DCFCE7', brand: '#EA580C', peach: '#FFEDD5',
};

const e = (tag, a, kids) => ({ tag, a, kids });
const path = (d, fill, x = {}) => e('path', { d, fill, ...x });
const line = (d, stroke, w = 3.5) => e('path', { d, fill: 'none', stroke, strokeWidth: w, strokeLinecap: 'round', strokeLinejoin: 'round' });
const circle = (cx, cy, r, fill, x = {}) => e('circle', { cx, cy, r, fill, ...x });
const ellipse = (cx, cy, rx, ry, fill, x = {}) => e('ellipse', { cx, cy, rx, ry, fill, ...x });
const g = (transform, kids) => e('g', { transform }, kids);

// 5 round petals as one path + center dot
const flower = (cx, cy, r, petal = C.deep) => {
  let d = '';
  for (let i = 0; i < 5; i++) {
    const t = (i * 72 - 90) * Math.PI / 180;
    const x = +(cx + Math.cos(t) * r).toFixed(1), y = +(cy + Math.sin(t) * r).toFixed(1), pr = +(r * 0.78).toFixed(1);
    d += `M${+(x - pr).toFixed(1)} ${y}a${pr} ${pr} 0 1 0 ${2 * pr} 0a${pr} ${pr} 0 1 0 ${-2 * pr} 0Z`;
  }
  return [path(d, petal), circle(cx, cy, +(r * 0.62).toFixed(1), C.white)];
};
const sparkle = (x, y, s, fill = C.white) => path(`M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z`, fill);
const heart = (x, y, s, fill) => g(`translate(${x} ${y}) scale(${s})`, [path('M0 7C-9 1-11-5-6-8C-3-10 0-8 0-5C0-8 3-10 6-8C11-5 9 1 0 7Z', fill)]);

// Shared face: same proportions on every character
const face = (cx, cy) => [
  circle(cx - 50, cy + 6, 10, C.ear), circle(cx + 50, cy + 6, 10, C.ear),
  ellipse(cx, cy, 50, 54, C.skin),
];
const features = (cx, cy) => [
  ellipse(cx - 31, cy + 20, 9, 6, C.cheek, { opacity: 0.85 }), ellipse(cx + 31, cy + 20, 9, 6, C.cheek, { opacity: 0.85 }),
  circle(cx - 18, cy + 5, 4.5, C.ink), circle(cx + 18, cy + 5, 4.5, C.ink),
  path(`M${cx - 12} ${cy + 22}Q${cx} ${cy + 36} ${cx + 12} ${cy + 22}Z`, C.mouth),
];

// 1. Girl with two buns hugging a corgi
const find = [
  path('M8 360C8 292 52 250 118 244L182 244C248 250 292 292 292 360Z', C.sweaterA),
  ...flower(52, 318, 13), ...flower(120, 300, 11), ...flower(96, 352, 12), ...flower(200, 340, 12), ...flower(262, 318, 11),
  e('rect', { x: 134, y: 200, width: 32, height: 50, rx: 14, fill: C.ear }),
  line('M118 246Q150 266 182 246', C.white, 7),
  circle(108, 112, 26, C.hair), circle(192, 112, 26, C.hair),
  ellipse(150, 166, 58, 60, C.hair),
  ...face(150, 168),
  path('M98 166C94 124 120 106 152 106C186 106 206 128 202 166C190 146 172 134 150 134C132 148 116 158 98 166Z', C.hair),
  ...features(150, 168),
  // corgi on her shoulder
  ellipse(246, 270, 50, 34, C.dog),
  ellipse(238, 280, 26, 20, C.white),
  path('M204 178C198 150 202 124 210 112C222 124 234 140 238 156Z', C.dog),
  path('M211 168C208 150 210 134 214 126C220 136 226 146 228 156Z', C.earIn),
  path('M250 152C262 136 276 122 290 114C294 132 290 156 282 176Z', C.dog),
  path('M258 152C266 142 276 134 284 130C286 142 282 156 278 166Z', C.earIn),
  ellipse(244, 188, 46, 40, C.dog),
  path('M238 152Q244 146 250 152L258 196L230 196Z', C.white),
  ellipse(244, 208, 30, 20, C.white),
  line('M218 184Q226 176 234 184', C.ink), line('M254 184Q262 176 270 184', C.ink),
  ellipse(244, 200, 7.5, 5.5, C.ink),
  path('M238 212Q244 230 252 212Z', C.tongue),
  line('M234 210Q239 215 244 210Q249 215 254 210', C.ink, 3),
  ellipse(216, 202, 7, 5, C.cheek, { opacity: 0.7 }), ellipse(274, 202, 7, 5, C.cheek, { opacity: 0.7 }),
  // dog paws over her shoulder
  path('M196 242Q204 224 220 230L222 262L198 262Z', C.dog), ellipse(209, 264, 14, 10, C.white),
  path('M260 236Q276 228 282 246L276 270L254 268Z', C.dog), ellipse(266, 270, 14, 10, C.white),
  // her hugging arm + hand
  path('M40 360C48 318 96 296 168 298L250 300C266 302 266 326 250 328L176 330C132 332 108 344 100 360Z', C.sweaterA),
  ...flower(70, 338, 9), ...flower(146, 316, 8),
  ellipse(260, 312, 18, 15, C.skin),
  sparkle(40, 120, 10), sparkle(286, 84, 7), circle(64, 186, 5, C.white, { opacity: 0.6 }),
];

// 2. Boy holding a cat, AI-reviewed badge
const reviewed = [
  path('M0 360C0 290 44 252 108 246L172 246C236 252 280 290 280 360Z', C.sweaterB),
  line('M14 332L46 332M234 332L266 332', C.sweaterBDark, 8),
  e('rect', { x: 124, y: 202, width: 32, height: 50, rx: 14, fill: C.ear }),
  line('M108 248Q140 268 172 248', C.white, 7),
  ...face(140, 170),
  path('M88 168C82 120 112 104 142 104C174 104 196 120 192 160C184 142 168 134 152 136C146 126 128 122 120 134C110 140 98 150 88 168Z', C.hairBrown),
  path('M132 106Q140 88 156 94Q146 98 144 108Z', C.hairBrown),
  ...features(140, 170),
  // cat in his arms
  path('M70 300C70 270 112 262 170 264C222 266 252 280 250 304C248 326 214 338 160 338C108 338 70 328 70 300Z', C.cat),
  line('M118 270L114 292M140 266L138 290M162 266L162 290', C.catDark, 7),
  line('M72 302C52 306 44 290 56 280', C.cat, 14),
  path('M196 246L200 208L222 232Z', C.cat), path('M246 232L268 208L270 248Z', C.cat),
  path('M202 238L204 220L214 232Z', C.catNose), path('M254 230L264 220L264 240Z', C.catNose),
  ellipse(234, 260, 40, 34, C.cat),
  line('M226 228L226 238M234 226L234 238M242 228L242 238', C.catDark, 4),
  ellipse(234, 276, 20, 13, C.white),
  circle(220, 262, 4.5, C.ink), circle(248, 262, 4.5, C.ink),
  path('M230 270L238 270L234 275Z', C.catNose),
  line('M228 280Q231 283 234 280Q237 283 240 280', C.ink, 2.5),
  ellipse(208, 274, 6, 4, C.cheek, { opacity: 0.8 }), ellipse(260, 274, 6, 4, C.cheek, { opacity: 0.8 }),
  // his arms around the cat
  path('M20 360C24 330 60 316 110 318L196 320C212 322 212 344 196 346L120 348C92 350 76 356 72 360Z', C.sweaterB),
  ellipse(206, 332, 16, 14, C.skin),
  path('M236 300C252 290 270 296 268 312L262 330L232 326Z', C.sweaterB),
  ellipse(250, 316, 15, 13, C.skin),
  // badge
  path('M262 54L300 68L300 104C300 130 284 146 262 156C240 146 224 130 224 104L224 68Z', C.white),
  path('M262 66L290 76L290 104C290 124 278 136 262 144C246 136 234 124 234 104L234 76Z', C.mint),
  line('M248 104L258 114L278 92', C.green, 7),
  sparkle(212, 60, 10), sparkle(312, 160, 7), sparkle(44, 110, 8), circle(206, 112, 5, C.white, { opacity: 0.6 }),
];

// 3. Woman and a puppy, safe-contact speech bubble
const contact = [
  ellipse(118, 220, 70, 92, C.hair),
  path('M-4 360C-4 292 38 252 96 246L140 246C198 252 236 292 236 360Z', C.sweaterC),
  ...[[30, 316], [70, 290], [56, 344], [118, 334], [176, 292], [196, 344], [146, 304]].map(([x, y]) => circle(x, y, 5, C.white, { opacity: 0.85 })),
  e('rect', { x: 102, y: 202, width: 32, height: 50, rx: 14, fill: C.ear }),
  line('M98 248Q118 264 138 248', C.sweaterCDark, 7),
  path('M48 196C46 236 52 268 70 290L84 250Z', C.hair), path('M188 196C190 236 184 268 166 290L152 250Z', C.hair),
  ...face(118, 172),
  path('M66 176C60 124 90 104 122 104C156 104 178 126 172 176C164 150 146 132 118 130C102 150 86 164 66 176Z', C.hair),
  ...features(118, 172),
  // puppy
  ellipse(246, 316, 50, 52, C.pup),
  path('M210 300C212 280 232 272 248 276L240 320Z', C.pupBrown),
  ellipse(226, 352, 16, 11, C.pupShade), ellipse(266, 352, 16, 11, C.pupShade),
  g('rotate(18 204 238)', [ellipse(204, 238, 14, 30, C.pupBrownDark)]),
  g('rotate(-18 290 238)', [ellipse(290, 238, 14, 30, C.pupBrownDark)]),
  ellipse(247, 232, 42, 38, C.pup),
  path('M240 196Q247 192 254 196L252 222L242 222Z', C.pupBrown),
  ellipse(262, 226, 13, 12, C.pupBrown),
  circle(232, 228, 4.5, C.ink), circle(262, 228, 4.5, C.ink),
  ellipse(247, 246, 15, 11, C.pupShade),
  ellipse(247, 240, 7, 5, C.ink),
  path('M242 252Q247 266 252 252Z', C.tongue),
  line('M238 250Q242 254 247 250Q252 254 256 250', C.ink, 3),
  ellipse(222, 244, 6, 4, C.cheek, { opacity: 0.8 }), ellipse(272, 244, 6, 4, C.cheek, { opacity: 0.8 }),
  // her hand on the puppy's back
  path('M150 330C168 316 196 312 214 318L210 340C190 340 170 346 160 352Z', C.sweaterC),
  ellipse(218, 330, 15, 13, C.skin),
  // speech bubble
  path('M238 60H294C304 60 312 68 312 78V118C312 128 304 136 294 136H262L246 152L248 136H238C228 136 220 128 220 118V78C220 68 228 60 238 60Z', C.white),
  heart(266, 98, 2.6, C.brand),
  sparkle(206, 162, 8), sparkle(30, 90, 9), sparkle(300, 182, 6), circle(196, 70, 5, C.white, { opacity: 0.6 }),
];

const kebab = (k) => k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
const svgEl = (n, pad) => {
  const attrs = Object.entries(n.a).map(([k, v]) => `${kebab(k)}="${v}"`).join(' ');
  return n.kids ? `${pad}<${n.tag} ${attrs}>\n${n.kids.map((k) => svgEl(k, pad + '  ')).join('\n')}\n${pad}</${n.tag}>` : `${pad}<${n.tag} ${attrs}/>`;
};
const Tag = { path: 'Path', circle: 'Circle', ellipse: 'Ellipse', rect: 'Rect', g: 'G' };
const tsxEl = (n, pad) => {
  const attrs = Object.entries(n.a).map(([k, v]) => (typeof v === 'number' ? `${k}={${v}}` : `${k}="${v}"`)).join(' ');
  return n.kids ? `${pad}<${Tag[n.tag]} ${attrs}>\n${n.kids.map((k) => tsxEl(k, pad + '  ')).join('\n')}\n${pad}</${Tag[n.tag]}>` : `${pad}<${Tag[n.tag]} ${attrs} />`;
};

const scenes = [['Find', find], ['Reviewed', reviewed], ['Contact', contact]];
scenes.forEach(([, els], i) => {
  writeFileSync(new URL(`./${i + 1}.svg`, import.meta.url), `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="360" viewBox="0 0 320 360">\n${els.map((n) => svgEl(n, '  ')).join('\n')}\n</svg>\n`);
});

const svgs = scenes.map(([, els], i) => `<svg id="s${i + 1}" width="320" height="360" viewBox="0 0 320 360">${els.map((n) => svgEl(n, '')).join('')}</svg>`).join('');
writeFileSync(new URL('./show.js', import.meta.url), `async page => { await page.setContent(${JSON.stringify(`<body style="margin:0;background:#5B8DEF;display:flex;gap:16px;padding:16px">${svgs}</body>`)}); }`);

if (out) {
  const body = scenes.map(([name, els]) => `export function ${name}({ width = 320, height = 360 }: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 320 360" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
${els.map((n) => tsxEl(n, '      ')).join('\n')}
    </Svg>
  );
}`).join('\n\n');
  writeFileSync(out, `import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

// Flat onboarding art (welcome carousel); decorative, the card text carries the meaning
type Props = { width?: number; height?: number };

${body}
`);
}
