import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

// Flat onboarding art (welcome carousel); decorative, the card text carries the meaning
type Props = { width?: number; height?: number };

export function Find({ width = 320, height = 360 }: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 320 360" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path d="M8 360C8 292 52 250 118 244L182 244C248 250 292 292 292 360Z" fill="#CFE0FF" />
      <Path d="M41.9 305a10.1 10.1 0 1 0 20.2 0a10.1 10.1 0 1 0 -20.2 0ZM54.3 314a10.1 10.1 0 1 0 20.2 0a10.1 10.1 0 1 0 -20.2 0ZM49.5 328.5a10.1 10.1 0 1 0 20.2 0a10.1 10.1 0 1 0 -20.2 0ZM34.3 328.5a10.1 10.1 0 1 0 20.2 0a10.1 10.1 0 1 0 -20.2 0ZM29.5 314a10.1 10.1 0 1 0 20.2 0a10.1 10.1 0 1 0 -20.2 0Z" fill="#3B6FD8" />
      <Circle cx={52} cy={318} r={8.1} fill="#FFFFFF" />
      <Path d="M111.4 289a8.6 8.6 0 1 0 17.2 0a8.6 8.6 0 1 0 -17.2 0ZM121.9 296.6a8.6 8.6 0 1 0 17.2 0a8.6 8.6 0 1 0 -17.2 0ZM117.9 308.9a8.6 8.6 0 1 0 17.2 0a8.6 8.6 0 1 0 -17.2 0ZM104.9 308.9a8.6 8.6 0 1 0 17.2 0a8.6 8.6 0 1 0 -17.2 0ZM100.9 296.6a8.6 8.6 0 1 0 17.2 0a8.6 8.6 0 1 0 -17.2 0Z" fill="#3B6FD8" />
      <Circle cx={120} cy={300} r={6.8} fill="#FFFFFF" />
      <Path d="M86.6 340a9.4 9.4 0 1 0 18.8 0a9.4 9.4 0 1 0 -18.8 0ZM98 348.3a9.4 9.4 0 1 0 18.8 0a9.4 9.4 0 1 0 -18.8 0ZM93.7 361.7a9.4 9.4 0 1 0 18.8 0a9.4 9.4 0 1 0 -18.8 0ZM79.5 361.7a9.4 9.4 0 1 0 18.8 0a9.4 9.4 0 1 0 -18.8 0ZM75.2 348.3a9.4 9.4 0 1 0 18.8 0a9.4 9.4 0 1 0 -18.8 0Z" fill="#3B6FD8" />
      <Circle cx={96} cy={352} r={7.4} fill="#FFFFFF" />
      <Path d="M190.6 328a9.4 9.4 0 1 0 18.8 0a9.4 9.4 0 1 0 -18.8 0ZM202 336.3a9.4 9.4 0 1 0 18.8 0a9.4 9.4 0 1 0 -18.8 0ZM197.7 349.7a9.4 9.4 0 1 0 18.8 0a9.4 9.4 0 1 0 -18.8 0ZM183.5 349.7a9.4 9.4 0 1 0 18.8 0a9.4 9.4 0 1 0 -18.8 0ZM179.2 336.3a9.4 9.4 0 1 0 18.8 0a9.4 9.4 0 1 0 -18.8 0Z" fill="#3B6FD8" />
      <Circle cx={200} cy={340} r={7.4} fill="#FFFFFF" />
      <Path d="M253.4 307a8.6 8.6 0 1 0 17.2 0a8.6 8.6 0 1 0 -17.2 0ZM263.9 314.6a8.6 8.6 0 1 0 17.2 0a8.6 8.6 0 1 0 -17.2 0ZM259.9 326.9a8.6 8.6 0 1 0 17.2 0a8.6 8.6 0 1 0 -17.2 0ZM246.9 326.9a8.6 8.6 0 1 0 17.2 0a8.6 8.6 0 1 0 -17.2 0ZM242.9 314.6a8.6 8.6 0 1 0 17.2 0a8.6 8.6 0 1 0 -17.2 0Z" fill="#3B6FD8" />
      <Circle cx={262} cy={318} r={6.8} fill="#FFFFFF" />
      <Rect x={134} y={200} width={32} height={50} rx={14} fill="#F0B48C" />
      <Path d="M118 246Q150 266 182 246" fill="none" stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={108} cy={112} r={26} fill="#231C2E" />
      <Circle cx={192} cy={112} r={26} fill="#231C2E" />
      <Ellipse cx={150} cy={166} rx={58} ry={60} fill="#231C2E" />
      <Circle cx={100} cy={174} r={10} fill="#F0B48C" />
      <Circle cx={200} cy={174} r={10} fill="#F0B48C" />
      <Ellipse cx={150} cy={168} rx={50} ry={54} fill="#F8C9A4" />
      <Path d="M98 166C94 124 120 106 152 106C186 106 206 128 202 166C190 146 172 134 150 134C132 148 116 158 98 166Z" fill="#231C2E" />
      <Ellipse cx={119} cy={188} rx={9} ry={6} fill="#F59A9A" opacity={0.85} />
      <Ellipse cx={181} cy={188} rx={9} ry={6} fill="#F59A9A" opacity={0.85} />
      <Circle cx={132} cy={173} r={4.5} fill="#1C1917" />
      <Circle cx={168} cy={173} r={4.5} fill="#1C1917" />
      <Path d="M138 190Q150 204 162 190Z" fill="#9F3A38" />
      <Ellipse cx={246} cy={270} rx={50} ry={34} fill="#EE8A3C" />
      <Ellipse cx={238} cy={280} rx={26} ry={20} fill="#FFFFFF" />
      <Path d="M204 178C198 150 202 124 210 112C222 124 234 140 238 156Z" fill="#EE8A3C" />
      <Path d="M211 168C208 150 210 134 214 126C220 136 226 146 228 156Z" fill="#FFD2AE" />
      <Path d="M250 152C262 136 276 122 290 114C294 132 290 156 282 176Z" fill="#EE8A3C" />
      <Path d="M258 152C266 142 276 134 284 130C286 142 282 156 278 166Z" fill="#FFD2AE" />
      <Ellipse cx={244} cy={188} rx={46} ry={40} fill="#EE8A3C" />
      <Path d="M238 152Q244 146 250 152L258 196L230 196Z" fill="#FFFFFF" />
      <Ellipse cx={244} cy={208} rx={30} ry={20} fill="#FFFFFF" />
      <Path d="M218 184Q226 176 234 184" fill="none" stroke="#1C1917" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M254 184Q262 176 270 184" fill="none" stroke="#1C1917" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
      <Ellipse cx={244} cy={200} rx={7.5} ry={5.5} fill="#1C1917" />
      <Path d="M238 212Q244 230 252 212Z" fill="#F26B6B" />
      <Path d="M234 210Q239 215 244 210Q249 215 254 210" fill="none" stroke="#1C1917" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <Ellipse cx={216} cy={202} rx={7} ry={5} fill="#F59A9A" opacity={0.7} />
      <Ellipse cx={274} cy={202} rx={7} ry={5} fill="#F59A9A" opacity={0.7} />
      <Path d="M196 242Q204 224 220 230L222 262L198 262Z" fill="#EE8A3C" />
      <Ellipse cx={209} cy={264} rx={14} ry={10} fill="#FFFFFF" />
      <Path d="M260 236Q276 228 282 246L276 270L254 268Z" fill="#EE8A3C" />
      <Ellipse cx={266} cy={270} rx={14} ry={10} fill="#FFFFFF" />
      <Path d="M40 360C48 318 96 296 168 298L250 300C266 302 266 326 250 328L176 330C132 332 108 344 100 360Z" fill="#CFE0FF" />
      <Path d="M63 329a7 7 0 1 0 14 0a7 7 0 1 0 -14 0ZM71.6 335.2a7 7 0 1 0 14 0a7 7 0 1 0 -14 0ZM68.3 345.3a7 7 0 1 0 14 0a7 7 0 1 0 -14 0ZM57.7 345.3a7 7 0 1 0 14 0a7 7 0 1 0 -14 0ZM54.4 335.2a7 7 0 1 0 14 0a7 7 0 1 0 -14 0Z" fill="#3B6FD8" />
      <Circle cx={70} cy={338} r={5.6} fill="#FFFFFF" />
      <Path d="M139.8 308a6.2 6.2 0 1 0 12.4 0a6.2 6.2 0 1 0 -12.4 0ZM147.4 313.5a6.2 6.2 0 1 0 12.4 0a6.2 6.2 0 1 0 -12.4 0ZM144.5 322.5a6.2 6.2 0 1 0 12.4 0a6.2 6.2 0 1 0 -12.4 0ZM135.1 322.5a6.2 6.2 0 1 0 12.4 0a6.2 6.2 0 1 0 -12.4 0ZM132.2 313.5a6.2 6.2 0 1 0 12.4 0a6.2 6.2 0 1 0 -12.4 0Z" fill="#3B6FD8" />
      <Circle cx={146} cy={316} r={5} fill="#FFFFFF" />
      <Ellipse cx={260} cy={312} rx={18} ry={15} fill="#F8C9A4" />
      <Path d="M40 110Q40 120 50 120Q40 120 40 130Q40 120 30 120Q40 120 40 110Z" fill="#FFFFFF" />
      <Path d="M286 77Q286 84 293 84Q286 84 286 91Q286 84 279 84Q286 84 286 77Z" fill="#FFFFFF" />
      <Circle cx={64} cy={186} r={5} fill="#FFFFFF" opacity={0.6} />
    </Svg>
  );
}

export function Reviewed({ width = 320, height = 360 }: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 320 360" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path d="M0 360C0 290 44 252 108 246L172 246C236 252 280 290 280 360Z" fill="#FFCB5C" />
      <Path d="M14 332L46 332M234 332L266 332" fill="none" stroke="#F2A93B" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
      <Rect x={124} y={202} width={32} height={50} rx={14} fill="#F0B48C" />
      <Path d="M108 248Q140 268 172 248" fill="none" stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={90} cy={176} r={10} fill="#F0B48C" />
      <Circle cx={190} cy={176} r={10} fill="#F0B48C" />
      <Ellipse cx={140} cy={170} rx={50} ry={54} fill="#F8C9A4" />
      <Path d="M88 168C82 120 112 104 142 104C174 104 196 120 192 160C184 142 168 134 152 136C146 126 128 122 120 134C110 140 98 150 88 168Z" fill="#4A2E22" />
      <Path d="M132 106Q140 88 156 94Q146 98 144 108Z" fill="#4A2E22" />
      <Ellipse cx={109} cy={190} rx={9} ry={6} fill="#F59A9A" opacity={0.85} />
      <Ellipse cx={171} cy={190} rx={9} ry={6} fill="#F59A9A" opacity={0.85} />
      <Circle cx={122} cy={175} r={4.5} fill="#1C1917" />
      <Circle cx={158} cy={175} r={4.5} fill="#1C1917" />
      <Path d="M128 192Q140 206 152 192Z" fill="#9F3A38" />
      <Path d="M70 300C70 270 112 262 170 264C222 266 252 280 250 304C248 326 214 338 160 338C108 338 70 328 70 300Z" fill="#B9C2D3" />
      <Path d="M118 270L114 292M140 266L138 290M162 266L162 290" fill="none" stroke="#8C97AD" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M72 302C52 306 44 290 56 280" fill="none" stroke="#B9C2D3" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M196 246L200 208L222 232Z" fill="#B9C2D3" />
      <Path d="M246 232L268 208L270 248Z" fill="#B9C2D3" />
      <Path d="M202 238L204 220L214 232Z" fill="#F4A0A8" />
      <Path d="M254 230L264 220L264 240Z" fill="#F4A0A8" />
      <Ellipse cx={234} cy={260} rx={40} ry={34} fill="#B9C2D3" />
      <Path d="M226 228L226 238M234 226L234 238M242 228L242 238" fill="none" stroke="#8C97AD" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      <Ellipse cx={234} cy={276} rx={20} ry={13} fill="#FFFFFF" />
      <Circle cx={220} cy={262} r={4.5} fill="#1C1917" />
      <Circle cx={248} cy={262} r={4.5} fill="#1C1917" />
      <Path d="M230 270L238 270L234 275Z" fill="#F4A0A8" />
      <Path d="M228 280Q231 283 234 280Q237 283 240 280" fill="none" stroke="#1C1917" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <Ellipse cx={208} cy={274} rx={6} ry={4} fill="#F59A9A" opacity={0.8} />
      <Ellipse cx={260} cy={274} rx={6} ry={4} fill="#F59A9A" opacity={0.8} />
      <Path d="M20 360C24 330 60 316 110 318L196 320C212 322 212 344 196 346L120 348C92 350 76 356 72 360Z" fill="#FFCB5C" />
      <Ellipse cx={206} cy={332} rx={16} ry={14} fill="#F8C9A4" />
      <Path d="M236 300C252 290 270 296 268 312L262 330L232 326Z" fill="#FFCB5C" />
      <Ellipse cx={250} cy={316} rx={15} ry={13} fill="#F8C9A4" />
      <Path d="M262 54L300 68L300 104C300 130 284 146 262 156C240 146 224 130 224 104L224 68Z" fill="#FFFFFF" />
      <Path d="M262 66L290 76L290 104C290 124 278 136 262 144C246 136 234 124 234 104L234 76Z" fill="#DCFCE7" />
      <Path d="M248 104L258 114L278 92" fill="none" stroke="#15803D" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M212 50Q212 60 222 60Q212 60 212 70Q212 60 202 60Q212 60 212 50Z" fill="#FFFFFF" />
      <Path d="M312 153Q312 160 319 160Q312 160 312 167Q312 160 305 160Q312 160 312 153Z" fill="#FFFFFF" />
      <Path d="M44 102Q44 110 52 110Q44 110 44 118Q44 110 36 110Q44 110 44 102Z" fill="#FFFFFF" />
      <Circle cx={206} cy={112} r={5} fill="#FFFFFF" opacity={0.6} />
    </Svg>
  );
}

export function Contact({ width = 320, height = 360 }: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 320 360" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Ellipse cx={118} cy={220} rx={70} ry={92} fill="#231C2E" />
      <Path d="M-4 360C-4 292 38 252 96 246L140 246C198 252 236 292 236 360Z" fill="#FF9F7A" />
      <Circle cx={30} cy={316} r={5} fill="#FFFFFF" opacity={0.85} />
      <Circle cx={70} cy={290} r={5} fill="#FFFFFF" opacity={0.85} />
      <Circle cx={56} cy={344} r={5} fill="#FFFFFF" opacity={0.85} />
      <Circle cx={118} cy={334} r={5} fill="#FFFFFF" opacity={0.85} />
      <Circle cx={176} cy={292} r={5} fill="#FFFFFF" opacity={0.85} />
      <Circle cx={196} cy={344} r={5} fill="#FFFFFF" opacity={0.85} />
      <Circle cx={146} cy={304} r={5} fill="#FFFFFF" opacity={0.85} />
      <Rect x={102} y={202} width={32} height={50} rx={14} fill="#F0B48C" />
      <Path d="M98 248Q118 264 138 248" fill="none" stroke="#F07F5A" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M48 196C46 236 52 268 70 290L84 250Z" fill="#231C2E" />
      <Path d="M188 196C190 236 184 268 166 290L152 250Z" fill="#231C2E" />
      <Circle cx={68} cy={178} r={10} fill="#F0B48C" />
      <Circle cx={168} cy={178} r={10} fill="#F0B48C" />
      <Ellipse cx={118} cy={172} rx={50} ry={54} fill="#F8C9A4" />
      <Path d="M66 176C60 124 90 104 122 104C156 104 178 126 172 176C164 150 146 132 118 130C102 150 86 164 66 176Z" fill="#231C2E" />
      <Ellipse cx={87} cy={192} rx={9} ry={6} fill="#F59A9A" opacity={0.85} />
      <Ellipse cx={149} cy={192} rx={9} ry={6} fill="#F59A9A" opacity={0.85} />
      <Circle cx={100} cy={177} r={4.5} fill="#1C1917" />
      <Circle cx={136} cy={177} r={4.5} fill="#1C1917" />
      <Path d="M106 194Q118 208 130 194Z" fill="#9F3A38" />
      <Ellipse cx={246} cy={316} rx={50} ry={52} fill="#FFFFFF" />
      <Path d="M210 300C212 280 232 272 248 276L240 320Z" fill="#B66E35" />
      <Ellipse cx={226} cy={352} rx={16} ry={11} fill="#EEF1F7" />
      <Ellipse cx={266} cy={352} rx={16} ry={11} fill="#EEF1F7" />
      <G transform="rotate(18 204 238)">
        <Ellipse cx={204} cy={238} rx={14} ry={30} fill="#8A4E22" />
      </G>
      <G transform="rotate(-18 290 238)">
        <Ellipse cx={290} cy={238} rx={14} ry={30} fill="#8A4E22" />
      </G>
      <Ellipse cx={247} cy={232} rx={42} ry={38} fill="#FFFFFF" />
      <Path d="M240 196Q247 192 254 196L252 222L242 222Z" fill="#B66E35" />
      <Ellipse cx={262} cy={226} rx={13} ry={12} fill="#B66E35" />
      <Circle cx={232} cy={228} r={4.5} fill="#1C1917" />
      <Circle cx={262} cy={228} r={4.5} fill="#1C1917" />
      <Ellipse cx={247} cy={246} rx={15} ry={11} fill="#EEF1F7" />
      <Ellipse cx={247} cy={240} rx={7} ry={5} fill="#1C1917" />
      <Path d="M242 252Q247 266 252 252Z" fill="#F26B6B" />
      <Path d="M238 250Q242 254 247 250Q252 254 256 250" fill="none" stroke="#1C1917" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <Ellipse cx={222} cy={244} rx={6} ry={4} fill="#F59A9A" opacity={0.8} />
      <Ellipse cx={272} cy={244} rx={6} ry={4} fill="#F59A9A" opacity={0.8} />
      <Path d="M150 330C168 316 196 312 214 318L210 340C190 340 170 346 160 352Z" fill="#FF9F7A" />
      <Ellipse cx={218} cy={330} rx={15} ry={13} fill="#F8C9A4" />
      <Path d="M238 60H294C304 60 312 68 312 78V118C312 128 304 136 294 136H262L246 152L248 136H238C228 136 220 128 220 118V78C220 68 228 60 238 60Z" fill="#FFFFFF" />
      <G transform="translate(266 98) scale(2.6)">
        <Path d="M0 7C-9 1-11-5-6-8C-3-10 0-8 0-5C0-8 3-10 6-8C11-5 9 1 0 7Z" fill="#EA580C" />
      </G>
      <Path d="M206 154Q206 162 214 162Q206 162 206 170Q206 162 198 162Q206 162 206 154Z" fill="#FFFFFF" />
      <Path d="M30 81Q30 90 39 90Q30 90 30 99Q30 90 21 90Q30 90 30 81Z" fill="#FFFFFF" />
      <Path d="M300 176Q300 182 306 182Q300 182 300 188Q300 182 294 182Q300 182 300 176Z" fill="#FFFFFF" />
      <Circle cx={196} cy={70} r={5} fill="#FFFFFF" opacity={0.6} />
    </Svg>
  );
}
