export function landmarkSvg(kind: string, color = "#d6e7d1") {
  const base =
    '<ellipse cx="80" cy="111" rx="68" ry="15" fill="#476858" opacity=".1"/>';
  const shapes: Record<string, string> = {
    opera:
      '<path d="m13 94 78-38 58 40-78 25Z" fill="#f8faf0" stroke="#9baea5" stroke-width="2"/><path d="m13 94 78-38-8 20-40 25Z" fill="#d5e2df"/><path d="m43 101 40-25 34 24-46 21Z" fill="#fffdf4"/><path d="m77 75 5-40 35 13v51Z" fill="#a9c1c2"/><path d="m82 35 35 13-16 11-24-9Z" fill="#eff5e8"/><path d="m87 56 22 10m-24 1 23 10m-24 0 24 10" stroke="#e9eee9" stroke-width="3"/>',
    art: '<path d="m37 54 46-19 36 17v58l-45 14-37-18Z" fill="#d6bfa4"/><path d="m83 35 36 17-45 19-37-17Z" fill="#f8e8cd"/><path d="M74 71v53l45-14V52Z" fill="#b6a793"/><path d="m85 43 9-22 24 8-8 23Z" fill="#b7c9c4"/><path d="m52 68 14 6v28l-14-5Zm31 13 9-3v26l-9 3Zm18-7 9-3v26l-9 3Z" fill="#6a8b8b"/>',
    tree: '<path d="M43 73v39m65-50v47M79 63v50" stroke="#a38561" stroke-width="7"/><path d="m17 82 27-54 28 54Z" fill="#77a778"/><path d="m81 75 27-55 28 55Z" fill="#609c73"/><path d="m48 75 31-62 32 62Z" fill="#96bd7c"/><path d="m44 98 35-21 30 20-35 20Z" fill="#e2d4a6"/>',
    castle:
      '<path d="m30 63 47-23 49 24v49l-46 14-50-20Z" fill="#c8bca3"/><path d="m77 40 49 24-46 20-50-21Z" fill="#ded5bc"/><path d="M80 84v43l46-14V64Z" fill="#adac92"/><path d="M39 72V43h12v9h10v-9h12v37m22-3V48h11v9h10v-9h12v24" fill="#d6ccb4"/><path d="M58 111V91q9-13 18 0v28" fill="#6a8c80"/><path d="M50 44V23m0 0 20 6-20 7" stroke="#a28062" stroke-width="3" fill="#e7a17e"/>',
    houses:
      '<path d="M16 77 37 49l22 28v37H16Z" fill="#d88d76"/><path d="m46 72 23-33 24 33v47H46Z" fill="#e7b65b"/><path d="m84 69 23-30 23 30v43H84Z" fill="#db806c"/><path d="m115 80 17-23 17 23v27h-34Z" fill="#e9d7b1"/><path d="m12 78 25-34 25 34m-19-5 26-38 28 38m-17-2 27-37 27 37" fill="none" stroke="#785b54" stroke-width="5"/><path d="M28 85h9v12h-9Zm33-5h11v14H61Zm39-4h11v15h-11ZM70 104h10v16H70Z" fill="#fff0d0"/>',
    mountain:
      '<path d="m12 111 48-77 28 39 20-25 43 63Z" fill="#8fac83"/><path d="m12 111 48-77 9 27-16 15-2 24Z" fill="#b7cb9e"/><path d="m45 58 15-24 19 27-13-6-7 8-6-9Z" fill="#fbfbec"/><path d="m91 70 17-22 17 24-18-6Z" fill="#e6edd8"/><path d="m48 111 36-19 28 19" fill="#d8d0a4"/><path d="M105 35V16m-7 6 7-8 8 8" stroke="#a69c7d" stroke-width="3"/>',
    harbor:
      '<path d="M15 95q15-10 30 0t30 0 30 0 30 0v16H15Z" fill="#90c7d1"/><path d="m43 79 15 26h49l20-26Z" fill="#e7c08b"/><path d="M77 77V20l-30 52h30Zm6-49 29 43H83Z" fill="#fff9e7"/><path d="M79 20v66" stroke="#a78f6f" stroke-width="3"/>',
    ship: '<path d="m27 85 20 27h66l24-27Z" fill="#a9825a"/><path d="M48 59h65v28H48Z" fill="#eddfbb"/><path d="M76 20v65" stroke="#8f795b" stroke-width="5"/><path d="m79 25 36 41H79Zm-7 0L39 66h33Z" fill="#fff5d5"/><path d="M15 118q15-10 30 0t30 0 30 0 30 0" stroke="#9cccd3" stroke-width="5" fill="none"/>',
    book: '<path d="m24 62 55-26 55 27v42l-55 23-55-26Z" fill="#b2c6be"/><path d="m24 62 55-26 55 27-55 25Z" fill="#f4efda"/><path d="m32 69 47 23 47-22v10L79 103 32 80Zm0 18 47 23 47-22v10l-47 23-47-23Z" fill="#edf2df"/>',
    cafe: '<path d="M33 58h71v40q-35 29-71 0Z" fill="#f4ddbb"/><path d="M104 67h13q23 3 7 25l-20 4" fill="none" stroke="#c4a584" stroke-width="8"/><ellipse cx="69" cy="58" rx="36" ry="12" fill="#9a785b"/><path d="M53 37q-9-9 0-20m20 20q-9-9 0-20m20 20q-9-9 0-20" fill="none" stroke="#fffdf1" stroke-width="5" stroke-linecap="round"/>',
    fish: '<path d="M26 81q47-53 88 0-41 53-88 0Zm88 0 25-23v46Z" fill="#df9a84"/><path d="M69 62q-15 18 0 38" stroke="#f8d9b9" stroke-width="4" fill="none"/><circle cx="45" cy="77" r="4" fill="#4f665d"/><path d="m71 51 16-13 10 21" fill="#c9b88c"/>',
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 140" aria-hidden="true"><circle cx="80" cy="74" r="57" fill="${color}" opacity=".25"/>${base}${shapes[kind] ?? shapes.houses}</svg>`;
}
export function Landmark({
  kind,
  color,
  className = "",
}: {
  kind: string;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={"landmark " + className}
      dangerouslySetInnerHTML={{ __html: landmarkSvg(kind, color) }}
    />
  );
}
