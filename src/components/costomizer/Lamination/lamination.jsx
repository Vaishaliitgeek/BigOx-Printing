import React, { useState, useRef, useEffect } from 'react';
import './lamination.css';
import { getLaminationOptions } from '../../../services/services';
import { TooltipHoverIcon } from '../../../utils/CustomIcon';


// --- IndexedDB helpers (same DB as in Upload) ---
const DB_NAME = 'image-db';
const DB_VERSION = 1;
const STORE_NAME = 'images';
const CURRENT_IMAGE_KEY = 'current-image';
const CROP_IMAGE_KEY = "crop-image";

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
        const request = store.get(CROP_IMAGE_KEY);

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
        priceAdjustment: 5,
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

];

// --- Component ---
const NO_LAMINATION_OPTION = {
    _id: "no-lamination",
    optionName: "No Lamination",
    finish: null,
    durabilityAndCleaningNotes:
        "Print without lamination. Suitable for framing behind glass or museum-grade display.",
    priceDeltaMinor: 0,
    isFrontendOnly: true,
};


const Lamination = ({ handleBack, handleNext, template }) => {
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [laminationData, setLaminationData] = useState([]);

    const [imageSrc, setImageSrc] = useState(null);

    // const [selectedLaminationId, setselectedLaminationId] = useState(null);


    const minZoom = 0.5;
    const maxZoom = 3;

    const pointerMap = useRef(new Map());
    const lastPanPosRef = useRef({ x: 0, y: 0 });
    const isPanningRef = useRef(false);
    const pinchStartZoomRef = useRef(1);
    const pinchStartDistanceRef = useRef(null);

    const [selectedLaminationId, setselectedLaminationId] =
        useState(NO_LAMINATION_OPTION._id);


    // Fetch lamination data properly in useEffect
    useEffect(() => {
        const fetchLaminations = async () => {
            try {
                // const res = await getLaminationOptions();
                // if (!res) {
                //     console.log("Failed to fetch lamination data")
                // }

                setLaminationData(template?.laminationOptions);
            } catch (error) {
                console.log("Error fetching lamination data:", error.message);
            }
        };
        fetchLaminations();
    }, []);


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



    useEffect(() => {
        if (template?.laminationOptions?.length) {
            setLaminationData([
                NO_LAMINATION_OPTION,
                ...template.laminationOptions,
            ]);
        }
    }, [template]);
    // const isNoLamination = lam._id === "no-lamination";

    // const selectedPaper = PAPERS.find((p) => p.id === selectedLaminationId);
    const selectedLamination = laminationData.find(
        (l) => l._id === selectedLaminationId
    );


    return (
        <div className="editor-page">
            <div className="editor-container">
                <div className="content">
                    {/* LEFT SIDE */}
                    <div className="editor-left">
                        <h2>Preview</h2>
                        <div className="editor-crop-area-paper">
                            <div className="lamination-editor-image-wrapper-paper" >
                                {imageSrc ? (
                                    <img
                                        src={imageSrc}
                                        alt="Preview"
                                        className="lamination-editor-image"
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
                                <p className='selected-size'>10x12" print</p>
                            </div>
                        </div>
                        <div className='laminate-wrappper-text'>
                            <p className='laminate-text-heading'>Why laminate?</p>
                            <p> Lamination adds a protective layer to your print, making it more durable and resistant to scratches, moisture, and UV damage. Perfect for high-traffic areas or prints that won't be framed behind glass.
                            </p>
                        </div>

                    </div>

                    {/* RIGHT SIDE – PAPER GRID */}
                    <div className="editor-right">

                        <h2 className="editor-title-right">
                            Select Lamination
                        </h2>
                        {/* <p>
                            Choose from our collection of museum-grade fine art papers
                        </p> */}

                        <div className="lamination-grid">
                            {laminationData?.map((Lamination) => {
                                const isNoLamination = Lamination.optionName == "No Lamination";
                                return <div
                                    key={Lamination._id}
                                    onClick={() => setselectedLaminationId(Lamination._id)}
                                    className={
                                        'lamination-card ' +
                                        (selectedLaminationId == Lamination._id ? 'lamination-card-selected' : '')
                                    }
                                >
                                    {/* Thumbnail area */}
                                    <div className="lamination-card-thumb">
                                        {/* you can swap this gradient for real sample images later */}
                                        {/* <div className="paper-card-thumb-art" /> */}

                                        {
                                            !isNoLamination &&
                                            <img src={Lamination?.thumbnailUrl} alt='lamination-img' height={80} width={80}></img>
                                        }
                                        <div className="lamination-card-radio">
                                            {selectedLaminationId === Lamination._id && (
                                                <div className="lamination-card-radio-outer">

                                                    <svg
                                                        className="checkIcon"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={3}
                                                            d="M5 13l4 4L19 7"
                                                        />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Text area */}
                                    <div className="lamination-card-body">

                                        <span className="lamination-card-name">{Lamination.optionName}</span>
                                        {
                                            !isNoLamination && <div className="paper-card-tags">
                                                <span className="lamination-tag">{Lamination.finish}</span>
                                            </div>}

                                        <span className="lamination-card-description">{Lamination.durabilityAndCleaningNotes}</span>

                                        {
                                            !isNoLamination &&
                                            <div className="paper-card-price-row">
                                                <span
                                                    className={
                                                        'paper-price-adjust ' +
                                                        (Lamination.priceDeltaMinor < 0
                                                            ? 'paper-price-adjust-down'
                                                            : '')
                                                    }
                                                >
                                                    {Lamination.priceDeltaMinor > 0 ? '+ $' : '- $'}
                                                    {Math.abs(Lamination.priceDeltaMinor)}
                                                </span>

                                            </div>

                                        }
                                    </div>


                                </div>
                            })}
                        </div>
                        <div className="footer-inner">
                            <button
                                className="footer-btn footer-btn-outline"
                                onClick={() => handleBack()}
                            >
                                Back
                            </button>

                            <button
                                className="footer-btn footer-btn-primary"
                                disabled={!selectedLamination}
                                onClick={() => {
                                    if (!selectedLamination) return;
                                    handleNext({
                                        lamination: {
                                            id: selectedLamination.isFrontendOnly
                                                ? null
                                                : selectedLamination._id,
                                            name: selectedLamination.optionName,
                                            finish: selectedLamination.finish || null,
                                            priceDeltaMinor: selectedLamination.priceDeltaMinor || 0,
                                            notes: selectedLamination.durabilityAndCleaningNotes,
                                            isNone: selectedLamination.isFrontendOnly === true,
                                        },
                                    })
                                }
                                }

                            >
                                Continue
                            </button>
                        </div>



                    </div>
                </div>
            </div>

        </div >
    );
};

export default Lamination;

