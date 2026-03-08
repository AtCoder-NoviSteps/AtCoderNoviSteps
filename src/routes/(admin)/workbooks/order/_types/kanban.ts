// Card data used in the Kanban board (one card = one WorkBookPlacement)
export type CardData = {
  id: number; // placement.id
  workBookId: number;
  title: string;
  isPublished: boolean;
  solutionCategory: string | null;
  taskGrade: string | null;
  priority: number;
};
