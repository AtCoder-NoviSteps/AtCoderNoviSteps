export interface UrlGenerator {
  canHandle(contestId: string): boolean;
  generateUrl(contestId: string, taskId: string): string;
}

export type UrlGenerators = UrlGenerator[];
