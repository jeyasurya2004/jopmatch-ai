import axios from 'axios';

// Define the structure for a single search result
interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export class SearchAgent {
  // searchApiUrl is no longer needed as the proxy handles routing

  constructor() {
    // Constructor is empty as searchApiUrl is removed
  }

  async search(query: string, maxResults: number = 10, type?: string): Promise<SearchResult[]> {
    try {
      console.log(`SearchAgent: Searching for: "${query}"${type ? ` with type: "${type}"` : ''}`);
      
      // Construct the URL to the backend proxy, which now handles Algolia searches
      // Use a relative path so that the Vite proxy can intercept it.
      let apiUrl = `/search-proxy?q=${encodeURIComponent(query)}`;

      if (type) {
        apiUrl += `&type=${encodeURIComponent(type)}`;
      }

      const response = await axios.get(apiUrl, { timeout: 5000 });

      if (response.data && Array.isArray(response.data.results)) {
        const searchResults: SearchResult[] = response.data.results
          .slice(0, maxResults); // The backend proxy already filters and formats results
        
        console.log(`SearchAgent: Found ${searchResults.length} results.`);
        return searchResults;
      }
      return [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`SearchAgent: Axios error performing search for "${query}": ${error.message}`);
        if (error.response) {
          console.error('SearchAgent: API responded with status:', error.response.status);
          console.error('SearchAgent: API response data:', error.response.data);
        }
      } else {
        console.error(`SearchAgent: Generic error performing search for "${query}":`, error);
      }
      return [];
    }
  }
}

// The search agent no longer needs the full backend proxy URL, as Vite handles the proxying.
// It will now use a relative path that Vite's proxy will intercept.
export const searchAgent = new SearchAgent();
