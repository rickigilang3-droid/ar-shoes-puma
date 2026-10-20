import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { getShoeById } from '../src/data/products.js';
import ShoeDetailPage from '../src/pages/ShoeDetailPage.jsx';

const shoe = getShoeById('puma-vintage-sneaker');
console.log('Testing render of ShoeDetailPage for:', shoe.name);
try {
  const html = ReactDOMServer.renderToString(
    React.createElement(ShoeDetailPage, {
      shoe,
      onBack: () => {},
      onCompare: () => {}
    })
  );
  console.log('Render successful! Length:', html.length);
} catch (err) {
  console.error('Render FAILED:', err);
}

