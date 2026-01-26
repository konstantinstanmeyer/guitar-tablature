import './App.css'

import { useEffect, useMemo, useState } from 'react';
import type { TabLine } from "../types/types"

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
  

  return (
    <main className="">
      
    </main>
  )
}

export default App
