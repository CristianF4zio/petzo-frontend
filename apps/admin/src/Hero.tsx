const skin = '#F4C7A1'
const sweater = '#FDBA74'
const dog = '#D9A066'
const dogDark = '#A86B3C'
const ink = '#1C1917'
const cheek = '#F9A8B4'

const Flower = ({ x, y, r = 7, fill }: { x: number; y: number; r?: number; fill: string }) => (
  <g transform={`translate(${x} ${y})`}>
    {[0, 72, 144, 216, 288].map(a => <circle key={a} cx={0} cy={-r} r={r} fill={fill} transform={`rotate(${a})`} />)}
    <circle r={r * 0.75} fill="#FDE68A" />
  </g>
)

// Flat illustration: person hugging a dog and a cat (MASTER § Illustrations)
export const Hero = () => (
  <svg className="hero-art" viewBox="0 0 360 330" role="img" aria-label="Persona abrazando a un perro y a un gato">
    <circle cx="180" cy="170" r="150" fill="#fff" opacity="0.12" />
    <ellipse cx="180" cy="306" rx="150" ry="16" fill="#3B6FD8" />
    <Flower x={42} y={250} fill="#FBCFE8" />
    <Flower x={316} y={236} r={8} fill="#DDD6FE" />
    <Flower x={58} y={78} r={5} fill="#FEF3C7" />
    <Flower x={300} y={64} r={6} fill="#FBCFE8" />
    <Flower x={330} y={150} r={4} fill="#FEF3C7" />
    <circle cx="24" cy="160" r="4" fill="#DBEAFE" />
    <circle cx="96" cy="40" r="3" fill="#DBEAFE" />

    {/* person */}
    <path d="M100 306c0-78 30-124 80-124s80 46 80 124z" fill={sweater} />
    <rect x="168" y="160" width="24" height="30" rx="10" fill={skin} />
    <circle cx="180" cy="128" r="42" fill={skin} />
    <circle cx="180" cy="76" r="15" fill="#4A2E22" />
    <path d="M136 132c-4-32 16-52 44-52s48 20 44 52c-12-18-28-24-44-24s-32 6-44 24z" fill="#4A2E22" />
    <circle cx="166" cy="134" r="3.5" fill={ink} />
    <circle cx="194" cy="134" r="3.5" fill={ink} />
    <ellipse cx="157" cy="147" rx="7" ry="4.5" fill={cheek} />
    <ellipse cx="203" cy="147" rx="7" ry="4.5" fill={cheek} />
    <path d="M173 150q7 6 14 0" stroke={ink} strokeWidth="3" strokeLinecap="round" fill="none" />

    {/* pet bodies, then the hugging arms over them */}
    <ellipse cx="122" cy="282" rx="36" ry="26" fill={dog} />
    <ellipse cx="240" cy="284" rx="32" ry="24" fill="#fff" />
    <path d="M122 206c-30 26-26 76 16 80 18 2 34-4 42-12" stroke={sweater} strokeWidth="24" strokeLinecap="round" fill="none" />
    <path d="M238 206c30 26 26 76-16 80-18 2-34-4-42-12" stroke={sweater} strokeWidth="24" strokeLinecap="round" fill="none" />
    <circle cx="170" cy="276" r="11" fill={skin} />
    <circle cx="190" cy="276" r="11" fill={skin} />

    {/* dog head */}
    <ellipse cx="94" cy="230" rx="11" ry="21" fill={dogDark} transform="rotate(18 94 230)" />
    <ellipse cx="150" cy="230" rx="11" ry="21" fill={dogDark} transform="rotate(-18 150 230)" />
    <circle cx="122" cy="226" r="31" fill={dog} />
    <ellipse cx="122" cy="242" rx="15" ry="11" fill="#F3D9BC" />
    <ellipse cx="122" cy="236" rx="5.5" ry="4" fill={ink} />
    <circle cx="111" cy="220" r="3.2" fill={ink} />
    <circle cx="133" cy="220" r="3.2" fill={ink} />
    <ellipse cx="102" cy="234" rx="5" ry="3.5" fill={cheek} />
    <ellipse cx="142" cy="234" rx="5" ry="3.5" fill={cheek} />

    {/* cat head */}
    <path d="M216 224l2-36 26 20z" fill="#fff" />
    <path d="M264 224l-2-36-26 20z" fill="#fff" />
    <path d="M221 214l1-18 12 10z" fill={cheek} />
    <path d="M259 214l-1-18-12 10z" fill={cheek} />
    <circle cx="240" cy="234" r="28" fill="#fff" />
    <path d="M240 206a28 28 0 0 1 26 18c-10 4-20 2-26-6z" fill="#CBD5E1" />
    <circle cx="230" cy="234" r="3.2" fill={ink} />
    <circle cx="250" cy="234" r="3.2" fill={ink} />
    <path d="M236 242h8l-4 4z" fill="#F472B6" />
    <ellipse cx="222" cy="246" rx="5" ry="3.5" fill={cheek} />
    <ellipse cx="258" cy="246" rx="5" ry="3.5" fill={cheek} />
  </svg>
)
