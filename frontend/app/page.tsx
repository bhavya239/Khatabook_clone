'use client';
/**
 * Hidden UI — Page 1 of 2 (Outer Layer)
 * This is what users see FIRST. It looks like a real calculator.
 * Secret unlock: click "=" 5 times in a row → redirect to /unlock or /auth/signup
 */
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const BUTTONS = [
  'AC', '+/-', '%', '÷',
  '7', '8', '9', '×',
  '4', '5', '6', '-',
  '1', '2', '3', '+',
  '0', '.', '=',
];

export default function CalculatorPage() {
  const [input, setInput] = useState('0');
  const [isNewInput, setIsNewInput] = useState(true);
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const eqCount = useRef(0); // counts consecutive "=" presses

  const handleButton = (btn: string) => {
    if (btn === '=') {
      eqCount.current += 1;
      
      // Secret: press "=" 5 times → go to auth or unlock
      if (eqCount.current >= 5) {
        if (isAuthenticated) {
          router.push('/unlock');
        } else {
          router.push('/auth/signup');
        }
        return;
      }
      
      // Execute robust calculation safely
      try {
        const safe = input
          .replace(/÷/g, '/')
          .replace(/×/g, '*')
          .replace(/[^0-9+\-*/.]/g, ''); // strip any letters/bad chars

        // Ignore incomplete/trailing calculations like '5+'
        if (!safe || safe.endsWith('/') || safe.endsWith('*') || safe.endsWith('+') || safe.endsWith('-')) {
          return;
        }
        
        // eslint-disable-next-line no-eval
        const result = eval(safe);
        if (result === undefined || Number.isNaN(result)) throw new Error('Bad eval');
        
        setInput(String(result));
        setIsNewInput(true);
      } catch {
        setInput('Error');
        setIsNewInput(true);
      }
      return;
    }

    // Any non-"=" keypress resets the secret counter
    eqCount.current = 0;

    if (btn === 'AC') {
      setInput('0');
      setIsNewInput(true);
      return;
    }
    
    if (btn === '+/-') {
      if (input === 'Error') return;
      const val = parseFloat(input);
      if (isNaN(val)) return;
      
      const toggled = String(-val);
      setInput(toggled);
      return;
    }
    
    if (btn === '%') {
      if (input === 'Error') return;
      const val = parseFloat(input);
      if (isNaN(val)) return;
      
      const pct = String(val / 100);
      setInput(pct);
      setIsNewInput(true);
      return;
    }

    // Handle normal operators (+ - x /) vs numbers
    const isOp = ['+', '-', '×', '÷'].includes(btn);
    
    if (isOp) {
      if (input === 'Error') {
        setInput('0' + btn);
      } else {
        // Replace last op if tapping multiple ops (e.g., 5 + - -> 5 -)
        const lastChar = input.slice(-1);
        if (['+', '-', '×', '÷'].includes(lastChar)) {
          setInput(input.slice(0, -1) + btn);
        } else {
          setInput(input + btn);
        }
      }
      setIsNewInput(false);
    } else {
      // It's a number or decimal point
      if (isNewInput || input === '0' || input === 'Error') {
        setInput(btn === '.' ? '0.' : btn);
        setIsNewInput(false);
      } else {
        setInput(input + btn);
      }
    }
  };

  const isOperator = (b: string) => ['÷', '×', '-', '+'].includes(b);
  const isEquals   = (b: string) => b === '=';
  const isWide     = (b: string) => b === '0';

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-full max-w-xs select-none">
        {/* Display */}
        <div className="px-5 pb-4 pt-10">
          <p className="text-right text-5xl font-light text-white truncate break-all overflow-hidden" 
             style={{ direction: 'rtl', textAlign: 'left' }}>
            <span style={{ direction: 'ltr', unicodeBidi: 'bidi-override' }}>
               {input.length > 12 && !isNaN(Number(input)) ? parseFloat(input).toExponential(5) : input}
            </span>
          </p>
        </div>

        {/* Buttons grid */}
        <div className="grid grid-cols-4 gap-3 px-4 pb-6">
          {BUTTONS.map((btn) => (
            <button
              key={btn}
              onClick={() => handleButton(btn)}
              className={[
                'h-16 rounded-full text-xl font-medium transition-transform active:scale-95',
                isWide(btn) ? 'col-span-2 text-left pl-6' : '',
                isOperator(btn) ? 'bg-amber-500 text-white' :
                isEquals(btn)   ? 'bg-amber-500 text-white' :
                ['AC', '+/-', '%'].includes(btn)
                  ? 'bg-gray-400 text-black'
                  : 'bg-gray-700 text-white',
              ].join(' ')}
            >
              {btn}
            </button>
          ))}
        </div>

        {/* Tiny hint (invisible unless you know) */}
        <p className="text-center text-gray-900 text-xs pb-2 select-none">v2.1.4</p>
      </div>
    </div>
  );
}
