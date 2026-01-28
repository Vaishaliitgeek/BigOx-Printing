import React, { useState, useRef, useEffect, useMemo } from 'react';
import './Mounting.css';
import { getMountingOptions } from '../../../services/services';
import { TooltipHoverIcon } from '../../../utils/CustomIcon';
import { loadCropImageFromDb } from '../../../services/indexDb';


// --- IndexedDB helpers (same DB as in Upload) ---
const DB_NAME = 'image-db';
const DB_VERSION = 1;
const STORE_NAME = 'images';
const CURRENT_IMAGE_KEY = 'current-image';
const CROP_IMAGE_KEY = "crop-image";



// --- Component ---
const NO_MOUNTING_OPTION = {
    _id: "no-mounting",
    optionName: "No Mounting",
    shortDescription:
        "Print only, ready for your own mounting or framing solution.",
    AdditionalNotes: "Custom framing, portfolio work",
    priceDeltaMinor: 0,
    isFrontendOnly: true,
};


const Mounting = ({ handleBack, handleNext, template, orderConfig }) => {
    console.log("-orderconfig", orderConfig)

    const [imageSrc, setImageSrc] = useState(null);

    const [selectedMountingId, setselectedMountingId] = useState(orderConfig?.mounting?.id ?? "no-mounting");

    const [mountingData, setMountingData] = useState([]);

    // fetching mounting data from api

    const MountingData = useMemo(() => {
        const active = (template?.mountingOptions || []).filter(
            (mounting) => mounting.status === true
        );

        return [NO_MOUNTING_OPTION, ...active];
    }, [template?.mountingOptions]);

    useEffect(() => {
        const getMountingData = async () => {
            try {
                // const res = await getMountingOptions();

                // if (!res) {
                //     console.log("Failed to fetch mounting data")
                // }
                setMountingData(MountingData);
                // console.log(res)
            } catch (error) {
                console.log(error.message);
            }
        };

        getMountingData();
    }, [])


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
    // initial load



    // selected data to send
    // const selectedMounting = mountingData.find(
    //     (m) => m._id === selectedMountingId
    // );

    // const selectedMounting = useMemo(
    //     () => mountingData?.find((m) => m._id === selectedMountingId) ?? mountingData[0],
    //     [selectedMountingId]
    // );

    const selectedMounting = useMemo(() => {
        if (!mountingData.length) return null;

        return (
            mountingData.find(m => m._id === selectedMountingId) ||
            mountingData[0]
        );
    }, [selectedMountingId, mountingData]);

    const [imageLoadedMap, setImageLoadedMap] = useState({});

    const handleImageLoaded = (id) => {
        setImageLoadedMap(prev => ({
            ...prev,
            [id]: true,
        }));
    };



    return (
        <div className="editor-page">
            <div className="editor-container">
                <div className="content">
                    {/* LEFT SIDE */}
                    <div className="editor-left">
                        <h2>Preview</h2>
                        <div className="editor-crop-area-paper">
                            <div className="mounting-editor-image-wrapper-paper" >
                                {imageSrc ? (
                                    <img
                                        src={imageSrc}
                                        alt="Preview"
                                        className="mounting-editor-image"
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
                                <p className='selected-size'>{orderConfig?.size?.width} X {orderConfig?.size?.height}" print print</p>
                            </div>
                        </div>
                        <div className='mounting-wrappper-text'>
                            <div className='mounting-text-heading'>Mounting Guide</div>
                            {/* <p> Lamination adds a protective layer to your print, making it more durable and resistant to scratches, moisture, and UV damage. Perfect for high-traffic areas or prints that won't be framed behind glass.
                            </p> */}
                            {
                                mountingData?.map((mounting) => {
                                    return <div className='mounting-guide-sub-wrapper'>
                                        <div className='mounting-text-option'>{mounting.optionName}:</div>
                                        <div className='mounting-text-desc'>{mounting.shortDescription.slice(0, 19)}</div>
                                    </div>

                                })
                            }
                        </div>

                    </div>

                    {/* RIGHT SIDE – PAPER GRID */}
                    <div className="editor-right">

                        <h2 className="editor-title-right">
                            Select Mounting
                        </h2>
                        <div className="mounting-grid">
                            {mountingData?.map((mounting) => {
                                const isNomounting = mounting._id === "no-mounting";
                                const isSelected = selectedMountingId === mounting._id;

                                return <div
                                    key={mounting._id}
                                    onClick={() => setselectedMountingId(mounting._id)}
                                    className={
                                        'mounting-card ' +
                                        (selectedMountingId == mounting._id ? 'mounting-card-selected' : '')
                                    }
                                >
                                    {/* Thumbnail area */}
                                    <div className="mounting-card-thumb">
                                        {/* you can swap this gradient for real sample images later */}
                                        {/* <div className="paper-card-thumb-art" /> */}

                                        {
                                            !isNomounting &&
                                            // <img src={mounting?.thumbnailUrl} alt='mounting-img' height={80} width={80}></img>
                                            <div className="mounting-thumb-wrapper">
                                                {/* Skeleton */}
                                                {!imageLoadedMap[mounting._id] && (
                                                    <div className="mounting-thumb-skeleton" />
                                                )}

                                                {/* Image */}
                                                <img
                                                    src={
                                                        mounting?.thumbnailUrl ||
                                                        "https://viviaprint.com/products/mounted-matte-on-black-foamcore/main-mounted-matte-black-foamcore-vivia-print.jpg"
                                                    }
                                                    alt="mounting-img"
                                                    className={`mounting-thumb-image ${imageLoadedMap[mounting._id] ? "visible" : "hidden"
                                                        }`}
                                                    onLoad={() => handleImageLoaded(mounting._id)}
                                                />
                                            </div>

                                        }
                                        <div className="mounting-card-radio">
                                            {isSelected && (
                                                <div className="mounting-card-radio-outer">

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
                                    <div className="mounting-card-body">
                                        <div className="mounting-card-name-row">
                                            <span className="mounting-card-name">
                                                {mounting.optionName}
                                            </span>

                                            {(!isNomounting && (mounting.AdditionalNotes || mounting.shortDescription)) && (
                                                <div className="tooltip-wrapper">
                                                    <TooltipHoverIcon />

                                                    <div className="tooltip-content">
                                                        {mounting.AdditionalNotes || "No Info"}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {
                                            !isNomounting && <div className="paper-card-tags">
                                                <span className="mounting-tag">{mounting.substrateType}</span>
                                                {/* <span className="mounting-tag">{mounting.maxSize.width}/{mounting.maxSize.height}"</span> */}
                                                <span className="mounting-tag">{mounting.thickness}"</span>

                                            </div>}

                                        <span className="mounting-card-description">{mounting.shortDescription}</span>
                                        <span>
                                            <span className='mounting-card-description'> Best For : </span>
                                            <span className="mounting-card-description-bestfor mounting-card-description">{mounting?.AdditionalNotes}</span>
                                        </span>
                                        {/* {
                                            isNomounting &&
                                            <span>
                                                <span className='mounting-card-description'> Best For : </span>
                                                <span className="mounting-card-description-bestfor mounting-card-description">{mounting.AdditionalNotes}</span>
                                            </span>

                                        } */}

                                        {
                                            !isNomounting &&
                                            <div className="paper-card-price-row">
                                                <span
                                                    className={
                                                        'paper-price-adjust ' +
                                                        (mounting.priceDeltaMinor < 0
                                                            ? 'paper-price-adjust-down'
                                                            : '')
                                                    }
                                                >
                                                    {mounting.priceDeltaMinor > 0 ? '+ $' : '- $'}
                                                    {Math.abs(mounting.priceDeltaMinor)}
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
                                className={`footer-btn footer-btn-primary ${!selectedMounting ? "footer-btn-disabled" : ""
                                    }`}
                                disabled={!mountingData.length}
                                onClick={() => {
                                    // if (!selectedMounting) return;

                                    handleNext({
                                        mounting: {
                                            id: selectedMounting.isFrontendOnly
                                                ? null
                                                : selectedMounting._id,
                                            name: selectedMounting.optionName,
                                            substrateType: selectedMounting.substrateType || null,
                                            thickness: selectedMounting.thickness || null,
                                            price: selectedMounting.priceDeltaMinor || 0,
                                            notes: selectedMounting.AdditionalNotes,
                                            isNone: selectedMounting.isFrontendOnly === true,
                                        },
                                    });
                                }}
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

export default Mounting;

