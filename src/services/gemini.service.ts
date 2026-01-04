/**
 * Service for interacting with Gemini API for role suggestions
 */
class GeminiService {
  /**
   * Get backend URL for API calls
   */
  private getApiUrl(): string {
    if (typeof window !== 'undefined') {
      return '/api/gemini/suggest-role';
    }
    return process.env.NEXT_PUBLIC_API_URL 
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/gemini/suggest-role`
      : 'http://localhost:3000/api/gemini/suggest-role';
  }

  /**
   * Suggest a role based on the "about" field content
   * @param about - The profile "about" text
   * @returns The suggested role string, or null if suggestion fails
   */
  async suggestRole(about: string): Promise<string | null> {
    if (!about || about.trim().length === 0) {
      return null;
    }

    try {
      const response = await fetch(this.getApiUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ about }),
      });

      if (!response.ok) {
        console.error('Failed to get role suggestion:', response.status);
        return null;
      }

      const data = await response.json();
      return data.role || null;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return null;
    }
  }
}

// Export singleton instance
export const geminiService = new GeminiService();

