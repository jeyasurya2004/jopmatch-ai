import axios from 'axios';

// Define the structure for a single search result
interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export class SearchAgent {
  private searchApiUrl: string;

  constructor(searchApiUrl: string) {
    this.searchApiUrl = searchApiUrl.endsWith('/') ? searchApiUrl : `${searchApiUrl}/`;
  }

  async search(query: string, maxResults: number = 5): Promise<SearchResult[]> {
    try {
      console.log(`SearchAgent: Searching for: "${query}"`);
      
      const apiUrl = `${this.searchApiUrl}search?q=${encodeURIComponent(query)}&format=json&categories=general`;

      const response = await axios.get(apiUrl, { timeout: 5000 });

      if (response.data && Array.isArray(response.data.results)) {
        const searchResults: SearchResult[] = response.data.results
          .filter((result: any) => result.title && result.url && result.content)
          .slice(0, maxResults)
          .map((result: any) => ({
            title: result.title,
            url: result.url,
            snippet: result.content,
          }));
        
        console.log(`SearchAgent: Found ${searchResults.length} results.`);
        return searchResults;
      }
      return [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`SearchAgent: Axios error performing search for "${query}": ${error.message}`);
      } else {
        console.error(`SearchAgent: Generic error performing search for "${query}":`, error);
      }
      return [];
    }
  }
}

// Trying another public SearXNG instance
const searxngApiUrl = import.meta.env.VITE_SEARXNG_API_URL || 'https://search.rhscz.eu';

if (!searxngApiUrl) {
  console.error("VITE_SEARXNG_API_URL is not defined and no fallback is provided.");
  // You might want to throw an error here in a real application
}

export const searchAgent = new SearchAgent(searxngApiUrl || '');
