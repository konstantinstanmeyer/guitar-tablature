import './App.css'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { type ActiveCell, type TabLine } from "../types/types"

// Standard tuning, to later get handling for alternative tuning/more strings
const STRING_NAMES = ['e', 'B', 'G', 'D', 'A', 'E'];

// Default number of "columns", a.k.a. beats (tab equivalent), for each line of tablature
// NOTE: Adjust post-testing for common musical phrase length
// Set as a uniform value for visual conformity when exporting to pdf
const DEFAULT_LENGTH = 40;

const TAB_ACTIONS = new Set([
  'KeyH',
  'KeyP',
  'Slash',
  'Backslash',
  'KeyB',
  'KeyR',
  'KeyX',
  'Backquote', // ~ (with Shift)
  'KeyS',
  'Period',    // > (with Shift)
  'Digit1',
  'Digit2',
  'Digit3',
  'Digit4',
  'Digit5',
  'Backspace',
  'Delete'
])

function generateId(): string {
  // getting base-36 string after "0." until the 9th index, nearly impossible to ever collide with previous values
  return Math.random().toString(36).substring(2,9);
}

function createEmptyLine(length: number = DEFAULT_LENGTH): TabLine{
  return {
    id: generateId(),
    strings: STRING_NAMES.map(() => '-'.repeat(length))
  }
}

function App() {
  const [lines, setLines] = useState<TabLine[]>([createEmptyLine()]);
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);
  const [focusedMeasure, setFocusedMeasure] = useState<string | null>(null);

  // Storing refs to each input element for focusing effeciency on later function calls
  const cellRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  useEffect(() => {
    if(activeCell) {
      const key = getCellKey(activeCell.lineId, activeCell.stringIndex, activeCell.position)
      const input = cellRefs.current.get(key);
      if(input){
        input.focus();
      }
    }
  }, [activeCell])

  function getCellKey(lineId: string, stringIndex: number, position: number): string {
    return `${lineId}-${stringIndex}-${position}`
  }

  function addLine(){
    const lastLine = lines[lines.length - 1];
    const length = lastLine ? lastLine.strings[0].length : DEFAULT_LENGTH;
    setLines((prev) => [...prev,createEmptyLine(length)]) ;
  }

  function deleteLine(lineId: string){
    // NOTE: nearly-impossible edge-case, maybe not needed due to buttons being disabled on equal params
    if(lines.length <= 1) return;
    setLines((prev) => prev.filter((l) => l.id !== lineId));
  }

  function clearLine(lineId: string){
    setLines((prev) =>
      prev.map((line) => {
        if(line.id !== lineId) return line;
        const length = line.strings[0].length;
        return createEmptyLine(length);
      })
    )
  }

  function clearAll(){
    setLines((prev) => prev.map((line) => createEmptyLine(line.strings[0].length)));
  };

  function handleCellClick(lineId: string, stringIndex: number, position: number) {
    setActiveCell({ lineId, stringIndex, position });
  }

  function moveToPrevString(lineId: string, currentStringIndex: number, position: number){
    const lineIndex = lines.findIndex((l => l.id === lineId));
    if (lineIndex === -1) return;

    if(currentStringIndex > 0) {
      setActiveCell({
        lineId,
        stringIndex: currentStringIndex - 1,
        position: position
      })
    } else if (lineIndex > 0) {
      setActiveCell({
        lineId: lines[lineIndex - 1].id,
        stringIndex: STRING_NAMES.length - 1,
        position,
      });
    }
  }

  function moveToNextString(lineId: string, currentStringIndex: number, position: number){
    const lineIndex = lines.findIndex((l => l.id === lineId));
    if (lineIndex === -1) return;

    if (currentStringIndex < STRING_NAMES.length - 1) {
      setActiveCell({
        lineId,
        stringIndex: currentStringIndex + 1,
        position,
      });
    } else if (lineIndex < lines.length - 1) {
      setActiveCell({
        lineId: lines[lineIndex + 1].id,
        stringIndex: 0,
        position,
      });
    }
  }

  function updateString (lineId: string, stringIndex: number, position: number, value: string) {
    setLines((prev) =>
      prev.map((line) => {
        if (line.id !== lineId) return line;
        const newStrings = [...line.strings];
        const currentString = newStrings[stringIndex];

        const newString = currentString.split('');
        newString[position] = value === '' ? '-' : value;
        newStrings[stringIndex] = newString.join('');

        return { ...line, strings: newStrings };
      })
    );
  };

  function insertColumnAt (lineId: string, position: number) {
    setLines((prev) => {
      const lineIndex = prev.findIndex((l) => l.id === lineId);
      if (lineIndex === -1) return prev;

      return prev.map((line, index) => {
        if (index === lineIndex) {
          // Insert new column at the next column index
          return {
            ...line,
            strings: line.strings.map((str) => {
              const before = str.slice(0, position + 1);
              const after = str.slice(position + 1);
              return before + '-' + after;
            }),
          };
        } else {
          // Extend other lines by adding a dash at the end maintaining consistend line lenghts
          // appending to the end of their strings to not interrupt tab behavior
          return {
            ...line,
            strings: line.strings.map((str) => str + '-'),
          };
        }
      });
    });
  };

  function extendLines (){
    setLines(prev => {
      return prev.map((line) => {
        return {
          ...line,
          strings: line.strings.map((str) => {
            return str += "-----"
          })
        }
      })
    })
  }

  function shortenLines(){
    const length = lines[0].strings[0].length;
    setLines (prev => {
      return prev.map((line) => {
        return {
          ...line,
          strings: line.strings.map((str) => {
            return str.slice(0,length - 5);
          })
        }
      })
    })
  }

  function resetLines(){
    setLines([createEmptyLine()]);
  }

  function handleKeyDown (e: KeyboardEvent, lineId: string, stringIndex: number, position: number){
    // non-deprecated keydown value for later keyboard actions handling

    const key = e.key;
    console.log(key)
    const line = lines.find(l => l.id === lineId);
    if(!line) return;

    const lineLength = line.strings[0].length;
    const lineIndex = lines.findIndex((l) => l.id === lineId);
    
    // Navigation
    if(key === 'ArrowUp'){
      e.preventDefault();
      moveToPrevString(lineId, stringIndex, position)
    } else if(key === 'ArrowDown'){
      e.preventDefault();
      moveToNextString(lineId, stringIndex, position);
    } else if (key === 'ArrowLeft'){
      e.preventDefault();
      if (position > 0) {
        setActiveCell({ lineId, stringIndex, position: position - 1 });
      } else if (lineIndex > 0) {
        const prevLine = lines[lineIndex - 1];
        setActiveCell({
          lineId: prevLine.id,
          stringIndex,
          position: prevLine.strings[0].length - 1,
        });
      }
    } else if (key === 'ArrowRight') {
      e.preventDefault();
      if (position < lineLength - 1) {
        setActiveCell({ lineId, stringIndex, position: position + 1 });
      } else if (lineIndex < lines.length - 1) {
        setActiveCell({
          lineId: lines[lineIndex + 1].id,
          stringIndex,
          position: 0,
        });
      }
    } else if (key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        moveToPrevString(lineId, stringIndex, position);
      } else {
        moveToNextString(lineId, stringIndex, position);
      }
    }

    // Editing
    else if(key === 'Enter') {
      e.preventDefault();
      insertColumnAt(lineId, position);
    } else if(key === 'Backspace') {
      e.preventDefault();
      updateString(lineId, stringIndex, position, "-");
    }

    // String input
    else if (/^[0-9hpbr\/\\x~()|s]$/.test(key) || key === '-') {
      e.preventDefault();
      updateString(lineId, stringIndex, position, key);
      // moveToNextString(lineId, stringIndex, position);
    }
  }

  function previewTabs(){
    let output = '';
    lines.forEach((line) => {
      STRING_NAMES.forEach((name, i) => {
        output += `${name}|${line.strings[i]}\n`
      })
    })
    return output;
  }

  function handleMeasureClick(lineId: string) {
    setFocusedMeasure(lineId);
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-6">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-4">
        <div className="no-print bg-[#242424] border border-[#333333] rounded-xl p-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-1 h-7 bg-[#e85d04] rounded-sm"></div>
            <h1 className="text-xl font-semibold text-[#f5f5f5]">
              Guitar Tab Editor
            </h1>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => addLine()}
              className="px-5 py-2.5 text-sm font-medium rounded-lg border border-[#333333] bg-[#2a2a2a] text-[#f5f5f5] hover:bg-[#333333] transition-all cursor-pointer"
            >
              Add Measure
            </button>
          </div>
        </div>
        <div className="no-print bg-[#242424] border border-[#333333] rounded-xl p-5">
          <h2 className="text-xs font-semibold text-[#f5f5f5] uppercase tracking-wider mb-4">
            Quick Reference
          </h2>
          <div className="flex flex-col gap-2 text-sm text-[#a0a0a0]">
            <div className="flex items-center gap-2">
              <span className="text-[#e85d04]">›</span>
              <span><strong className="text-[#f5f5f5]">Click</strong> a cell to select it, then type to enter notes</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#e85d04]">›</span>
              <span><strong className="text-[#f5f5f5]">Numbers:</strong> 0-9 for frets</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[#e85d04]">›</span>
              <span><strong className="text-[#f5f5f5]">Techniques:</strong></span>
              <code className="px-2 py-0.5 bg-[#333333] rounded text-[#e85d04] text-xs font-mono">h</code><span>hammer-on,</span>
              <code className="px-2 py-0.5 bg-[#333333] rounded text-[#e85d04] text-xs font-mono">p</code><span>pull-off,</span>
              <code className="px-2 py-0.5 bg-[#333333] rounded text-[#e85d04] text-xs font-mono">/</code><span>slide up,</span>
              <code className="px-2 py-0.5 bg-[#333333] rounded text-[#e85d04] text-xs font-mono">\</code><span>slide down,</span>
              <code className="px-2 py-0.5 bg-[#333333] rounded text-[#e85d04] text-xs font-mono">b</code><span>bend,</span>
              <code className="px-2 py-0.5 bg-[#333333] rounded text-[#e85d04] text-xs font-mono">r</code><span>release,</span>
              <code className="px-2 py-0.5 bg-[#333333] rounded text-[#e85d04] text-xs font-mono">x</code><span>mute,</span>
              <code className="px-2 py-0.5 bg-[#333333] rounded text-[#e85d04] text-xs font-mono">~</code><span>vibrato,</span>
              <code className="px-2 py-0.5 bg-[#333333] rounded text-[#e85d04] text-xs font-mono">s</code><span>slap</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#e85d04]">›</span>
              <span><strong className="text-[#f5f5f5]">Navigation:</strong> Arrow keys to move, Tab/Shift+Tab to change strings, Enter to advance column</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#e85d04]">›</span>
              <span><strong className="text-[#f5f5f5]">Insert:</strong> Press</span>
              <code className="px-2 py-0.5 bg-[#333333] rounded text-[#f5f5f5] text-xs font-mono border border-[#444444]">Enter</code>
              <span>to add a column (pushes notes to next line)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#e85d04]">›</span>
              <span><strong className="text-[#f5f5f5]">Delete:</strong> Press</span>
              <code className="px-2 py-0.5 bg-[#333333] rounded text-[#f5f5f5] text-xs font-mono border border-[#444444]">Backspace</code>
              <span>to clear current cell</span>
            </div>
          </div>
        </div>
        <div className="no-print bg-[#242424] border border-[#333333] rounded-xl p-4 flex gap-3 flex-wrap">
          <button 
            onClick={() => extendLines()}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-[#333333] bg-transparent text-[#a0a0a0] hover:bg-[#2a2a2a] hover:text-[#f5f5f5] transition-all cursor-pointer"
          >
            Extend Lines
          </button>
          <button 
            onClick={() => shortenLines()}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-[#333333] bg-transparent text-[#a0a0a0] hover:bg-[#2a2a2a] hover:text-[#f5f5f5] transition-all cursor-pointer"
          >
            Shorten Lines
          </button>
          <button 
            onClick={() => clearAll()}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-[#e85d04] bg-transparent text-[#e85d04] hover:bg-[#e85d04]/10 transition-all cursor-pointer"
          >
            Clear All
          </button>
        </div>
        {lines.map((line, lineIndex) => 
          <div 
            key={line.id}
            onClick={() => handleMeasureClick(line.id)}
            className={`bg-[#242424] rounded-xl p-5 transition-all cursor-pointer ${
              focusedMeasure === line.id 
                ? 'border-2 border-[#e85d04]' 
                : 'border border-[#333333] hover:border-[#444444]'
            }`}
          >
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#333333]">
              <span className="text-xs font-semibold text-[#a0a0a0] uppercase tracking-wider">
                Measure {lineIndex + 1}
              </span>
              <div className="no-print flex gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); clearLine(line.id); }}
                  className="px-4 py-1.5 text-xs font-medium rounded-lg border border-[#e85d04] bg-transparent text-[#e85d04] hover:bg-[#e85d04]/10 transition-all cursor-pointer"
                >
                  Clear
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteLine(line.id); }}
                  disabled={lines.length <= 1}
                  className="px-4 py-1.5 text-xs font-medium rounded-lg border border-[#444444] bg-transparent text-[#666666] hover:bg-[#333333] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="flex items-center mb-1 ml-[52px]">
              {line.strings[0].split('').map((_, position) => (
                <span 
                  key={position}
                  className="w-5 text-[10px] text-[#666666] text-center font-mono"
                >
                  {position % 5 === 0 ? position : ''}
                </span>
              ))}
            </div>
            <div className="tab-grid overflow-x-auto pb-2">
              {STRING_NAMES.map((stringName, stringIndex) => 
                <div key={stringName} className="flex items-center h-[26px]">
                  <span 
                    className="w-6 text-[13px] font-medium text-[#a0a0a0] text-center shrink-0"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {stringName}
                  </span>
                  <span 
                    className="w-6 text-sm font-normal text-[#666666] text-center shrink-0"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    |
                  </span>
                  <div className="flex">
                    {line.strings[stringIndex].split('').map((char, charPosition) => 
                      <input
                        key={charPosition}
                        ref={(el) => {
                          const key = getCellKey(
                            line.id,
                            stringIndex,
                            charPosition
                          )
                          if(el) {
                            cellRefs.current.set(key, el)
                          } else {
                            cellRefs.current.delete(key)
                          }
                        }}
                        value={char}
                        className={`tab-cell courier ${
                          activeCell?.lineId === line.id &&
                          activeCell?.stringIndex === stringIndex &&
                          activeCell?.position === charPosition
                            ? ' active'
                            : ''
                        }${
                          activeCell?.lineId === line.id &&
                          activeCell?.position === charPosition
                            ? ' column-highlight'
                            : ''
                        }`}
                        onClick={(e) => { e.stopPropagation(); handleCellClick(line.id, stringIndex, charPosition); }}
                        onKeyDown={(e) => handleKeyDown(e, line.id, stringIndex, charPosition)}
                        onChange={() => {}}
                      />
                    )}
                  </div>
                  <span 
                    className="w-6 text-sm font-normal text-[#666666] text-center"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    |
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="no-print bg-[#242424] border border-[#333333] rounded-xl p-5">
          <h3 className="text-xs font-semibold text-[#f5f5f5] uppercase tracking-wider mb-4">
            Preview
          </h3>
          <pre 
            className="bg-[#1a1a1a] text-[#a0a0a0] py-5 px-6 rounded-lg text-[13px] leading-[1.4] overflow-x-auto whitespace-pre m-0 border border-[#333333]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {previewTabs()}
          </pre>
        </div>

      </div>
    </div>
  )
}

export default App