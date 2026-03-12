from typing import Iterable

from openai import OpenAI
from openai.types.chat import ChatCompletionMessageParam, ChatCompletion
from openai.types.chat.chat_completion import Choice

from backend.app import register_function

@register_function(description="Chat completion via OpenRouter API", category="/util/openrouter")
def openrouter_complete(model_name: str, messages: Iterable[ChatCompletionMessageParam], n: int = 1, max_t: int = 32767) -> ChatCompletion:
  client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=open("./api_key").read(),
  )
  completion = client.chat.completions.create(
    model=model_name,
    messages=messages,
    n=n,
    max_tokens=max_t,
  )

  return completion

@register_function(description="Chat completion via OpenRouter API as choices", category="/util/openrouter")
def openrouter_choices(model_name: str, messages: Iterable[ChatCompletionMessageParam], n: int = 1, max_t: int = 32767) -> list[Choice]:
  return openrouter_complete(model_name, messages, n, max_t).choices

@register_function(description="Simple OpenRouter completion to message content", category="/util/openrouter")
def openrouter_simple_to_content(model_name: str, messages: Iterable[ChatCompletionMessageParam], max_t: int = 32767) -> str:
  return openrouter_choices(model_name, messages, 1, max_t)[0].message.content

@register_function(description="OpenRouter completion as message content at tn", category="/util/openrouter")
def openrouter_as_n_contents(model_name: str, messages: Iterable[ChatCompletionMessageParam], n: int, max_t = 32767) -> list[str]:
  return [openrouter_choices(model_name, messages, n, max_t)[idx].message.content for idx in range(n)]

def register():
  pass