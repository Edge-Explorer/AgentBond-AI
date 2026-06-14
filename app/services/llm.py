import os
import json
from typing import Dict, Any, Optional
import google.generativeai as genai
from dotenv import load_dotenv
from app.observability.metrics import LLM_TOKENS

load_dotenv()

# Load and validate key
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY environment variable is missing from .env")

# Configure Google GenAI
genai.configure(api_key=api_key)

# Load configured model name (default to gemini-2.5-flash)
DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

class LLMService:
    @staticmethod
    def call_gemini(
        prompt: str,
        system_instruction: Optional[str] = None,
        model_name: Optional[str] = None,
        temperature: float = 0.2,
        json_output: bool = False
    ) -> str:
        """
        Invokes Gemini LLM model and returns the text response.
        If json_output is True, configures the request to return application/json.
        """
        # Fallback to default model if none specified
        active_model = model_name or DEFAULT_MODEL
        
        # Define generation config
        generation_config = {
            "temperature": temperature,
        }
        
        if json_output:
            generation_config["response_mime_type"] = "application/json"

        # Initialize the model
        model = genai.GenerativeModel(
            model_name=active_model,
            generation_config=generation_config,
            system_instruction=system_instruction
        )

        # Generate response
        response = model.generate_content(prompt)
        
        if not response.text:
            raise RuntimeError("Gemini model returned an empty response.")
        
        try:
            usage = response.usage_metadata
            if usage:
                # Track Input Tokens (Prompt)
                LLM_TOKENS.labels(
                    model_name=active_model,
                    token_type="input"
                ).inc(usage.prompt_token_count)
                
                # Track Output Tokens (Response)
                LLM_TOKENS.labels(
                    model_name=active_model,
                    token_type="output"
                ).inc(usage.candidates_token_count)
        except Exception as e:
            # Prevent token tracking errors from breaking the core execution
            pass
            
        return response.text

    @staticmethod
    def call_gemini_json(
        prompt: str,
        system_instruction: Optional[str] = None,
        model_name: Optional[str] = None,
        temperature: float = 0.2
    ) -> Dict[str, Any]:
        """
        Calls Gemini forcing a JSON structure and parses the result into a python dictionary.
        """
        raw_response = LLMService.call_gemini(
            prompt=prompt,
            system_instruction=system_instruction,
            model_name=model_name,
            temperature=temperature,
            json_output=True
        )
        
        try:
            res = json.loads(raw_response)
            if not isinstance(res, dict):
                raise ValueError(f"Expected JSON dictionary from Gemini, got {type(res).__name__}")
            return res
        except (json.JSONDecodeError, ValueError) as e:
            # Simple fallback if JSON parsing fails
            clean_str = raw_response.strip()
            if clean_str.startswith("```json"):
                clean_str = clean_str.split("```json")[1].split("```")[0].strip()
            elif clean_str.startswith("```"):
                clean_str = clean_str.split("```")[1].split("```")[0].strip()
            try:
                res2 = json.loads(clean_str)
                if not isinstance(res2, dict):
                    raise ValueError(f"Expected JSON dictionary from Gemini on fallback, got {type(res2).__name__}")
                return res2
            except Exception:
                raise ValueError(f"Failed to parse JSON response from Gemini. Raw output: {raw_response}") from e