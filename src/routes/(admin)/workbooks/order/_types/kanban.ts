// Card data used in the Kanban board (one card = one WorkBookPlacement)
// Column assignment is implicit in the Record key, not stored on the card.
export type Card = {
  id: number; // placement.id
  workBookId: number;
  title: string;
  isPublished: boolean;
};

export type Cards = Card[];

export type KanbanColumns = Record<string, Cards>;
