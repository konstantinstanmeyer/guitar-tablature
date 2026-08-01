import './App.css'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { type ActiveCell, type TabLine } from "../types/types"

// Standard tuning, to later get handling for alternative tuning/more strings
const STRING_NAMES = ['e', 'B', 'G', 'D', 'A', 'E'];

// Default number of "columns", a.k.a. beats (tab equivalent), for each line of tablature
// NOTE: Adjust post-testing for common musical phrase length
// Set as a uniform value for visual conformity when exporting to pdf
const DEFAULT_LENGTH = 40;

function generateId(): string {
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
  const [showReference, setShowReference] = useState(false);

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

  function updateCell (lineId: string, stringIndex: number, position: number, value: string) {
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
          return {
            ...line,
            strings: line.strings.map((str) => {
              const before = str.slice(0, position + 1);
              const after = str.slice(position + 1);
              return before + '-' + after;
            }),
          };
        } else {
          return {
            ...line,
            strings: line.strings.map((str) => str + '-'),
          };
        }
      });
    });
  };

  function deleteColumnAt (lineId:string, position: number) {
   setLines((prev) => {
      const lineIndex = prev.findIndex((l) => l.id === lineId);
      if (lineIndex === -1) return prev;

      return prev.map((line, index) => {
        if (index === lineIndex) {
          return {
            ...line,
            strings: line.strings.map((str) => {
              const before = str.slice(0, position);
              const after = str.slice(position + 1);
              return before + after + "-";
            }),
          };
        } else {
          return line;
        }
      });
    });
  }

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
    const key = e.key;
    const line = lines.find(l => l.id === lineId);
    if(!line) return;

    const lineLength = line.strings[0].length;
    const lineIndex = lines.findIndex((l) => l.id === lineId);

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
    else if(key === 'Enter') {
      e.preventDefault();
      insertColumnAt(lineId, position);
    } else if(key === 'Backspace') {
      e.preventDefault();
      updateCell(lineId, stringIndex, position, "-");
    } else if(key === "`") {
      e.preventDefault();
      deleteColumnAt(lineId, position)
    }
    else if (/^[0-9hpbr\/\\x~()|s]$/.test(key) || key === '-') {
      e.preventDefault();
      updateCell(lineId, stringIndex, position, key);
    }
  }

  function previewTabs(){
    let output = '';
    lines.forEach((line, lineIndex) => {
      STRING_NAMES.forEach((name, i) => {
        output += `${name}|${line.strings[i]}|\n`
      })
      if (lineIndex < lines.length - 1) {
        output += '\n';
      }
    })
    return output;
  }

  function handleMeasureClick(lineId: string) {
    setFocusedMeasure(lineId);
  }

  async function exportToPdf () {
    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Guitar Tabs</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Newsreader:opsz,wght@6..72,400&display=swap" rel="stylesheet">
            <style>
              body {
                font-family: 'Courier Prime', 'Courier New', monospace;
                color: #1c1b18;
                padding: 48px;
                font-size: 13px;
                line-height: 1.5;
                background: #ffffff;
              }
              h1 {
                font-family: 'Newsreader', Georgia, serif;
                font-weight: 400;
                font-size: 26px;
                margin: 0 0 32px;
                letter-spacing: 0.01em;
              }
              .tab-section { margin-bottom: 28px; page-break-inside: avoid; }
              .string-line { margin: 0; white-space: pre; }
              @media print { body { padding: 24px; } }
            </style>
          </head>
          <body>
            <h1>Guitar Tablature</h1>
            ${lines
              .map(
                (line) => `
              <div class="tab-section">
                ${STRING_NAMES.map(
                  (name, i) =>
                    `<div class="string-line">${name}|${line.strings[i]}|</div>`
                ).join('')}
              </div>
            `
              )
              .join('')}
          </body>
          </html>
        `);
        printWindow.document.close();
      }
    } catch (e:unknown) {
      console.log(e as Error)
    }
  };

  const eyebrow = "font-mono text-[0.66rem] font-bold tracking-[0.2em] uppercase text-ink-faint";
  const btn = "font-mono text-[0.68rem] tracking-[0.14em] uppercase text-ink-faint hover:text-ink transition-colors cursor-pointer disabled:opacity-30 disabled:hover:text-ink-faint disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-1 focus-visible:outline-ink focus-visible:outline-offset-2";

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="max-w-[1120px] mx-auto px-8 py-14">

        {/* Masthead */}
        <header className="no-print flex justify-between items-end gap-6 flex-wrap pb-5 border-b border-line">
          <div>
            <h1 className="font-serif text-[2rem] leading-none">Guitar Tab Editor</h1>
            <p className="mt-2 font-mono text-[0.68rem] tracking-[0.22em] uppercase text-ink-faint">Tablature Worksheet</p>
          </div>
          <div className="flex gap-6">
            <button className={`${btn} text-ink`} onClick={() => addLine()}>Add measure</button>
            <button className={btn} onClick={() => exportToPdf()}>Export</button>
          </div>
        </header>

        {/* Quick reference --- collapsible */}
        <section className="no-print border-b border-line">
          <button
            onClick={() => setShowReference((v) => !v)}
            aria-expanded={showReference}
            className={`${eyebrow} flex items-center gap-2 py-4 hover:text-ink transition-colors cursor-pointer focus-visible:outline focus-visible:outline-1 focus-visible:outline-ink focus-visible:outline-offset-2`}
          >
            <span>Quick Reference</span>
            <span className={`text-[0.8rem] leading-none transition-transform duration-200 ${showReference ? 'rotate-180' : ''}`}>⌄</span>
          </button>
          <div className={`grid transition-all duration-200 ease-out ${showReference ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
              <div className="flex flex-col gap-2.5 pb-5 text-[0.98rem] leading-relaxed text-ink-soft">
                <p><span className="text-ink-faint font-mono mr-2">—</span><strong className="font-medium text-ink">Click</strong> a cell to select it, then type to enter notes</p>
                <p><span className="text-ink-faint font-mono mr-2">—</span><strong className="font-medium text-ink">Numbers:</strong> 0–9 for frets</p>
                <p className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-ink-faint font-mono mr-0.5">—</span>
                  <strong className="font-medium text-ink">Techniques:</strong>
                  <code className="font-mono text-[0.8rem] px-1.5 border border-line rounded-[2px]">h</code><span>hammer-on,</span>
                  <code className="font-mono text-[0.8rem] px-1.5 border border-line rounded-[2px]">p</code><span>pull-off,</span>
                  <code className="font-mono text-[0.8rem] px-1.5 border border-line rounded-[2px]">/</code><span>slide up,</span>
                  <code className="font-mono text-[0.8rem] px-1.5 border border-line rounded-[2px]">\</code><span>slide down,</span>
                  <code className="font-mono text-[0.8rem] px-1.5 border border-line rounded-[2px]">b</code><span>bend,</span>
                  <code className="font-mono text-[0.8rem] px-1.5 border border-line rounded-[2px]">r</code><span>release,</span>
                  <code className="font-mono text-[0.8rem] px-1.5 border border-line rounded-[2px]">x</code><span>mute,</span>
                  <code className="font-mono text-[0.8rem] px-1.5 border border-line rounded-[2px]">~</code><span>vibrato,</span>
                  <code className="font-mono text-[0.8rem] px-1.5 border border-line rounded-[2px]">s</code><span>slap</span>
                </p>
                <p><span className="text-ink-faint font-mono mr-2">—</span><strong className="font-medium text-ink">Navigation:</strong> Arrow keys to move, Tab/Shift+Tab to change strings, Enter to advance column</p>
                <p className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-ink-faint font-mono mr-0.5">—</span>
                  <strong className="font-medium text-ink">Insert:</strong> Press
                  <code className="font-mono text-[0.8rem] px-1.5 border border-line rounded-[2px]">Enter</code>
                  <span>to add a column (pushes notes to next line)</span>
                </p>
                <p className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-ink-faint font-mono mr-0.5">—</span>
                  <strong className="font-medium text-ink">Delete:</strong> Press
                  <code className="font-mono text-[0.8rem] px-1.5 border border-line rounded-[2px]">Backspace</code>
                  <span>to clear current cell,</span>
                  <code className="font-mono text-[0.8rem] px-1.5 border border-line rounded-[2px]">`</code>
                  <span>to delete numbers on selected column</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Global controls */}
        <div className="no-print flex gap-6 flex-wrap py-4 border-b border-line">
          <button className={btn} onClick={() => extendLines()}>Extend lines</button>
          <button className={btn} onClick={() => shortenLines()}>Shorten lines</button>
          <button className={`${btn} text-danger/70 hover:text-danger`} onClick={() => clearAll()}>Clear all</button>
          <button className={`${btn} text-danger/70 hover:text-danger`} onClick={() => resetLines()}>Reset all</button>
        </div>

        {/* Measures */}
        {lines.map((line, lineIndex) =>
          <div
            key={line.id}
            onClick={() => handleMeasureClick(line.id)}
            className="pt-8 pb-2"
          >
            <div className="flex justify-between items-center mb-3">
              <span className={`${eyebrow} ${focusedMeasure === line.id ? 'text-ink' : ''} transition-colors`}>
                Measure {lineIndex + 1}
              </span>
              <div className="no-print flex gap-5">
                <button
                  className={`${btn} text-danger/70 hover:text-danger`}
                  onClick={(e) => { e.stopPropagation(); clearLine(line.id); }}
                >
                  Clear
                </button>
                <button
                  className={btn}
                  onClick={(e) => { e.stopPropagation(); deleteLine(line.id); }}
                  disabled={lines.length <= 1}
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="tab-scroll overflow-x-auto pb-1.5">
              {STRING_NAMES.map((stringName, stringIndex) =>
                <div key={stringName} className="flex items-center h-[26px]">
                  <span className="w-6 text-center shrink-0 font-mono text-[13px] text-ink-faint">{stringName}</span>
                  <span className="w-5 text-center shrink-0 font-mono text-sm text-line-strong">|</span>
                  <div className="flex">
                    {line.strings[stringIndex].split('').map((char, charPosition) =>
                      <input
                        key={charPosition}
                        ref={(el) => {
                          const key = getCellKey(line.id, stringIndex, charPosition)
                          if(el) {
                            cellRefs.current.set(key, el)
                          } else {
                            cellRefs.current.delete(key)
                          }
                        }}
                        value={char}
                        className={`tab-cell test${
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
                  <span className="w-5 text-center shrink-0 font-mono text-sm text-line-strong">|</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preview */}
        <section className="no-print mt-10 pt-6 border-t border-line">
          <h3 className={eyebrow}>Preview</h3>
          <pre className="tab-scroll mt-4 font-mono text-[13px] leading-normal text-ink-soft whitespace-pre overflow-x-auto">{previewTabs()}</pre>
        </section>

      </div>
    </div>
  )
}

export default App