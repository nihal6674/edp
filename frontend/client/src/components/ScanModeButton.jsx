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

  const getButtonClasses = (mode, color) => {
    const isSelected = selectedMode === mode;
    return `px-6 py-2 rounded-lg transition font-semibold ${
      isSelected
        ? `bg-${color}-500 text-white`
        : `bg-transparent border-2 border-${color}-500 text-${color}-500 hover:bg-${color}-100`
    }`;
  };

  return (
    <div className="flex flex-col items-center space-y-6 mt-10">
      <h2 className="text-2xl font-bold">Select Scan Mode</h2>

      <div className="flex space-x-4">
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
      </div>

      {response && <p className="text-gray-700">{response}</p>}
    </div>
  );
};

export default ScanModeButtons;
