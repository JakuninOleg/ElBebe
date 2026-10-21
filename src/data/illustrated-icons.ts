import { groupLessonIcons } from './group-lesson-icons';
// The hero illustrations define the palette and shape language.
// Static SVG markup only: these strings never contain editor-provided HTML.
const rays = '<g fill="#ffcf23"><path d="M101 23c1-12 10-16 12-9s-8 14-12 9ZM105 35c10-9 18-6 13 0s-14 6-13 0Z"/></g>';
const leftRays = '<g fill="#ffcf23"><path d="M16 76C3 65-2 73 5 78s17 3 11-2ZM16 91C2 92 2 102 9 98s13-9 7-7Z"/></g>';
const seaWave = 'M10 0C16-6 24-6 30 0S44 6 50 0S64-6 70 0S84 6 90 0S104-6 110 0';

export const illustratedIcons: Record<string, string> = {
  ...groupLessonIcons,
  moon: `<path d="M82 14A43 43 0 1 0 105 77C68 92 41 43 82 14Z" fill="#8c65ba"/><path d="M43 26A43 43 0 0 0 75 99C36 85 31 54 43 26Z" fill="#b49bd2"/><path d="m94 20 4 9 10 1-8 7 2 10-8-5-9 5 2-10-8-7 11-1Z" fill="#ffcf48"/><path d="m108 56 2 6 7 1-5 4 1 6-5-3-5 3 1-6-5-4 7-1Z" fill="#ffcf48"/>`,
  heart: `<path d="M60 96C46 86 20 65 24 40C27 21 48 20 59 38C68 15 93 15 98 35C106 59 84 82 60 96Z" fill="#ff646e"/>
    <path d="M36 27C45 24 54 28 59 38C63 28 69 22 78 21C69 35 70 54 58 64C46 54 36 42 36 27Z" fill="#ff7c82"/>
    <g fill="#ffcf23"><path d="M17 49C4 37-2 44 5 50S22 55 17 49Z M15 68C-2 67 0 78 8 75S23 68 15 68Z M23 84C8 90 13 100 20 94S30 81 23 84Z M105 47C115 33 123 40 115 47S99 55 105 47Z M105 69C123 66 123 77 115 76S99 70 105 69Z"/></g>`,
  blocks: `<g stroke-width="1.6" stroke-linejoin="round">
      <path d="m16 60 22-12 22 12-22 12Z" fill="#72d4e9" stroke="#72d4e9"/>
      <path d="m16 60 22 12v26L16 86Z" fill="#29b8dc" stroke="#29b8dc"/>
      <path d="m38 72 22-12v26L38 98Z" fill="#1599c5" stroke="#1599c5"/>
      <path d="m60 60 22-12 22 12-22 12Z" fill="#ffa0a8" stroke="#ffa0a8"/>
      <path d="m60 60 22 12v26L60 86Z" fill="#ff7584" stroke="#ff7584"/>
      <path d="m82 72 22-12v26L82 98Z" fill="#ee536e" stroke="#ee536e"/>
      <path d="m38 22 22-12 22 12-22 12Z" fill="#ffe47b" stroke="#ffe47b"/>
      <path d="m38 22 22 12v26L38 48Z" fill="#ffcf36" stroke="#ffcf36"/>
      <path d="m60 34 22-12v26L60 60Z" fill="#efb72c" stroke="#efb72c"/>
    </g>
    <g stroke="#fffdf7" stroke-width="2.8" stroke-linecap="round" opacity=".65"><path d="m22 68 10 5m12-43 10 5"/></g>
    <g fill="#ffcf23"><path d="M18 35C7 32 5 24 10 23s12 8 8 12ZM99 32c-1-11 6-18 10-13s-5 16-10 13Z"/></g>`,
  sea: `<path d="M33 61a27 27 0 0 1 54 0Z" fill="#ffcf36"/>
    <path d="M33 61a27 27 0 0 1 37-25C52 33 39 44 39 61Z" fill="#ffe47b"/>
    <g stroke="#ffcf23" stroke-width="5" stroke-linecap="round"><path d="M60 13v9M32 23l6 7M16 45l9 3M88 23l-6 7M104 45l-9 3"/></g>
    <g stroke="#19add5" stroke-width="5.5" stroke-linecap="round" fill="none">
      <path d="${seaWave}" transform="translate(0 72)"/>
      <path d="${seaWave}" transform="translate(0 86)"/>
      <path d="${seaWave}" transform="translate(0 100)"/>
    </g>`,
  palette: `<path d="M65 17C32 12 12 34 16 61c4 28 31 39 53 28 12-6-7-15 0-24 5-7 19 2 27-9 12-18-9-36-31-39Z" fill="#ffcf48"/>
    <path d="M24 58c-1-21 12-33 33-36-28-4-45 17-41 39 3 19 16 28 31 31-13-7-21-18-23-34Z" fill="#ffe38a"/>
    <circle cx="35" cy="47" r="8" fill="#ff6475"/><circle cx="53" cy="33" r="8" fill="#1baee0"/><circle cx="77" cy="39" r="8" fill="#8aba57"/><circle cx="37" cy="71" r="7" fill="#a768c0"/>
    <ellipse cx="60" cy="77" rx="7" ry="6" fill="#fffdf7"/>
    <path d="m88 62 9 6-24 34c-5 5-12 0-8-6Z" fill="#ff6475"/><path d="m88 62 6-12 12 8-9 10Z" fill="#b9cde0"/><path d="M95 51c-2-15 10-14 14-25 6 17 3 28-5 32Z" fill="#8460ab"/>${leftRays}`,
  people: `<path d="M67 57c13-7 32 1 32 18v17H69Z" fill="#8aba57"/><circle cx="83" cy="39" r="15" fill="#ffcf48"/>
    <path d="M13 75c0-17 17-26 32-18l5 35H13Z" fill="#ff6475"/><circle cx="29" cy="39" r="15" fill="#ffcf48"/>
    <path d="M34 80c0-17 11-26 24-26s25 9 25 26v21H34Z" fill="#1baee0"/>
    <path d="M34 80c0-17 11-26 24-26-10 7-15 19-15 33v14h-9Z" fill="#53c7e9"/>
    <circle cx="58" cy="29" r="18" fill="#ffdc74"/>${rays}`,
  leaf: `<path d="M58 100c-3-28-2-48 5-67" stroke="#559a88" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M58 72C20 73 14 48 15 35c31-1 44 15 43 37Z" fill="#8aba57"/>
    <path d="M58 72C38 65 24 52 15 35c2 27 17 39 43 37Z" fill="#70a348"/>
    <path d="M62 54C58 20 80 10 96 12c1 25-10 41-34 42Z" fill="#a4c76c"/>
    <path d="M62 54c17-11 28-25 34-42 1 25-10 41-34 42Z" fill="#8aba57"/>${leftRays}`,
  sparkle: `<path d="m58 10 14 29 33 5-24 24 5 33-28-16-29 16 6-33-24-24 33-5Z" fill="#ffcf24"/>
    <path d="m58 10 2 46-31 45 6-33-24-24 33-5Z" fill="#ffdf66"/>
    <path d="m94 8 4 10 11 3-10 5-3 11-5-10-10-3 10-5Z" fill="#ff8e96"/>`,
  sun: `<circle cx="59" cy="57" r="28" fill="#ffcf24"/><path d="M43 75a28 28 0 0 1 35-42c-26-9-45 13-35 42Z" fill="#ffe274"/>
    <g stroke="#ffcf24" stroke-width="6" stroke-linecap="round" fill="none"><path d="M59 9v10M59 95v10M11 57h10M97 57h10M25 23l8 8M86 84l8 8M25 91l8-8M86 30l8-8"/></g>`,
  apple: `<path d="M61 35C33 16 10 35 20 67c7 23 19 38 40 28 21 10 34-5 41-28 10-32-14-51-40-32Z" fill="#ff646e"/>
    <path d="M61 35C33 16 10 35 20 67c4 13 10 24 18 29-13-28-11-57 23-61Z" fill="#ff8e96"/>
    <path d="M60 35c-1-13 2-20 10-27" stroke="#926c4b" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M69 22C77 5 91 5 98 8c-3 14-13 22-29 14Z" fill="#8aba57"/>
    <path d="M33 48c-4 7-4 15-1 22" stroke="#ffd8dd" stroke-width="6" stroke-linecap="round" fill="none"/>`,
  tree: `<path d="M52 63h16v40H52Z" fill="#b38658"/><path d="M52 63h6v40h-6Z" fill="#cba06e"/>
    <path d="M20 56c-11-17 1-33 17-33C43 0 74 0 81 23c23-1 33 26 18 40 6 21-20 32-38 21-22 14-48 2-41-28Z" fill="#8aba57"/>
    <path d="M20 56c-11-17 1-33 17-33C43 0 63 4 70 9 42 9 49 35 31 44c-6 3-8 7-11 12Z" fill="#afd67c"/>
    <path d="M62 84V51m0 18 15-10m-15 1-13-9" stroke="#70a348" stroke-width="5" stroke-linecap="round" fill="none"/>`,
  home: `<path d="M25 48h70v54H25Z" fill="#1baee0"/><path d="M25 48h18v54H25Z" fill="#53c7e9"/>
    <path d="M10 51 55 9c3-3 7-3 10 0l45 42c4 5-2 12-7 8L60 23 17 59c-6 5-12-3-7-8Z" fill="#ff6475"/>
    <path d="M49 70a11 11 0 0 1 22 0v32H49Z" fill="#ffcf24"/><rect x="32" y="58" width="13" height="17" rx="3" fill="#fffdf7"/><rect x="77" y="58" width="12" height="17" rx="3" fill="#fffdf7"/>
    <path d="M10 102c-5-13 6-22 15-15 4-10 19-6 17 15Z" fill="#8aba57"/>`,
  book: `<path d="M11 22c18-8 34-8 49 1 15-9 31-9 49-1v73c-17-6-34-6-49 3-15-9-32-9-49-3Z" fill="#1baee0"/>
    <path d="M18 14c16-5 29-2 42 7v69c-14-9-28-10-42-5Z" fill="#fff0bd"/>
    <path d="M60 21c13-9 27-12 42-7v71c-14-5-28-4-42 5Z" fill="#ffdc66"/>
    <path d="M30 34c8-1 13 1 20 5m-20 9c8 0 13 2 20 5m20-14c7-4 12-6 20-5m-20 19c7-3 12-5 20-5" stroke="#b68b3b" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M78 13h10v28l-5-5-5 5Z" fill="#ff6475"/>`,
  chat: `<path d="M35 20c21-14 57-6 61 15 3 15-10 29-26 32l3 14-19-15c-28-3-41-30-19-46Z" fill="#8aba57"/>
    <path d="M16 51c14-20 48-24 69-5 19 20 5 45-22 48l-22 13 2-15C18 89 2 72 16 51Z" fill="#1baee0"/>
    <path d="M16 51c13-17 35-22 55-14-36-3-51 18-45 42-14-7-19-17-10-28Z" fill="#53c7e9"/>
    <g fill="#fffdf7"><circle cx="36" cy="65" r="5"/><circle cx="53" cy="65" r="5"/><circle cx="70" cy="65" r="5"/></g>${rays}`,
  clock: `<circle cx="60" cy="58" r="44" fill="#1baee0"/><path d="M30 87a44 44 0 0 1 62-62c-35-19-72 16-62 62Z" fill="#53c7e9"/>
    <circle cx="60" cy="58" r="33" fill="#fff0bd"/><path d="M60 35v24l17 10" stroke="#8b3ab5" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <g fill="#ffcf24"><rect x="49" y="3" width="22" height="9" rx="4"/><circle cx="60" cy="30" r="2.5"/><circle cx="87" cy="58" r="2.5"/><circle cx="33" cy="58" r="2.5"/><circle cx="60" cy="85" r="2.5"/></g>`,
  location: `<ellipse cx="60" cy="99" rx="27" ry="5" fill="#c4eeea"/>
    <path d="M60 101C42 83 24 60 25 39 25 20 40 8 60 8s35 12 35 31c1 21-17 44-35 62Z" fill="#ff646e"/>
    <path d="M60 8C39 8 25 20 25 39c-1 21 17 44 35 62-19-29-25-57-15-76 4-8 9-13 15-17Z" fill="#ff8e96"/>
    <circle cx="60" cy="39" r="13" fill="#fffdf7"/>${leftRays}`,
  phone: `<path d="M24 15c-8 8-5 25 5 42 10 18 28 34 46 38 11 3 19-1 25-9l-23-21-12 11c-9-5-21-17-26-27l11-11Z" fill="#1baee0"/>
    <path d="M24 15c-8 8-5 25 5 42 10 18 28 34 46 38-24-11-44-37-43-59Z" fill="#53c7e9"/>
    <path d="m24 15 11-5 20 23-5 5Z" fill="#ff6475"/><path d="m77 65 9-4 21 18-7 7Z" fill="#ff6475"/>
    <path d="M72 27c12 1 19 9 20 21m-19-8c5 0 7 3 7 8" stroke="#ffcf24" stroke-width="6" stroke-linecap="round" fill="none"/>`,
  mail: `<rect x="15" y="36" width="91" height="62" rx="10" fill="#1baee0"/>
    <path d="m18 39 37 29c3 3 8 3 12 0l36-29-42-27Z" fill="#53c7e9"/>
    <path d="M28 23h64v42L61 86 28 65Z" fill="#fff0bd"/><path d="M43 39h34M43 50h26" stroke="#d4b36b" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="m15 47 45 30 46-30v41c0 6-4 10-10 10H25c-6 0-10-4-10-10Z" fill="#1baee0"/>
    <path d="m15 88 29-23 16 12 17-12 29 23v1c0 6-4 9-10 9H25c-6 0-10-3-10-9Z" fill="#53c7e9"/>${leftRays}`,
  shield: `<path d="M60 8c13 9 25 12 38 14v29c0 23-18 40-38 53-20-13-38-30-38-53V22C35 20 47 17 60 8Z" fill="#75aa83"/>
    <path d="M60 8C47 17 35 20 22 22v29c0 23 18 40 38 53-18-23-24-42-22-66 9-3 15-7 22-12Z" fill="#9ac5a0"/>
    <path d="m41 54 13 13 26-29" stroke="#fffdf7" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>${rays}`,
  camera: `<rect x="12" y="31" width="97" height="65" rx="14" fill="#a768c0"/><path d="m32 31 8-15h35l8 15Z" fill="#8b3ab5"/>
    <path d="M12 47V45c0-9 5-14 14-14h69c9 0 14 5 14 14v2Z" fill="#bd8bd0"/>
    <circle cx="61" cy="64" r="25" fill="#fffdf7"/><circle cx="61" cy="64" r="19" fill="#1baee0"/><circle cx="61" cy="64" r="12" fill="#098cc9"/><circle cx="55" cy="58" r="5" fill="#92e1f0"/>
    <rect x="88" y="39" width="12" height="8" rx="3" fill="#ffcf24"/><path d="M21 21 16 8m9 10 5-11" stroke="#ffcf24" stroke-width="5" stroke-linecap="round" fill="none"/>`,
  document: `<path d="M31 12h48l17 18v68c0 5-3 8-8 8H31c-5 0-8-3-8-8V20c0-5 3-8 8-8Z" fill="#53c7e9"/>
    <path d="M36 8h42v24h19v61H36c-5 0-8-3-8-8V16c0-5 3-8 8-8Z" fill="#fff0bd"/><path d="m78 8 19 24H78Z" fill="#ffcf24"/>
    <path d="M42 47h39M42 59h29M42 71h21" stroke="#ad8abd" stroke-width="5" stroke-linecap="round" fill="none"/>
    <circle cx="87" cy="88" r="18" fill="#8aba57"/><path d="m79 88 6 6 11-13" stroke="#fffdf7" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>${leftRays}`,
  crown: `<path d="m17 33 25 17 18-35 18 35 25-17-11 60H28Z" fill="#ffcf24"/>
    <path d="m17 33 25 17 18-35v64H26Z" fill="#ffdf66"/><rect x="28" y="81" width="64" height="16" rx="5" fill="#ff9c32"/>
    <path d="m60 51 9 12-9 12-9-12Z" fill="#ff6475"/><g fill="#ffcf24"><circle cx="17" cy="30" r="6"/><circle cx="60" cy="12" r="6"/><circle cx="103" cy="30" r="6"/></g>`,
  flower: `<path d="M59 64v40" stroke="#559a88" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M60 95C37 95 29 81 31 72c17 1 27 9 29 23Z" fill="#8aba57"/><path d="M60 87c1-16 15-22 28-19-2 13-11 21-28 19Z" fill="#a4c76c"/>
    <path d="M44 21c-2-24 31-24 30 0 22-12 38 16 17 28 22 14 1 40-18 27-1 24-32 23-31 0-23 13-39-15-18-28C3 34 23 9 44 21Z" fill="#ff8e96"/>
    <path d="M44 21c-2-24 31-24 30 0-18-6-22 8-18 20-15-10-26-9-32 7C3 34 23 9 44 21Z" fill="#ffb1b7"/><circle cx="59" cy="47" r="16" fill="#ffcf24"/>`,
  music: `<path d="M45 23 99 9v65h-10V35L55 44v42H45Z" fill="#8b3ab5"/>
    <path d="M45 23 99 9v14L45 37Z" fill="#b477ce"/><ellipse cx="34" cy="88" rx="22" ry="15" transform="rotate(-18 34 88)" fill="#a768c0"/><ellipse cx="79" cy="77" rx="21" ry="15" transform="rotate(-18 79 77)" fill="#ff6475"/>
    <path d="m15 23 6-11m5 15 9-7" stroke="#ffcf24" stroke-width="5" stroke-linecap="round" fill="none"/>`,
  calendar: `<rect x="17" y="20" width="88" height="83" rx="12" fill="#ff6475"/><path d="M17 42h88v49c0 7-5 12-12 12H29c-7 0-12-5-12-12Z" fill="#fff0bd"/>
    <path d="M17 42h10v49c0 7 5 12 12 12H29c-7 0-12-5-12-12Z" fill="#ffdc66"/>
    <path d="M37 12v19m47-19v19" stroke="#1baee0" stroke-width="8" stroke-linecap="round" fill="none"/>
    <g fill="#ffb1b7"><rect x="34" y="53" width="12" height="11" rx="3"/><rect x="55" y="53" width="12" height="11" rx="3"/><rect x="76" y="53" width="12" height="11" rx="3"/><rect x="34" y="74" width="12" height="11" rx="3"/><rect x="76" y="74" width="12" height="11" rx="3"/></g>
    <rect x="53" y="72" width="16" height="16" rx="4" fill="#8aba57"/>`,
  plane: `<path d="m13 44 94-31-31 89-24-30-26 4 8-20Z" fill="#1baee0"/><path d="m13 44 94-31-55 59-18-16Z" fill="#8cdcea"/>
    <path d="m52 72 55-59-66 49-15 14Z" fill="#098cc9"/><path d="m52 72 24 30 31-89Z" fill="#53c7e9"/>
    <path d="M15 89c-7 9-3 17 8 15" stroke="#ff8e96" stroke-width="5" stroke-linecap="round" fill="none"/>${leftRays}`,
  morning: `<circle cx="48" cy="39" r="24" fill="#ffcf24"/><path d="M33 57a24 24 0 0 1 31-35c-21-6-36 11-31 35Z" fill="#ffdf66"/>
    <g stroke="#ffcf24" stroke-width="5" stroke-linecap="round" fill="none"><path d="M48 4v8M14 39H5M23 15l6 6M74 15l-6 6"/></g>
    <path d="M43 99H27c-22-2-24-30-4-36 1-25 37-35 53-12 27-3 41 33 18 45-11 5-32 3-51 3Z" fill="#53c7e9"/>
    <path d="M27 99c-22-2-24-30-4-36 1-25 37-35 53-12-31-11-53 7-49 48Z" fill="#9be3ee"/>`,
  evening: `<path d="M24 65a36 36 0 0 1 72 0Z" fill="#ff9c32"/><path d="M24 65a36 36 0 0 1 52-32c-24-6-41 9-42 32Z" fill="#ffca69"/>
    <g stroke="#ffcf24" stroke-width="5" stroke-linecap="round" fill="none"><path d="M60 10v9M22 24l7 7M98 24l-7 7M4 58h10M106 58h10"/></g>
    <path d="M18 73h85M29 86h61M41 99h37" stroke="#ff8e96" stroke-width="7" stroke-linecap="round" fill="none"/>`,
};

export const illustratedIconAliases: Record<string, string> = {
  pin: 'location',
  license: 'shield',
  day: 'sun',
};
