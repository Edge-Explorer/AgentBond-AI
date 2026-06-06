import logging
from typing import Dict, Any, List, Optional
from app.services.llm import LLMService
from app.models.schemas import CaseContext

logger= logging.getLogger(__name__)

class BaseAgent:
    """
    A lightweight, custom Agent Harness base class built from scratch.
    It encapsulates LLM interaction, system prompts, and structured output formatting.
    """
    def __init__(self, name: str, system_prompt: str, model_name: Optional[str] = None):
        self.name= name
        self.system_prompt= system_prompt
        self.model_name= model_name
        
    def run_llm_json(self, prompt: str, temperature: float= 0.2) -> Dict[str, Any]:
        """
        Executes an LLM request expecting a JSON object in response.
        """
        logger.info(f"Agent [{self.name}] executing JSON query on model [{self.model_name}]")
        return LLMService.call_gemini_json(
            prompt= prompt,
            system_instruction= self.system_prompt,
            model_name= self.model_name,
            temperature= temperature
        )
    
    def execute(self, context: CaseContext, **kwargs) -> Any:
        """
        To be implemented by specific agents. Takes the shared case context
        and returns a structured update or patch.
        """
        raise NotImplementedError("Each agent must implement its own execute method.")

class CaseManagerAgent(BaseAgent):
    """
    The Case Manager Agent decomposes the initial problem statement from the user
    into a structured list of hypotheses for investigator agents to research.
    """
    def __init__(self, model_name: Optional[str] = None):
        system_prompt= (
            "You are a Case Manager Agent, the head detective of a multi-agent investigation system.\n"
            "Your job is to read a problem statement and break it down logically into a list of testable hypotheses.\n"
            "Each hypothesis must be specific, actionable, and something an investigator can verify or disprove.\n"
            "You must respond ONLY with a JSON object matching this schema:\n"
            "{\n"
            "  \"hypotheses\": [\n"
            "    {\n"
            "      \"statement\": \"A testable hypothesis statement\",\n"
            "      \"status\": \"pending\"\n"
            "    }\n"
            "  ]\n"
            "}\n"
            "Do not include any chat preamble, markdown blocks (other than JSON), or explanations outside of the JSON."
        )
        super().__init__(name= "CaseManagerAgent", system_prompt= system_prompt, model_name= model_name)
    
    def execute(self, context: CaseContext, **kwargs) -> List[Dict[str, Any]]:
        """
        Decomposes the case problem statement into hypotheses.
        Returns a list of dictionary representations of Hypothesis.
        """
        prompt= (
            f"Problem Statement: {context.problem_statement}\n"
            f"Known Constraints: {', '.join(context.constraints) if context.constraints else 'None'}\n\n"
            "Generate at least 3 distinct, high-impact hypothesis that explain the problem statement."
        )
        try:
            result= self.run_llm_json(prompt, temperature= 0.3)
            hypotheses= result.get("hypotheses", [])
            
            # Basic validation
            validated_hypotheses= []
            for h in hypotheses:
                if "statement" in h:
                    validated_hypotheses.append({
                        "statement": h["statement"],
                        "status": "pending",
                        "assigned_investigator": None
                    })
            if not validated_hypotheses:
                raise ValueError("No Valid hypotheses statements returned by LLM.")
            return validated_hypotheses
        
        except Exception as e:
            logger.error(f"Error in CaseManagerAgent execution: {e}")
            raise