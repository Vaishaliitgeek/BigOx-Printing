import React, { useState, useRef, useEffect } from 'react';
import './Paper.css';

// --- IndexedDB helpers (same DB as in Upload) ---
const DB_NAME = 'image-db';
const DB_VERSION = 1;
const STORE_NAME = 'images';
const CURRENT_IMAGE_KEY = 'current-image';

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);


    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

async function loadImageFromDb() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(CURRENT_IMAGE_KEY);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = (event) => reject(event.target.error);
  });
}

const PAPERS = [
  {
    id: 'p1',
    name: 'Photo Rag',
    finish: 'Matte',
    weight: '308gsm',
    description: 'Museum-quality 100% cotton rag with a smooth, matte surface.',
    priceAdjustment: 0,
  },
  {
    id: 'p2',
    name: 'Baryta',
    finish: 'Semi-Gloss',
    weight: '315gsm',
    description: 'Classic darkroom feel with a subtle sheen.',
    priceAdjustment: 5,
  },
  {
    id: 'p3',
    name: 'Smooth Cotton Rag',
    finish: 'Matte',
    weight: '320gsm',
    description: 'Soft, velvety texture with excellent color reproduction.',
    priceAdjustment: 4,
  },
  {
    id: 'p4',
    name: 'Premium Luster',
    finish: 'Luster',
    weight: '260gsm',
    description: 'Pearlescent surface with vibrant colors.',
    priceAdjustment: 3,
  },
  {
    id: 'p5',
    name: 'Metallic Gloss',
    finish: 'Gloss',
    weight: '255gsm',
    description: 'Pearlescent finish with extra depth and luminosity.',
    priceAdjustment: 8,
  },
  {
    id: 'p6',
    name: 'Fine Art Matte',
    finish: 'Matte',
    weight: '220gsm',
    description: 'Smooth, non-reflective surface ideal for detailed work.',
    priceAdjustment: 2,
  },
];

// --- Component ---

const Paper = ({ handleBack, handleNext }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const [imageSrc, setImageSrc] = useState(null);

  const [selectedPaperId, setSelectedPaperId] = useState(PAPERS[0].id);

  const minZoom = 0.5;
  const maxZoom = 3;

  const pointerMap = useRef(new Map());
  const lastPanPosRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const pinchStartZoomRef = useRef(1);
  const pinchStartDistanceRef = useRef(null);

  // Load image from IndexedDB
  useEffect(() => {
    (async () => {
      try {
        const saved = await loadImageFromDb();
        if (saved && saved.url) {
          setImageSrc(saved.url);
        }
      } catch (err) {
        console.error('Error loading image from IndexedDB:', err);
      }
    })();
  }, []);

  const selectedPaper = PAPERS.find((p) => p.id === selectedPaperId);

  return (
    <div className="editor-page">
      <div className="editor-container">
        <div className="editor-layout">
          {/* LEFT SIDE */}
          <div className="editor-left">
            <h2 className="editor-title-left">Preview</h2>

            <div
              className="editor-crop-area"
            >
              <div
                className="editor-image-wrapper"
              >
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt="Preview"
                    className="editor-image"
                    draggable="false"
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#888',
                      fontSize: '14px',
                      padding: '1rem',
                      textAlign: 'center',
                    }}
                  >
                    No image found. Please upload an image first.
                  </div>
                )}
              </div>

              <div className="editor-size-label">
                {selectedPaper ? selectedPaper.name : 'Select a paper'}
              </div>
            </div>

          </div>

          {/* RIGHT SIDE – PAPER GRID */}
          <div className="editor-right">
            <h2 className="editor-title-right">
              Choose from our collection of museum-grade fine art papers
            </h2>

            <div className="paper-grid">
              {PAPERS.map((paper) => (
                <button
                  key={paper.id}
                  onClick={() => setSelectedPaperId(paper.id)}
                  className={
                    'paper-card ' +
                    (selectedPaperId === paper.id ? 'paper-card-selected' : '')
                  }
                >
                  {/* Thumbnail area */}
                  <div className="paper-card-thumb">
                    {/* you can swap this gradient for real sample images later */}
                    {/* <div className="paper-card-thumb-art" /> */}
                    <img src='https://i.pinimg.com/736x/8d/7f/01/8d7f01d0130cb534c101b3ce4a14a385.jpg'></img>
                    <div className="paper-card-radio">
                      <div className="paper-card-radio-outer">
                        {selectedPaperId === paper.id && (
                          <div className="paper-card-radio-inner" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Text area */}
                  <div className="paper-card-body">
                    <div className="paper-card-name-row">
                      <span className="paper-card-name">{paper.name}</span>
                    </div>

                    <div className="paper-card-tags">
                      <span className="paper-tag">{paper.finish}</span>
                      <span className="paper-tag paper-tag-outline">
                        {paper.weight}
                      </span>
                    </div>

                    <p className="paper-card-description">{paper.description}</p>

                    <div className="paper-card-price-row">
                      {paper.priceAdjustment === 0 ? (
                        <span className="paper-price-neutral">Included</span>
                      ) : (
                        <span
                          className={
                            'paper-price-adjust ' +
                            (paper.priceAdjustment < 0
                              ? 'paper-price-adjust-down'
                              : '')
                          }
                        >
                          {paper.priceAdjustment > 0 ? '+ $' : '- $'}
                          {Math.abs(paper.priceAdjustment)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Action Buttons */}
          </div>
        </div>
      </div>
      <div className="footer-bar">
        <div className="footer-inner">
          <button
            className="footer-btn footer-btn-outline"
            onClick={() => handleBack()}
          // disabled={currentStep === 1}
          >
            Back
          </button>

          <button
            className="footer-btn footer-btn-primary"
            onClick={() => handleNext()}
          // onClick={handleContinue}
          // disabled={!canContinue()}
          >
            Continue
            {/* {currentStep === 4 ? "Add to Cart" : "Continue"} */}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Paper;



// const FooterBar = ({ currentStep, handleBack, handleContinue, canContinue }) => {
//   currentStep = 3; // Paper step
//   return (
//     <div className="footer-bar">
//       <div className="footer-inner">
//         <button
//           className="footer-btn footer-btn-outline"
//           onClick={() => handleBack()}
//         // disabled={currentStep === 1}
//         >
//           Back
//         </button>

//         <button
//           className="footer-btn footer-btn-primary"
//           onClick={() => hanndleNext()}
//         // onClick={handleContinue}
//         // disabled={!canContinue()}
//         >
//           {currentStep === 4 ? "Add to Cart" : "Continue"}
//         </button>
//       </div>
//     </div>
//   );
// };