import logging
from duckduckgo_search import DDGS   # type: ignore

logger= logging.getLogger(__name__)

def search_web(query: str, max_results: int=5) -> str:
    """
    Search the web using DuckDuckGo and return a formatted string of results.
    Useful for looking up real-time information, recent news, or technical questions.
    """
    logger.info(f"Executing web search for query: '{query}'")
    try:
        with DDGS() as ddgs:
            results= list(ddgs.text(query, max_results= max_results))
            if not results:
                return f"No search results found for query: '{query}'"
            
            formatted_results=[]
            for i, r in enumerate(results, 1):
                title= r.get("title", "No Title")
                href= r.get("href", "No Link")
                body= r.get("body", "No Description")
                formatted_results.append(
                    f"[{i}] {title}\n"
                    f"URL: {href}\n"
                    f"Snippet: {body}\n"
                )
            return "\n".join(formatted_results)
    except Exception as e:
        logger.error(f"Error executing web search: {str(e)}")
        return f"Failed to execute search due to error: {str(e)}"

if __name__ == "__main__":
    print(search_web("Nvidia stock news", max_results= 2))