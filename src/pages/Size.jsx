import React, { useState, useRef, useEffect } from 'react';

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

// --- Component ---

const Size = () => {
  const [selectedSize, setSelectedSize] = useState('16×20"');
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const [imageSrc, setImageSrc] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({
    width: null,
    height: null,
  });

  const minZoom = 0.5;
  const maxZoom = 3;

  const pointerMap = useRef(new Map());
  const lastPanPosRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const pinchStartZoomRef = useRef(1);
  const pinchStartDistanceRef = useRef(null);

  // Load image from IndexedDB instead of localStorage
  useEffect(() => {
    (async () => {
      try {
        const saved = await loadImageFromDb();
        if (saved && saved.dataUrl) {
          setImageSrc(saved.dataUrl);
        }
      } catch (err) {
        console.error('Error loading image from IndexedDB:', err);
      }
    })();
  }, []);

  const sizes = [
    { size: '8×10"', price: '$24' },
    { size: '11×14"', price: '$38' },
    { size: '12×18"', price: '$48' },
    { size: '16×20"', price: '$68' },
    { size: '18×24"', price: '$88' },
    { size: '20×30"', price: '$118' },
    { size: '24×36"', price: '$168' },
  ];

  const clampZoom = (val) => Math.min(maxZoom, Math.max(minZoom, val));

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // parse '16×20"' or '16x20"' into inches
  const parseSizeInches = (sizeStr) => {
    if (!sizeStr) return { widthIn: null, heightIn: null };
    const cleaned = sizeStr.replace(/"/g, '').trim(); // remove "
    const [wStr, hStr] = cleaned.split(/[×x]/i);      // × or x
    const widthIn = parseFloat(wStr);
    const heightIn = parseFloat(hStr);
    if (isNaN(widthIn) || isNaN(heightIn)) {
      return { widthIn: null, heightIn: null };
    }
    return { widthIn, heightIn };
  };

  // compute PPI for a given size string
  const computePpiForSize = (sizeStr) => {
    const { width, height } = imageDimensions;
    if (!width || !height) return null;

    const { widthIn, heightIn } = parseSizeInches(sizeStr);
    if (!widthIn || !heightIn) return null;

    const ppiW = width / widthIn;
    const ppiH = height / heightIn;
    const ppi = Math.floor(Math.min(ppiW, ppiH));
    return ppi;
  };

  const getQualityFromPpi = (ppi) => {
    if (ppi == null) return 'gray';
    if (ppi >= 180) return 'green';
    if (ppi >= 150) return 'orange';
    return 'red';
  };

  const getQualityClass = (quality) => {
    switch (quality) {
      case 'green':
        return 'quality-green';
      case 'orange':
        return 'quality-orange';
      case 'red':
        return 'quality-red';
      default:
        return 'quality-gray';
    }
  };

  const zoomPercent = ((zoom - minZoom) / (maxZoom - minZoom)) * 100;

  const getDistance = (p1, p2) => {
    const dx = p1.clientX - p2.clientX;
    const dy = p1.clientY - p2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Pointer handlers
  const handlePointerDown = (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    pointerMap.current.set(e.pointerId, {
      clientX: e.clientX,
      clientY: e.clientY,
    });

    if (pointerMap.current.size === 1) {
      // start pan
      isPanningRef.current = true;
      const only = pointerMap.current.values().next().value;
      lastPanPosRef.current = {
        x: only.clientX - position.x,
        y: only.clientY - position.y,
      };
    }

    if (pointerMap.current.size === 2) {
      // start pinch
      isPanningRef.current = false;
      const [p1, p2] = Array.from(pointerMap.current.values());
      pinchStartDistanceRef.current = getDistance(p1, p2);
      pinchStartZoomRef.current = zoom;
    }
  };

  const handlePointerMove = (e) => {
    if (!pointerMap.current.has(e.pointerId)) return;

    pointerMap.current.set(e.pointerId, {
      clientX: e.clientX,
      clientY: e.clientY,
    });

    if (pointerMap.current.size === 1 && isPanningRef.current) {
      // pan
      const p = pointerMap.current.values().next().value;
      setPosition({
        x: p.clientX - lastPanPosRef.current.x,
        y: p.clientY - lastPanPosRef.current.y,
      });
    }

    if (pointerMap.current.size === 2) {
      // pinch
      const [p1, p2] = Array.from(pointerMap.current.values());
      const currentDistance = getDistance(p1, p2);
      const startDistance = pinchStartDistanceRef.current || currentDistance;
      const scaleFactor = currentDistance / startDistance;
      const newZoom = clampZoom(pinchStartZoomRef.current * scaleFactor);
      setZoom(newZoom);
    }
  };

  const handlePointerUp = (e) => {
    pointerMap.current.delete(e.pointerId);

    if (pointerMap.current.size < 2) {
      pinchStartDistanceRef.current = null;
    }
    if (pointerMap.current.size === 0) {
      isPanningRef.current = false;
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomStep = 0.1;
    const direction = e.deltaY > 0 ? -1 : 1;
    setZoom((prev) => clampZoom(prev + direction * zoomStep));
  };

  const handleSliderChange = (e) => {
    setZoom(clampZoom(parseFloat(e.target.value)));
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const selectedPpi = computePpiForSize(selectedSize);
  const selectedQuality = getQualityFromPpi(selectedPpi);

  return (
    <div className="editor-page">
      <div className="editor-container">
        <div className="editor-layout">
          {/* LEFT SIDE */}
          <div className="editor-left">
            <h2 className="editor-title-left">Crop &amp; Position</h2>

            <div
              className="editor-crop-area"
              style={{ touchAction: 'none', overflow: 'hidden' }}
              onWheel={handleWheel}
            >
              <div
                className="editor-image-wrapper"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  transition:
                    pointerMap.current.size > 0 ? 'none' : 'transform 0.1s ease-out',
                }}
              >
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt="Preview"
                    className="editor-image"
                    draggable="false"
                    onLoad={(e) => {
                      const { naturalWidth, naturalHeight } = e.target;
                      setImageDimensions({
                        width: naturalWidth,
                        height: naturalHeight,
                      });
                    }}
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
                {selectedSize} •{' '}
                {selectedPpi ? `${selectedPpi} PPI` : 'PPI unavailable'}
              </div>
            </div>

            {/* Controls */}
            <div className="editor-controls">
              <div className="editor-controls-top">
                <button onClick={handleRotate} className="editor-rotate-btn">
                  Rotate
                </button>

                <div className="editor-zoom-group">
                  <span className="editor-zoom-label">Zoom</span>
                  <input
                    type="range"
                    min={minZoom}
                    max={maxZoom}
                    step="0.1"
                    value={zoom}
                    onChange={handleSliderChange}
                    className="editor-zoom-range"
                    style={{
                      background: `linear-gradient(
                        to right,
                        #9333ea 0%,
                        #9333ea ${zoomPercent}%,
                        #e9d5ff ${zoomPercent}%,
                        #e9d5ff 100%
                      )`,
                    }}
                  />
                </div>

                <button onClick={handleReset} className="editor-reset-btn">
                  Reset
                </button>
              </div>

              <p className="editor-controls-text">
                Use two fingers to zoom on mobile. Drag to reposition your image.
              </p>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="editor-right">
            <h2 className="editor-title-right">Select Size</h2>

            {/* Size Grid */}
            <div className="editor-size-grid">
              {sizes.map((item) => {
                const ppi = computePpiForSize(item.size);
                const quality = getQualityFromPpi(ppi);
                return (
                  <button
                    key={item.size}
                    onClick={() => setSelectedSize(item.size)}
                    className={
                      'editor-size-card ' +
                      (selectedSize === item.size ? 'editor-size-card-selected' : '')
                    }
                  >
                    <div className="editor-size-card-size">{item.size}</div>
                    <div className="editor-size-card-price">{item.price}</div>
                    <div
                      className={
                        'editor-size-card-ppi ' + getQualityClass(quality)
                      }
                    >
                      {ppi ? `${ppi} PPI` : '—'}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Print Quality Guide */}
            <div className="editor-guide">
              <h3 className="editor-guide-title">Print Quality Guide</h3>
              <div className="editor-guide-list">
                <div className="editor-guide-item">
                  <span className="editor-guide-dot guide-dot-green"></span>
                  <span className="editor-guide-text">
                    &gt;180 PPI: Excellent quality
                  </span>
                </div>
                <div className="editor-guide-item">
                  <span className="editor-guide-dot guide-dot-orange"></span>
                  <span className="editor-guide-text">
                    150–179 PPI: Good quality
                  </span>
                </div>
                <div className="editor-guide-item">
                  <span className="editor-guide-dot guide-dot-red"></span>
                  <span className="editor-guide-text">
                    &lt;150 PPI: May show pixelation
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="editor-actions">
              <button className="editor-btn-secondary">Back</button>
              <button className="editor-btn-primary">Continue</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Size;
