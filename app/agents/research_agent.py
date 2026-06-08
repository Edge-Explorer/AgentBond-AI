import logging
from typing import Dict, Any, Optional
from app.agents.case_manager import BaseAgent
from app.tools.search_tool import search_web
from app.models.schemas import CaseContext

logger= logging.getLogger(__name__)

class ResearchAgent(BaseAgent):
    """
    The Research Agent takes a specific hypothesis, formulates a web search query,
    gathers data using the DuckDuckGo search tool, and synthesizes a structured verdict.
    """
    def __init__(self, model_name: Optional[str]= None):
        system_prompt = (
            "You are a Research Agent tasked with investigating a specific hypothesis.\n"
            "Your goal is to search the web, gather evidence, and draw a logical conclusion.\n"
            "You must respond ONLY with a JSON object matching this schema:\n"
            "{\n"
            "  \"search_query\": \"The query to search on DuckDuckGo (e.g. NVDA stock performance Q1 2026)\"\n"
            "}\n"
            "Do not include any preamble, markdown code blocks, or text outside the JSON."
        )
        super().__init__(name= "ResearchAgent", system_prompt= system_prompt, model_name= model_name)
    
    def execute_research(self, hypothesis: str, context: CaseContext) -> Dict[str, Any]:
        """
        Runs a multi-step research loop:
        1. Formulates search query.
        2. Fetches web data using search_web tool.
        3. Synthesizes final JSON verdict.
        """
        logger.info(f"ResearchAgent starting investigation for hypothesis: '{hypothesis}'")
        
        # Step 1: Formulate search query
        prompt_query = (
            f"Case Problem: {context.problem_statement}\n"
            f"Hypothesis to investigate: '{hypothesis}'\n\n"
            "Generate a single focused web search query to retrieve real-time facts/data from the web."
        )
        try:
            query_res= self.run_llm_json(prompt_query, temperature= 0.2)
            search_query= query_res.get("search_query", hypothesis)
        except Exception as e:
            logger.warning(f"Failed to generate search query, falling back to hypothesis. Error: {e}")
            search_query= hypothesis
            
        # Step 2: Fetch web results
        logger.info(f"ResearchAgent searching the web for: '{search_query}'")
        web_results= search_web(search_query, max_results= 5)
        
        # Step 3: Synthesize final verdict
        synthesis_prompt = (
            "You are a Synthesis Specialist.\n"
            "Your job is to read web search results and formulate a final verdict on the hypothesis.\n"
            "You must respond ONLY with a JSON object matching this schema:\n"
            "{\n"
            "  \"supporting_evidence\": [\"Specific facts/data supporting the hypothesis\"],\n"
            "  \"contrary_evidence\": [\"Specific facts/data contradicting the hypothesis\"],\n"
            "  \"conclusion\": \"Detailed summary of your findings and analysis\",\n"
            "  \"status\": \"verified\"  // Must be 'verified', 'disproved', or 'inconclusive'\n"
            "}\n"
            "Do not include any preamble, markdown code blocks, or text outside the JSON."
        )
        
        final_prompt = (
            f"Hypothesis: '{hypothesis}'\n"
            f"Web Search Query: '{search_query}'\n"
            f"Web Search Results:\n{web_results}\n\n"
            "Evaluate the hypothesis using the search results and output the final JSON verdict."
        )
        # Temporarily override the system prompt for synthesis
        original_prompt= self.system_prompt
        self.system_prompt= synthesis_prompt
        try:
            verdict= self.run_llm_json(final_prompt, temperature= 0.3)
            # Basic validation/enrichment
            verdict["search_query"]= search_query
            if verdict.get("status") not in ["verified", "disproved", "inconclusive"]:
                verdict["status"]= "inconclusive"
            return verdict
        finally:
            self.system_prompt= original_prompt