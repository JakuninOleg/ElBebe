// Static vector artwork extends the existing illustration family; original icons stay intact.
const glint = '<path d="m100 13 3-8m3 20 8-2" fill="none" stroke="#ffd148" stroke-width="4" stroke-linecap="round"/>';
const a = '<path d="m4 29 8-25h7l8 25h-7l-1-5h-9l-1 5Zm8-11h5l-2.5-9Z" fill="#fff" fill-rule="evenodd"/>';
const b = '<path d="M6 4h11c13 0 13 12 6 13 9 3 8 16-5 16H6Zm7 6v5h4c4 0 4-5 0-5Zm0 11v6h5c4 0 4-6 0-6Z" fill="#fff" fill-rule="evenodd"/>';
export const groupLessonIcons: Record<string, string> = {
  'lesson-speech': `<path d="M13 42c0-17 16-28 36-28s36 11 36 28-17 28-36 28H36L18 82l4-20c-6-5-9-12-9-20Z" fill="#1aaee1"/>
    <path d="M18 38c3-17 23-25 41-19-20-2-35 9-34 23 0 9 6 16 13 20l-15 9 1-12c-6-6-8-12-6-21Z" fill="#71d8ed"/>
    <path d="M54 69c0-13 12-22 27-22s27 9 27 22c0 9-6 16-13 19l4 15-17-12c-16 0-28-9-28-22Z" fill="#ff7286" stroke="#fffdf7" stroke-width="3"/>
    <g fill="#fff"><circle cx="33" cy="42" r="3.5"/><circle cx="49" cy="42" r="3.5"/><circle cx="65" cy="42" r="3.5"/><circle cx="70" cy="69" r="2.5"/><circle cx="81" cy="69" r="2.5"/><circle cx="92" cy="69" r="2.5"/></g>
    <path d="M24 28c4-4 9-6 15-7" fill="none" stroke="#d1f5ff" stroke-width="3" stroke-linecap="round"/>`,
  'lesson-english': `<g transform="rotate(-9 29 57)"><rect x="11" y="25" width="37" height="58" rx="8" fill="#e84d67"/><rect x="11" y="21" width="34" height="57" rx="8" fill="#ff7e91"/><g transform="translate(16 34) scale(.8)">${a}</g></g>
    <rect x="43" y="19" width="37" height="67" rx="8" fill="#128bc2"/><rect x="43" y="19" width="33" height="61" rx="8" fill="#38b9e9"/><g transform="translate(46 33) scale(.85)">${b}</g>
    <g transform="rotate(9 95 58)"><rect x="76" y="25" width="34" height="58" rx="8" fill="#4c9c65"/><rect x="76" y="22" width="31" height="56" rx="8" fill="#76bd83"/><path d="M98 39c-17-10-21 28-1 17" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/></g>
    <path d="M18 27h12M49 25h12M81 29h10" stroke="#fff" stroke-width="3" opacity=".55" stroke-linecap="round"/>`,
  'lesson-sensory': `<ellipse cx="60" cy="99" rx="41" ry="5" fill="#cfbddd" opacity=".35"/><rect x="55" y="19" width="10" height="67" rx="5" fill="#ddb37d"/>
    <rect x="17" y="81" width="86" height="17" rx="8.5" fill="#a382c0"/><path d="M24 84h62" stroke="#c3a9d9" stroke-width="4" stroke-linecap="round"/>
    <rect x="23" y="63" width="74" height="18" rx="9" fill="#22acd4"/><path d="M31 66h50" stroke="#73d9e9" stroke-width="4" stroke-linecap="round"/>
    <rect x="30" y="46" width="60" height="17" rx="8.5" fill="#7cbb75"/><path d="M38 49h36" stroke="#b4da92" stroke-width="4" stroke-linecap="round"/>
    <rect x="37" y="31" width="46" height="15" rx="7.5" fill="#ffb340"/>
    <circle cx="60" cy="19" r="12" fill="#ffd657"/><path d="M54 13c3-3 6-4 9-2" fill="none" stroke="#fff0a2" stroke-width="4" stroke-linecap="round"/>`,
  'lesson-alphabet': `<rect x="12" y="57" width="43" height="42" rx="7" fill="#4fae78"/><path d="M18 61h24" stroke="#a6ddb0" stroke-width="4" stroke-linecap="round"/>
    <rect x="62" y="57" width="43" height="42" rx="7" fill="#23aee0"/><path d="M69 61h23" stroke="#82d8ef" stroke-width="4" stroke-linecap="round"/>
    <rect x="38" y="9" width="43" height="43" rx="7" fill="#ffbd3f"/><path d="M44 13h24" stroke="#ffe5a0" stroke-width="4" stroke-linecap="round"/>
    <g transform="translate(45 18) scale(.7)">${a}</g><g transform="translate(20 63) scale(.78)">${b}</g>
    <path d="M75 68h13l-5 10c14-3 13 15 0 13h-8" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  'lesson-fitness': `<g transform="rotate(-25 60 55)"><rect x="25" y="47" width="70" height="17" rx="7" fill="#ffcf45"/><path d="M33 49h54" stroke="#ffec9c" stroke-width="4" stroke-linecap="round"/>
    <rect x="11" y="29" width="23" height="52" rx="7" fill="#199fca"/><rect x="11" y="29" width="15" height="49" rx="6" fill="#4bc5e7"/>
    <rect x="86" y="29" width="23" height="52" rx="7" fill="#59a678"/><rect x="86" y="29" width="15" height="49" rx="6" fill="#8ac48c"/>
    <path d="M16 36v19m76-19v19" stroke="#fff" stroke-width="3" opacity=".55" stroke-linecap="round"/></g>`,
  'lesson-exploration': `<ellipse cx="60" cy="93" rx="48" ry="12" fill="#ffe2a0"/><ellipse cx="60" cy="98" rx="36" ry="7" fill="#f5c56a"/>
    <path d="M60 90c-3-21-2-43 5-63" stroke="#509b80" stroke-width="6" stroke-linecap="round" fill="none"/>
    <path d="M59 66C30 68 16 48 20 30c26-2 42 13 39 36Z" fill="#79ba79"/><path d="M61 49C56 24 79 11 99 16c1 22-14 37-38 33Z" fill="#91c77d"/>
    <path d="m29 39 25 23m13-20 24-19" stroke="#4f9c71" stroke-width="3" stroke-linecap="round"/><g fill="#d7a74e"><circle cx="34" cy="91" r="2"/><circle cx="81" cy="94" r="2.5"/><circle cx="69" cy="100" r="1.6"/></g>`,
  'lesson-dance': `<circle cx="64" cy="18" r="12" fill="#ff91a5"/>
    <path d="M56 35c-14 3-24-4-31-14l-7 6c11 17 24 25 39 22l-8 19 21 9 6-29c14-6 23-16 27-29l-9-4c-5 12-13 19-26 22Z" fill="#f8658c"/>
    <path d="M49 61c-8 7-17 12-26 13l25 13 17-7 21 3c-9-8-12-16-14-24Z" fill="#ff91b0"/>
    <path d="M51 82 35 99m31-18 12 21" stroke="#eb517d" stroke-width="8" stroke-linecap="round"/>
    <path d="M22 43c-9-6-11-13-10-20M90 73c8-6 11-12 13-20" fill="none" stroke="#ffd148" stroke-width="4" stroke-linecap="round"/>`,
  'lesson-chef': `<path d="M30 63c-28-8-19-45 3-44 8-19 35-19 45-1 26-3 39 32 11 45L85 97H35Z" fill="#fffdf7" stroke="#9eb8c8" stroke-width="3" stroke-linejoin="round"/>
    <path d="M29 58c-13-7-15-24-5-33-15 2-19 30 6 38l5 34h8l-7-36Z" fill="#dcebf0"/>
    <path d="M37 79h46v18H37Z" fill="#dcebf0"/><path d="M46 74 42 56m19 18V53m14 21 5-20" stroke="#a9c0cb" stroke-width="3" stroke-linecap="round"/>
    <path d="M38 92h42" stroke="#a9c0cb" stroke-width="3" stroke-linecap="round"/>${glint}`,
  'lesson-support': `<path d="M11 81c0-17 10-28 24-28s24 11 24 28v19H11Z" fill="#22b4dc"/><circle cx="35" cy="39" r="15" fill="#7cd9ed"/>
    <path d="M65 81c0-17 9-28 23-28s24 11 24 28v19H65Z" fill="#f66c92"/><circle cx="88" cy="39" r="15" fill="#ffa1b4"/>
    <path d="M48 18c0-9 12-13 17-3 7-10 19-5 18 4-1 10-15 19-18 21-4-3-17-13-17-22Z" fill="#ff788e"/>
    <path d="M19 82c1-11 5-17 11-19m43 19c1-11 5-17 11-19" fill="none" stroke="#fff" opacity=".45" stroke-width="3" stroke-linecap="round"/>`,
  'lesson-robot': `<path d="M60 20V9" stroke="#169fc9" stroke-width="5" stroke-linecap="round"/><circle cx="60" cy="9" r="6" fill="#ffcf45"/>
    <rect x="20" y="22" width="80" height="49" rx="15" fill="#28add7"/><rect x="26" y="25" width="68" height="40" rx="11" fill="#fffdf7"/>
    <circle cx="43" cy="44" r="10" fill="#50c5e8"/><circle cx="77" cy="44" r="10" fill="#50c5e8"/><circle cx="43" cy="44" r="5" fill="#3c4770"/><circle cx="77" cy="44" r="5" fill="#3c4770"/>
    <circle cx="40" cy="41" r="2.5" fill="#fff"/><circle cx="74" cy="41" r="2.5" fill="#fff"/><path d="M53 58h14" stroke="#71c5b7" stroke-width="3" stroke-linecap="round"/>
    <rect x="39" y="73" width="42" height="26" rx="7" fill="#76bd83"/><rect x="49" y="77" width="22" height="12" rx="3" fill="#fff0be"/>
    <path d="M35 78 22 85m63-7 13 7" stroke="#22abd6" stroke-width="8" stroke-linecap="round"/><circle cx="19" cy="87" r="7" fill="#ffcf45"/><circle cx="101" cy="87" r="7" fill="#ffcf45"/>
    <path d="M48 101v5m24-5v5" stroke="#1594bc" stroke-width="9" stroke-linecap="round"/>`,
  'lesson-chess': `<path d="M34 83c-1-18 7-29 22-41l-9-3-14 11-13-8 19-22 6-15 14 10c23 3 34 16 33 38l-5 30Z" fill="#ffcd45" stroke="#e4a220" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M59 15c18 11 17 26 6 39-9 12-12 18-12 29H34c-1-18 7-29 22-41l-9-3-14 11-13-8 19-22 6-15Z" fill="#ffe080"/>
    <circle cx="45" cy="29" r="3" fill="#8e6232"/><path d="m78 33 2 15m-41 27c2-8 7-13 12-18" stroke="#fff0b1" stroke-width="3" stroke-linecap="round" fill="none"/>
    <rect x="27" y="82" width="68" height="12" rx="5" fill="#edaf2a"/><rect x="22" y="96" width="78" height="10" rx="4" fill="#ffc83e"/>`,
  'lesson-finance': `<path d="M17 35c0-8 5-13 13-13h59v24H17Z" fill="#8c633f"/><path d="m29 25 39-10 6 24-46 7Z" fill="#93cba3"/>
    <rect x="13" y="35" width="85" height="62" rx="11" fill="#c58c51"/><path d="M20 39h64v51H23c-4 0-6-2-6-6V46c0-4 1-6 3-7Z" fill="#e0ac6e"/>
    <path d="M77 53h24v28H77c-8 0-11-6-11-14s3-14 11-14Z" fill="#a97442"/><circle cx="81" cy="67" r="4" fill="#ffe3a2"/>
    <circle cx="90" cy="24" r="15" fill="#ffce49" stroke="#e4ac31" stroke-width="2"/><circle cx="90" cy="24" r="10" fill="none" stroke="#ffe9a2" stroke-width="2"/>
    <circle cx="101" cy="96" r="12" fill="#ffd553" stroke="#e4ac31" stroke-width="2"/><circle cx="101" cy="96" r="7" fill="none" stroke="#fff0b1" stroke-width="2"/>
    <path d="M23 45h31" stroke="#f7ce99" stroke-width="3" stroke-linecap="round"/>`,
};
