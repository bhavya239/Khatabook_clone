'use client';
/**
 * Hidden UI — Page 1 of 2 (Outer Layer)
 * This is what users see FIRST. It looks like a real calculator.
 * Secret unlock: click "=" 5 times in a row → redirect to /unlock
 */
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

const BUTTONS = [
  'AC', '+/-', '%', '÷',
  '7', '8', '9', '×',
  '4', '5', '6', '-',
  '1', '2', '3', '+',
  '0', '.', '=',
];

export default function CalculatorPage() {
  const [display, setDisplay] = useState('0');
  const [expr, setExpr] = useState('');
  const router = useRouter();
  const eqCount = useRef(0); // counts consecutive "=" presses

  const handleButton = (btn: string) => {
    if (btn === '=') {
      eqCount.current += 1;
      // Secret: press "=" 5 times → go to unlock screen
      if (eqCount.current >= 5) {
        router.push('/unlock');
        return;
      }
      try {
        const safe = expr
          .replace(/÷/g, '/')
          .replace(/×/g, '*')
          .replace(/[^0-9+\-*/.]/g, '');
        // eslint-disable-next-line no-eval
        const result = eval(safe);
        setDisplay(String(result));
        setExpr(String(result));
      } catch {
        setDisplay('Error');
        setExpr('');
      }
      return;
    }

    // Any non-"=" keypress resets the secret counter
    eqCount.current = 0;

    if (btn === 'AC') {
      setDisplay('0');
      setExpr('');
      return;
    }
    if (btn === '+/-') {
      const val = parseFloat(expr || display);
      const toggled = String(-val);
      setDisplay(toggled);
      setExpr(toggled);
      return;
    }
    if (btn === '%') {
      const val = parseFloat(expr || display) / 100;
      setDisplay(String(val));
      setExpr(String(val));
      return;
    }

    const newExpr = (expr === '0' && !isNaN(Number(btn))) ? btn : expr + btn;
    setExpr(newExpr);
    setDisplay(newExpr);
  };

  const isOperator = (b: string) => ['÷', '×', '-', '+'].includes(b);
  const isEquals   = (b: string) => b === '=';
  const isWide     = (b: string) => b === '0';

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-full max-w-xs select-none">
        {/* Display */}
        <div className="px-5 pb-4 pt-10">
          <p className="text-right text-5xl font-light text-white truncate">
            {display.length > 9 ? parseFloat(display).toExponential(3) : display}
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
        <p className="text-center text-gray-900 text-xs pb-2">v2.1.4</p>
      </div>
    </div>
  );
}
