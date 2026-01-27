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

  return (
    <main className="flex items-center justify-center h-screen w-full relative px-24 flex-col">
      <div>
        <button onClick={() => extendLines()}>Extend Measures</button>
        <button onClick={() => shortenLines()}>Shorten Measures</button>
        <button onClick={() => addLine()}>Add Measure</button>
        <button onClick={() => clearAll()}>Clear All</button>
        <button onClick={() => resetLines()}>Reset</button>
      </div>
      <div className="border p-3 rounded-md w-full">
        {lines.map((line, lineIndex) => 
          <div className="courier font-mono max-w-350 overflow-x-scroll" key={line.id}>
            <div>
              <h2>Measure {lineIndex + 1}</h2>
              <div className="">
                <button 
                  onClick={() => clearLine(line.id)}
                >
                  Clear
                </button>
                <button
                 onClick={() => deleteLine(line.id)}
                 disabled={lines.length <= 1 ? true : false}
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="overflow-x-scroll">
            {STRING_NAMES.map((stringName, stringIndex) => 
            <div key={stringName} className="flex">
              <span className="w-6 text-purple-600 font-bold mr-2 text-center">{stringName}</span>
              <span className="w-6 m-0 text-center">|</span>
              <div className="flex">
                {line.strings[stringIndex].split('').map((char, charPosition) => 
                  <input
                    key={charPosition}
                    ref={(el) => {
                      // stores refs as a formatted string
                      // NOTE: possibly return to this for more efficient handling
                      const key = getCellKey(
                        line.id,
                        stringIndex,
                        charPosition
                      )
                      // check if cell is still in DOM, or delete ref from ref Map object
                      if(el) {
                        cellRefs.current.set(key, el)
                      } else {
                        cellRefs.current.delete(key)
                      }
                    }}
                    value={char}
                    className={`
                      w-5 h-[26px]
                      bg-transparent
                      border-none
                      p-0
                      text-center
                      text-xs
                      font-mono
                      text-slate-800
                      cursor-pointer
                      outline-none
                      caret-transparent
                      tab-cell
                      hover:bg-[#f1f5f9]
                      font-light!
                      ${
                        activeCell?.lineId === line.id &&
                        activeCell?.stringIndex === stringIndex &&
                        activeCell?.position === charPosition
                          ? 'active'
                          : ''
                      }

                      ${
                        activeCell?.lineId === line.id &&
                        activeCell?.position === charPosition
                          ? 'column-highlight'
                          : ''
                      }
                      `}
                    onClick={() => handleCellClick(line.id, stringIndex, charPosition)}
                    onKeyDown={(e) => handleKeyDown(e, line.id, stringIndex, charPosition)}
                    onChange={() => {}}
                  />
                )}
              </div>
              <span className="w-6">|</span>
            </div>
          )}
          </div>
        </div>
        )}
      </div>
      <pre>{previewTabs()}</pre>
    </main>
  )
}

export default App
