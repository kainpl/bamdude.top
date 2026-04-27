// Brand SVG paths sourced from `simple-icons`. We import named exports from
// the main entrypoint so tree-shaking can drop unused icons.
import {
  siPython,
  siFastapi,
  siReact,
  siTypescript,
  siTailwindcss,
  siSqlite,
  siPostgresql,
  siThreedotjs,
  siMqtt,
  siTelegram,
} from 'simple-icons';

export interface TechIcon {
  /** SVG path data; viewBox is always `0 0 24 24`. */
  path: string;
  /** Brand hex without leading `#`. May be too dark on dark theme — use `displayHex` for that. */
  hex: string;
  /** Override applied when the brand color would be invisible on dark theme. */
  displayHex?: string;
}

export const techIcons: Record<string, TechIcon> = {
  python: { path: siPython.path, hex: siPython.hex },
  fastapi: { path: siFastapi.path, hex: siFastapi.hex },
  react: { path: siReact.path, hex: siReact.hex },
  typescript: { path: siTypescript.path, hex: siTypescript.hex },
  tailwindcss: { path: siTailwindcss.path, hex: siTailwindcss.hex },
  // Combined DB badge — SQLite official navy is too dark on dark theme, so we
  // borrow PostgreSQL's royal blue which works for both.
  database: { path: siSqlite.path, hex: siSqlite.hex, displayHex: siPostgresql.hex },
  threedotjs: { path: siThreedotjs.path, hex: siThreedotjs.hex, displayHex: 'A0A0A0' },
  mqtt: { path: siMqtt.path, hex: siMqtt.hex, displayHex: 'C266C2' },
  telegram: { path: siTelegram.path, hex: siTelegram.hex },
};
