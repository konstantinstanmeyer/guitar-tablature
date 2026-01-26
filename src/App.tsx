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

  function handleCellClick(lineId: string, stringIndex: number, position: number) {
    setActiveCell({ lineId, stringIndex, position });
  }

  return (
    <main className="flex justify-center">
      <div>
        {STRING_NAMES.map((stringName, stringIndex) => 
          <div key={stringName} className="flex courier">
            <span className="w-6 text-purple-600 font-bold">{stringName}</span>
            <span className="w-6">|</span>
            <div className="flex">
              {line.strings[stringIndex].split('').map((char, charPosition) => 
                <input
                  key={charPosition}
                  value={char}
                  className={`
                    w-5 text-center
                    ${
                      activeCell?.lineId === line.id &&
                      activeCell?.stringIndex === stringIndex &&
                      activeCell?.position === charPosition
                        ? 'active'
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
