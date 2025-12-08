declare module 'turndown-plugin-gfm' {
  import TurndownService from 'turndown';
  export function tables(turndownService: TurndownService): void;
  export function strikethrough(turndownService: TurndownService): void;
  export function taskListItems(turndownService: TurndownService): void;
  export const gfm: (turndownService: TurndownService) => void;
}
