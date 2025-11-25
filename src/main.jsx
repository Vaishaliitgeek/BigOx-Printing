import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
// import React from 'react';
// import { createRoot } from 'react-dom/client';
// import App from './App';
// function mountAll() {
//   // Find all mount points rendered by the Liquid block
//   const nodes = document.querySelectorAll("[data-ae-starter-root]");
//   nodes.forEach((el) => {
//     const props = {
//       greeting: el.getAttribute("data-greeting") || "Hello from AE Starter!",
//     };
//     const root = createRoot(el);
//     root.render(<App />);
//   });
// }

// if (document.readyState === "loading") {
//   document.addEventListener("DOMContentLoaded", mountAll);
// } else {
//   mountAll();
// }