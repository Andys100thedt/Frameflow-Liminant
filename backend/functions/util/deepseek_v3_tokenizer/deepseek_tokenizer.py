import transformers
from transformers import TokenizersBackend, SentencePieceBackend

from backend.app import register_function

chat_tokenizer_dir = "D:/miaow/Frameflow-Liminant/backend/functions/util/deepseek_v3_tokenizer"

@register_function(description="Estimate token length", category="util/ds")
def estimate_len_tokens(text: str) -> int:
        tokenizer = transformers.AutoTokenizer.from_pretrained(
                chat_tokenizer_dir, trust_remote_code=True
                )
        result = len(tokenizer.encode(text))
        return result

@register_function(description="Encoding estimation", category="util/ds")
def estimate_encoding(text: str) -> list[int]:
        tokenizer = transformers.AutoTokenizer.from_pretrained(
                chat_tokenizer_dir, trust_remote_code=True
        )
        result = tokenizer.encode(text)
        return result

@register_function(description="Decoding estimation", category="util/ds")
def estimate_decoding(tokens: list[int]) -> list[str]:
        tokenizer: TokenizersBackend | SentencePieceBackend = transformers.AutoTokenizer.from_pretrained(
                chat_tokenizer_dir, trust_remote_code=True
        )
        result = list(tokenizer.decode(tokens))
        return result