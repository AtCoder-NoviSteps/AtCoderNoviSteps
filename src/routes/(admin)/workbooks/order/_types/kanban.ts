// Card data used in the Kanban board (one card = one WorkBookPlacement)
// Column assignment is implicit in the Record key, not stored on the card.
export type CardData = {
  id: number; // placement.id
  workBookId: number;
  title: string;
  isPublished: boolean;
};
