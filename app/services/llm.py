import os
import json
import logging
import urllib.request
from typing import Dict, Any, Optional
from dotenv import load_dotenv
from app.observability.metrics import LLM_TOKENS

load_dotenv()

# Load and validate key (using the GEMINI_API_KEY env variable to hold the OpenRouter key)
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY environment variable is missing from .env")

# Load configured OpenRouter model (default to google/gemini-2.5-flash)
DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "google/gemini-2.5-flash")

logger = logging.getLogger(__name__)

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
        Invokes Gemini model via OpenRouter API and returns the text response.
        If json_output is True, configures the request to return a JSON object.
        """
        active_model = model_name or DEFAULT_MODEL
        logger.info(f"LLM Service calling OpenRouter model: {active_model}")
        
        # Build OpenRouter messages format
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": active_model,
            "messages": messages,
            "temperature": temperature
        }
        
        if json_output:
            payload["response_format"] = {"type": "json_object"}
            
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/google/antigravity",  # Required by OpenRouter
            "X-Title": "AgentBond AI"
        }
        
        # Use python's built-in urllib to execute the HTTP POST request (no packages needed!)
        req = urllib.request.Request(
            "https://openrouter.ai/api/v1/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                
                choices = res_data.get("choices", [])
                if not choices:
                    raise RuntimeError(f"OpenRouter response contained no choices: {res_data}")
                
                text_content = choices[0].get("message", {}).get("content", "")
                if not text_content:
                    raise RuntimeError("OpenRouter model returned an empty response.")
                
                # Track token usage in Prometheus
                usage = res_data.get("usage", {})
                if usage:
                    prompt_tokens = usage.get("prompt_tokens", 0)
                    completion_tokens = usage.get("completion_tokens", 0)
                    
                    LLM_TOKENS.labels(
                        model_name=active_model,
                        token_type="input"
                    ).inc(prompt_tokens)
                    
                    LLM_TOKENS.labels(
                        model_name=active_model,
                        token_type="output"
                    ).inc(completion_tokens)
                    
                return text_content
                
        except Exception as e:
            logger.error(f"Error calling OpenRouter API: {str(e)}")
            raise

    @staticmethod
    def call_gemini_json(
        prompt: str,
        system_instruction: Optional[str] = None,
        model_name: Optional[str] = None,
        temperature: float = 0.2
    ) -> Dict[str, Any]:
        """
        Calls OpenRouter forcing a JSON structure and parses the result into a python dictionary.
        """
        raw_response = LLMService.call_gemini(
            prompt=prompt,
            system_instruction=system_instruction,
            model_name=model_name,
            temperature=temperature,
            json_output=True
        )
        
        try:
            return json.loads(raw_response)
        except json.JSONDecodeError as e:
            clean_str = raw_response.strip()
            if clean_str.startswith("```json"):
                clean_str = clean_str.split("```json")[1].split("```")[0].strip()
            elif clean_str.startswith("```"):
                clean_str = clean_str.split("```")[1].split("```")[0].strip()
            try:
                return json.loads(clean_str)
            except Exception:
                raise ValueError(f"Failed to parse JSON response from LLM. Raw output: {raw_response}") from e