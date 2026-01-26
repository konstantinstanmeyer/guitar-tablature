import './App.css'

import { useRef, useState } from 'react';
import { type ActiveCell, type TabLine } from "../types/types"

// Standard tuning, to later get handling for alternative tuning/more strings
const STRING_NAMES = ['e', 'B', 'G', 'D', 'A', 'E'];

// Default number of "columns", a.k.a. beats (tab equivalent), for each line of tablature
// NOTE: Adjust post-testing for common musical phrase length
// Set as a uniform value for visual conformity when exporting to pdf
const DEFAULT_LENGTH = 40;

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
  const [line, setLine] = useState<TabLine>(createEmptyLine());
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);

  // Storing refs to each input element for focusing effeciency on later function calls
  const cellRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  function getCellKey(lineId: string, stringIndex: number, position: number): string{
    return `${lineId}-${stringIndex}-${position}`
  }

  function handleCellClick(lineId: string, stringIndex: number, position: number) {
    setActiveCell({ lineId, stringIndex, position });
  }

  return (
    <main className="flex items-center justify-center h-screen w-full">
      <div>
        {STRING_NAMES.map((stringName, stringIndex) => 
          <div key={stringName} className="flex courier">
            <span className="w-6 text-purple-600 font-bold">{stringName}</span>
            <span className="w-6">|</span>
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
                    text-sm
                    font-mono
                    text-slate-800
                    cursor-pointer
                    outline-none
                    caret-transparent
                    tab-cell
                    hover:bg-[#f1f5f9]
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
                />
              )}
            </div>
            <span className="w-6">|</span>
          </div>
        )}
      </div>
    </main>
  )
}

export default App
