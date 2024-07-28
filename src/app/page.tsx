"use client";

import React from 'react';
// import EpubReader from '@/components/test-epub-reader';
import EpubReader from '@/components/epub-reader';
import './reader.css';

function App() {
  return (
    <div className='app'>
      <EpubReader url="/book.epub" />
    </div>
    
  );
}

export default App;