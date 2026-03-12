import React from 'react';
import styled from 'styled-components';
import {FunctionMetadata} from "@/types";
import {Handle, Position} from "@xyflow/react";

interface LLCardProps{
    func: FunctionMetadata|undefined;
}

const LCCard= ({func}: LLCardProps) => {
    const displayName = func?.category ? `/${func.category}/${func.name}` : '/'+func?.name;
    
    return (
        <StyledWrapper>
            <div className="card-container">
                <div className="card">
                    <div className="card-header">
                        <div className="card-tabs">
                            <div className="card-tab active">{displayName}</div>
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="line-numbers">
                            <span>1</span>
                            {func?.parameters.map((parameter, index: number) => {
                                return (
                                    <div key={parameter.name} className="relative">
                                        <Handle
                                        type="target"
                                        position={Position.Left}
                                        id={parameter.name}
                                        className="!bg-blue-500 !w-3 !h-3 !-left-1.5"
                                        />
                                        <span>{index+2}</span>
                                    </div>
                                )
                            })}
                            {(!func?.parameters || func?.parameters.length === 0) && (
                                <div className="relative">
                                    <Handle
                                        type="target"
                                        position={Position.Left}
                                        className="!bg-blue-500 !w-3 !h-3 !-left-1.5"
                                    />
                                    <span>-</span>
                                </div>
                            )}
                            <><span>{func?.parameters.length && func?.parameters.length+2}</span></>
                        </div>
                        <pre className="code-content"><code>
                            <span className="code-keyword">def </span>
                            <span className="code-function">{func?.name}(</span>{"\n"}
                            {func?.parameters.map((value, index) => (
                                <>
                                    <span className="code-variable-2">{"    "}{value.name}</span>
                                    <span className="code-function">{": "}</span>
                                    <span className="code-variable">{value.type}</span>
                                    <span className="code-function">{",\n"}</span>
                                </>
                            ))}
                            {(!func?.parameters || func?.parameters.length === 0) && (
                                <span className="code-comment">{"    "}[No parameters]{"\n"}</span>
                            )}
                            <span className="relative">
                                <span className="code-function">) → </span>
                                <span className="code-variable">{func?.return_type}  </span>
                                <Handle
                                    type="source"
                                    position={Position.Right}
                                    className="!bg-green-500 !w-3 !h-3"
                                />
                            </span>
                            <span className="code-variable"> </span>
                        </code></pre>
                    </div>
                    <div className="card-footer">
                        <span className="language-name">{func?.description}</span>
                    </div>
                </div>
            </div>
        </StyledWrapper>
    );
}

const StyledWrapper = styled.div`
  .card-container {
    resize: both;
    overflow: hidden;
    background: #c0c0c0;
    border: 2px outset #c0c0c0;
    padding: 2px;
    font-family: "MS Sans Serif", "Tahoma", sans-serif;
    font-size: 11px;
  }

  .card {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: #c0c0c0;
    border: 2px inset #c0c0c0;
    overflow: hidden;
    color: #000000;
  }

  .card-header {
    background: #000080;
    padding: 0;
    flex-shrink: 0;
    border-bottom: 1px solid #000000;
  }

  .card-tabs {
    display: flex;
    background: #c0c0c0;
    border-bottom: 1px solid #808080;
    height: 20px;
  }

  .card-tab {
    padding: 2px 8px;
    font-size: 11px;
    color: #000000;
    background: #c0c0c0;
    border: 2px outset #c0c0c0;
    border-bottom: none;
    cursor: pointer;
    height: 18px;
    margin-top: 1px;
  }

  .card-tab.active {
    background: #c0c0c0;
    border: 2px outset #c0c0c0;
    border-bottom: 1px solid #c0c0c0;
    margin-top: 0;
    height: 19px;
    position: relative;
    z-index: 2;
  }

  .card-body {
    display: flex;
    flex-grow: 1;
    overflow: auto;
    padding: 4px 0 4px 2px;
    font-family: "Courier New", monospace;
    font-size: 12px;
    line-height: 1.2;
    background: #ffffff;
    border: 1px inset #808080;
    margin: 2px;
  }

  .line-numbers {
    display: flex;
    flex-direction: column;
    padding: 0 6px;
    text-align: right;
    color: #808080;
    user-select: none;
    font-size: 12px;
    background: #f0f0f0;
    border-right: 1px solid #c0c0c0;
  }

  .code-content {
    margin: 0;
    padding: 0 4px;
    white-space: pre;
    overflow-x: auto;
    color: #000000;
  }

  .code-comment {
    color: #008000;
  }
  .code-keyword {
    color: #0000ff;
    font-weight: bold;
  }
  .code-variable {
    color: #800080;
  }
  .code-variable-2 {
    color: #ff0000;
  }
  .code-function {
    color: #000000;
    font-weight: bold;
  }
  .code-string {
    color: #808080;
  }
  .code-number {
    color: #000000;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #c0c0c0;
    padding: 2px 4px;
    border-top: 1px solid #808080;
    flex-shrink: 0;
    height: 22px;
  }

  .language-name {
    color: #000000;
    font-weight: normal;
  }

  .copy-button {
    display: flex;
    align-items: center;
    gap: 4px;
    background: #c0c0c0;
    color: #000000;
    border: 2px outset #c0c0c0;
    padding: 0 6px;
    cursor: pointer;
    font-size: 11px;
    height: 18px;
  }

  .copy-button:active {
    border: 2px inset #c0c0c0;
    padding: 1px 5px 0 7px;
  }

  .copy-button svg {
    width: 12px;
    height: 12px;
  }

  .copy-button-text {
    display: none;
  }

  .card-body::-webkit-scrollbar {
    width: 16px;
  }

  .card-body::-webkit-scrollbar-track {
    background: #c0c0c0;
    border: 1px outset #c0c0c0;
  }

  .card-body::-webkit-scrollbar-thumb {
    background: #c0c0c0;
    border: 2px outset #c0c0c0;
  }

  .card-body::-webkit-scrollbar-button {
    display: block;
    height: 16px;
    background: #c0c0c0;
    border: 2px outset #c0c0c0;
  }`;

export default LCCard;
