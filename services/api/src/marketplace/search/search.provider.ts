export interface SearchQueryParams {
  query?: string;
  category?: string;
  tags?: string[];
  badges?: string[];
  visibility?: string;
  limit?: number;
  offset?: number;
}

export interface SearchProvider {
  search(params: SearchQueryParams): Promise<any[]>;
}
