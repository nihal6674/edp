import React, { useState } from 'react';

const ScanModeButtons = () => {
  const [response, setResponse] = useState('');
  const [selectedMode, setSelectedMode] = useState('');

  const changeMode = async (status) => {
    try {
      const res = await fetch('http://localhost:5000/api/scan/modechange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      setResponse(data.message || data.error);
      setSelectedMode(status);
    } catch (error) {
      setResponse('Request failed.');
    }
  };

  const getButtonClasses = (mode) => {
    const modeStyles = {
      refill: {
        selected: 'bg-green-500 text-white',
        unselected: 'bg-transparent border-2 border-green-500 text-green-500 hover:bg-green-100',
      },
      used: {
        selected: 'bg-red-500 text-white',
        unselected: 'bg-transparent border-2 border-red-500 text-red-500 hover:bg-red-100',
      },
      weighted: {
        selected: 'bg-blue-500 text-white',
        unselected: 'bg-transparent border-2 border-blue-500 text-blue-500 hover:bg-blue-100',
      },
      weighted_refill: {
        selected: 'bg-purple-500 text-white',
        unselected: 'bg-transparent border-2 border-purple-500 text-purple-500 hover:bg-purple-100',
      },
    };
  
    const isSelected = selectedMode === mode;
    const style = modeStyles[mode];
    return `px-6 py-2 rounded-lg transition font-semibold ${isSelected ? style.selected : style.unselected}`;
  };
  

  return (
    <div className="flex flex-col items-center space-y-6 mt-10">
      <h2 className="text-2xl font-bold">Select Scan Mode</h2>

      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={() => changeMode('refill')}
          className={getButtonClasses('refill', 'green')}
        >
          Refill
        </button>
        <button
          onClick={() => changeMode('used')}
          className={getButtonClasses('used', 'red')}
        >
          Used
        </button>
        <button
          onClick={() => changeMode('weighted')}
          className={getButtonClasses('weighted', 'blue')}
        >
          Weighted
        </button>
        <button
          onClick={() => changeMode('weighted_refill')}
          className={getButtonClasses('weighted_refill', 'purple')}
        >
          Weighted Refill
        </button>
      </div>

      {response && <p className="text-gray-700">{response}</p>}
    </div>
  );
};

export default ScanModeButtons;
