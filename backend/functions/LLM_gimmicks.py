from openai.types.chat import ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam

from backend.app import register_function
from backend.functions.util.LLM_calls import openrouter_choices
from backend.functions.util.deepseek_v3_tokenizer.deepseek_tokenizer import estimate_encoding, estimate_decoding

__sys_prompt_cut_continue = ChatCompletionSystemMessageParam(
    content="""You are a message completion agent. Your sole task is to finish a partially-written assistant message that was cut off mid-generation.

You will receive:
1. The original user message.
2. An incomplete assistant response (begins normally, then stops abruptly mid-sentence, mid-word, or mid-thought).

Your job is to:
- Continue the assistant's response from exactly where it stopped, matching the same tone, depth, formatting style, and direction.
- Treat the partial text as immutable—do NOT repeat, rephrase, or replace any existing content.
- Pick up mid-word if needed (e.g., if the cut-off is "applic", continue with "ation of...").
- If the assistant was using markdown formatting (bold, lists, code blocks), maintain that formatting.
- If the assistant was reasoning through a multi-step explanation, complete the remaining steps.
- If the partial text ends with an unfinished code block, close it properly and add any expected output or explanation.
- You are allowed to use any possible way to complete the job, expect those specified in "Constraints".

Constraints:
- Do not add greetings, sign-offs, or meta-commentary ("Here is the rest...").
- Do not contradict or pivot from the direction the assistant was already heading.
- Do not include the original partial text in your output—output ONLY the continuation.
- If the cut-off point is ambiguous, choose the most natural and consistent completion.
- Match the assistant's verbosity level: don't pad a concise answer with unnecessary detail, and don't truncate an elaborate explanation.

Output only the missing continuation text—nothing before it, nothing after it.""",
    role="system",
)

__user_prompt_cut_continue = lambda user_message, partial_assistant_response: ChatCompletionUserMessageParam(
    content=f"""## User Message
{user_message}

## Incomplete Assistant Response
{partial_assistant_response}""",
    role="user",
    name="incomplete_dialogue",
)

@register_function(description="Cut-continue anti-distortion", category="LLM gimmicks")
def cut_continue(model_name: str, user_message: str, step: int, user_name: str = "User"):
    step = int(step)
    print(step,type(step))
    user_message_param = ChatCompletionUserMessageParam(content=user_message,role="user")
    finish_reason = "length"
    history = None
    future_multiplier = 1
    while finish_reason == "length":
        if history is None:
            choice = openrouter_choices(model_name, [user_message_param], 1, step*future_multiplier)[0]
        else:
            choice = openrouter_choices(model_name, [__sys_prompt_cut_continue,__user_prompt_cut_continue(user_message, history)], 1, step*future_multiplier)[0]
        finish_reason = choice.finish_reason
        history = choice.message.content
        if history is not None:
            history = estimate_decoding(estimate_encoding(history)[0:step*future_multiplier])
        print(finish_reason, len(history) if history is not None else "None", future_multiplier)
        future_multiplier += 1

    return history

def register():
    pass