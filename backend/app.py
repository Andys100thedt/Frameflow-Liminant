import inspect
import json
import os
import importlib
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from registry import registered_functions

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def discover_and_register_functions():
    functions_dir = Path(__file__).parent / "functions"
    
    if not functions_dir.exists():
        print(f"Functions directory not found: {functions_dir}")
        return
    
    import sys
    sys.path.insert(0, str(functions_dir.parent))
    
    for py_file in functions_dir.rglob("*.py"):
        if py_file.name.startswith("_"):
            continue
        
        try:
            rel_path = py_file.relative_to(functions_dir.parent)
            module_name = str(rel_path.with_suffix("")).replace(os.sep, ".")
            
            module = importlib.import_module(module_name)
            
            if hasattr(module, "register"):
                print(f"Found register() in {module_name}, calling it...")
                module.register()
            else:
                print(f"No register() function found in {module_name}")
        except Exception as e:
            print(f"Error importing {module_name}: {e}")


class FunctionMetadata(BaseModel):
    name: str
    description: str
    parameters: List[Dict[str, Any]]
    return_type: str
    category: str


class ExecuteRequest(BaseModel):
    function_name: str
    parameters: Dict[str, Any]


class ExecuteResponse(BaseModel):
    result: Any
    success: bool
    message: str


def register_function(func: Callable = None, *, name: Optional[str] = None, description: str = "", category: Optional[str] = None):
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
        
        func_category = category
        if func_category is None:
            module = inspect.getmodule(f)
            if module and module.__file__:
                import os
                module_path = os.path.relpath(module.__file__, os.getcwd())
                module_dir = os.path.dirname(module_path)
                
                if module_dir and module_dir.startswith('functions'):
                    module_dir = module_dir[len('functions'):].lstrip('/\\')
                
                if module_dir:
                    func_category = module_dir.replace(os.sep, '/')
                else:
                    func_category = "default"
            else:
                func_category = "default"
        
        registered_functions[func_name] = {
            "name": func_name,
            "description": description or f.__doc__ or "",
            "parameters": parameters,
            "return_type": return_type,
            "category": func_category,
            "function": f
        }
        
        print(f"Registered function: {func_name} with category: {func_category}")
        
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
            "return_type": func_data["return_type"],
            "category": func_data["category"]
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


discover_and_register_functions()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
