import React from 'react';
import EpubReader from '@/components/test-epub-reader';
import './reader.css';

function App() {
  return (
    <div className='app'>
      <div className="view">
        <EpubReader url="/book.epub" />
      </div>
    </div>
    
  );
}

export default App;