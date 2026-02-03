import React, { useState, useRef, useEffect, useMemo } from 'react';
import './lamination.css';
import { getLaminationOptions } from '../../../services/services';
import { TooltipHoverIcon } from '../../../utils/CustomIcon';
import { loadCropImageFromDb } from '../../../services/indexDb';



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


const Lamination = ({ handleBack, handleNext, template, orderConfig }) => {


    const [laminationData, setLaminationData] = useState([]);

    const [imageSrc, setImageSrc] = useState(null);

    const [imageLoadedMap, setImageLoadedMap] = useState({});


    const [selectedLaminationId, setselectedLaminationId] =
        useState(orderConfig?.lamination?.id ?? NO_LAMINATION_OPTION._id);

    const Laminations = useMemo(() => {
        const active = (template?.laminationOptions || []).filter(
            (lamination) => lamination.status === true
        );

        return [NO_LAMINATION_OPTION, ...active];
    }, [template?.laminationOptions]);

    // Fetch lamination data properly in useEffect
    useEffect(() => {
        const fetchLaminations = async () => {
            try {
                // const res = await getLaminationOptions();
                // if (!res) {
                //     console.log("Failed to fetch lamination data")
                // }
                setLaminationData(Laminations);
            } catch (error) {
                console.log("Error fetching lamination data:", error.message);
            }
        };
        fetchLaminations();
    }, []);

    // helper to load image
    const handleImageLoaded = (id) => {
        setImageLoadedMap(prev => ({
            ...prev,
            [id]: true,
        }));
    };

    // Load image from IndexedDB
    useEffect(() => {
        (async () => {
            try {
                const saved = await loadCropImageFromDb();
                if (saved && saved.url) {
                    setImageSrc(saved.url);
                }
            } catch (err) {
                console.error('Error loading image from IndexedDB:', err);
            }
        })();
    }, []);




    // const isNoLamination = lam._id === "no-lamination";

    // const selectedPaper = PAPERS.find((p) => p.id === selectedLaminationId);
    // const selectedLamination = laminationData.find(
    //     (l) => l._id === selectedLaminationId
    // );
    // const selectedLamination = useMemo(
    //     () => laminationData?.find((l) => l._id === selectedLaminationId) ?? laminationData[0],
    //     [selectedLaminationId]
    // );
    const selectedLamination = useMemo(() => {
        if (!laminationData.length) return null;

        return (
            laminationData.find(l => l._id === selectedLaminationId) ||
            laminationData[0]
        );
    }, [selectedLaminationId, laminationData]);

    console.log("----slectedlamination", selectedLamination)

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
                                <p className='selected-size'>{orderConfig?.size?.width} X {orderConfig?.size?.height}"  print</p>
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
                                            <div className="lamination-thumb-wrapper">
                                                {/* Skeleton */}
                                                {!imageLoadedMap[Lamination._id] && (
                                                    <div className="lamination-thumb-skeleton" />
                                                )}

                                                {/* Image */}
                                                <img
                                                    src={Lamination?.thumbnailUrl}
                                                    alt="lamination-img"
                                                    className={`lamination-thumb-image ${imageLoadedMap[Lamination._id] ? 'visible' : 'hidden'
                                                        }`}
                                                    onLoad={() => handleImageLoaded(Lamination._id)}
                                                />
                                            </div>

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

                                        <div className="lamination-title-row">
                                            <span className="lamination-card-name">
                                                {Lamination.optionName}
                                            </span>

                                            {!isNoLamination &&
                                                <div className="tooltip-wrapper">
                                                    <TooltipHoverIcon />
                                                    <div className="tooltip-content">
                                                        {Lamination.durabilityAndCleaningNotes || "No Info"}
                                                    </div>
                                                </div>
                                            }
                                        </div>
                                        {
                                            !isNoLamination && <div className="paper-card-tags">
                                                <span className="lamination-tag">{Lamination.finish}</span>
                                            </div>}

                                        <span className="lamination-card-description">{Lamination.durabilityAndCleaningNotes}</span>

                                        {/* Feature pills */}
                                        {Lamination.shortDescription && (
                                            <div className="lamination-features">
                                                {Lamination.shortDescription
                                                    .split(",")                // split by comma
                                                    .map(item => item.trim())  // remove extra spaces
                                                    .filter(Boolean)           // remove empty strings
                                                    .map((feature, idx) => (
                                                        <span key={idx} className="lamination-pill">
                                                            {feature}
                                                        </span>
                                                    ))}
                                            </div>
                                        )}


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
                                                    +{Math.abs(Lamination.priceDeltaMinor)}
                                                    {Lamination.priceDeltaMinor > 0 ? ' %' : ''}
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
                                disabled={!laminationData.length}
                                onClick={() => {
                                    // if (!selectedLamination) return;
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

