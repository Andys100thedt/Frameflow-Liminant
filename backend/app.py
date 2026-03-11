import inspect
import json
from typing import Any, Callable, Dict, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

registered_functions: Dict[str, Dict[str, Any]] = {}


class FunctionMetadata(BaseModel):
    name: str
    description: str
    parameters: List[Dict[str, Any]]
    return_type: str


class ExecuteRequest(BaseModel):
    function_name: str
    parameters: Dict[str, Any]


class ExecuteResponse(BaseModel):
    result: Any
    success: bool
    message: str


def register_function(func: Callable = None, *, name: Optional[str] = None, description: str = ""):
    def decorator(f: Callable) -> Callable:
        sig = inspect.signature(f)
        func_name = name or f.__name__
        
        parameters = []
        for param_name, param in sig.parameters.items():
            param_info = {
                "name": param_name,
                "type": str(param.annotation) if param.annotation != inspect.Parameter.empty else "Any",
                "has_default": param.default != inspect.Parameter.empty,
            }
            if param.default != inspect.Parameter.empty:
                param_info["default"] = (
                    param.default 
                    if not callable(param.default) 
                    else str(param.default)
                )
            parameters.append(param_info)
        
        return_type = "Any"
        if sig.return_annotation != inspect.Signature.empty:
            return_type = str(sig.return_annotation)
        
        registered_functions[func_name] = {
            "name": func_name,
            "description": description or f.__doc__ or "",
            "parameters": parameters,
            "return_type": return_type,
            "function": f
        }
        
        return f
    
    if func is None:
        return decorator
    return decorator(func)


@app.get("/")
async def root():
    return {"message": "Contextual-Liminal API Server"}


@app.get("/functions")
async def get_functions():
    functions_list = []
    for name, func_data in registered_functions.items():
        functions_list.append({
            "name": func_data["name"],
            "description": func_data["description"],
            "parameters": func_data["parameters"],
            "return_type": func_data["return_type"]
        })
    return {"functions": functions_list}


@app.post("/execute")
async def execute_function(request: ExecuteRequest):
    if request.function_name not in registered_functions:
        raise HTTPException(status_code=404, detail=f"Function '{request.function_name}' not found")
    
    func_data = registered_functions[request.function_name]
    func = func_data["function"]
    
    try:
        result = func(**request.parameters)
        return ExecuteResponse(
            result=result,
            success=True,
            message="Function executed successfully"
        )
    except Exception as e:
        return ExecuteResponse(
            result=None,
            success=False,
            message=f"Error: {str(e)}"
        )


@register_function(description="Add two numbers")
def add(a: int, b: int) -> int:
    return a + b


@register_function(description="Multiply two numbers")
def multiply(a: int, b: int) -> int:
    return a * b


@register_function(description="Greet a user")
def greet(name: str) -> str:
    return f"Hello, {name}!"


@register_function(description="Convert string to uppercase")
def to_uppercase(text: str) -> str:
    return text.upper()


@register_function(description="Get string length")
def string_length(text: str) -> int:
    return len(text)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
