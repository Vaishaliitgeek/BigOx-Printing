// import React from 'react';
// // import { X } from 'lucide-react';
// import './UploadPreview.css';
// // import Image from '../assets/Container.jpg';
// import Image from '../../assets/Container.jpg'

// const PPI_RANGES = [
//     { size: '8×10"', minPpi: 300, currentPpi: 365 },
//     { size: '11×14"', minPpi: 250, currentPpi: 281 },
//     { size: '16×20"', minPpi: 200, currentPpi: 182 },
//     { size: '24×36"', minPpi: 150, currentPpi: 101 },
// ];

// const UploadPreview = () => {
//     const [file] = React.useState({
//         name: 'dark-car-highway-evening-drive-summer-scenery.jpg',
//         size: '4.2 MB',
//         width: 5472,
//         height: 3648,
//         url: '',
//     });

//     const getPpiClass = (ppi) => {
//         if (ppi >= 300) return 'ppi-good';
//         if (ppi >= 200) return 'ppi-warning';
//         return 'ppi-bad';
//     };

//     return (
//         <div className="upload-preview-page">
//             <div className="upload-preview-wrapper">
//                 {/* Title */}
//                 <div className="upload-header">
//                     <h1 className="upload-title">Upload Your Image</h1>
//                     <p className="upload-subtitle">
//                         JPG, PNG, or TIFF up to 1 GB. We'll check the resolution for your chosen size.
//                     </p>
//                 </div>

//                 {/* File Chip */}
//                 <div className="file-chip">
//                     <div className="file-chip-left">
//                         <div className="file-icon-placeholder">
//                             {/* You can put an icon or thumbnail here if needed */}
//                         </div>
//                         <div>
//                             <p className="file-name">
//                                 {file.name}
//                             </p>
//                             <p className="file-meta">
//                                 {file.width} × {file.height} px · {file.size}
//                             </p>
//                         </div>
//                     </div>
//                     <button className="file-chip-close">
//                         {/* <X className="file-chip-close-icon" /> */}
//                     </button>
//                 </div>

//                 {/* Image Preview */}
//                 <div className="image-preview-container">
//                     <div className="image-preview-inner">
//                         <img
//                             src={Image}
//                             alt="Preview"
//                             className="image-preview"
//                         />
//                     </div>
//                 </div>

//                 {/* Resolution Table */}
//                 <div className="ppi-card">
//                     <p className="ppi-title">
//                         Estimated resolution at common sizes:
//                     </p>

//                     <div className="ppi-grid">
//                         {PPI_RANGES.map((item) => (
//                             <div
//                                 key={item.size}
//                                 className={
//                                     'ppi-item ' +
//                                     (item.currentPpi < item.minPpi
//                                         ? 'ppi-item-low'
//                                         : 'ppi-item-ok')
//                                 }
//                             >
//                                 <p className="ppi-size">
//                                     {item.size}
//                                 </p>
//                                 <p className={`ppi-value ${getPpiClass(item.currentPpi)}`}>
//                                     {item.currentPpi} PPI
//                                 </p>
//                             </div>
//                         ))}
//                     </div>

//                     <p className="ppi-note">
//                         We recommend 250 PPI for best print quality. You’ll be able to select acceptable sizes in the next step.
//                     </p>
//                 </div>

//                 {/* Continue Button */}
//                 <div className="upload-footer">
//                     <button className="upload-continue-btn">
//                         Continue to Size & Crop
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default UploadPreview;
// --
// components/UploadPreview.jsx
import React, { useEffect, useState } from 'react';
import './UploadPreview.css';
import fallbackImage from '../../assets/Container.jpg';

const PPI_RANGES = [
    { size: '8×10"', minPpi: 300, currentPpi: 365 },
    { size: '11×14"', minPpi: 250, currentPpi: 281 },
    { size: '16×20"', minPpi: 200, currentPpi: 182 },
    { size: '24×36"', minPpi: 150, currentPpi: 101 },
];

const UploadPreview = ({ file, onBackToUpload, onContinue }) => {
    const [previewUrl, setPreviewUrl] = useState(fallbackImage);

    useEffect(() => {
        if (!file) return;

        const url = URL.createObjectURL(file);
        setPreviewUrl(url);

        // cleanup
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const getPpiClass = (ppi) => {
        if (ppi >= 300) return 'ppi-good';
        if (ppi >= 200) return 'ppi-warning';
        return 'ppi-bad';
    };

    const formatBytes = (bytes) => {
        if (!bytes) return '';
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(1)} MB`;
    };

    return (
        <div className="upload-preview-page">
            <div className="upload-preview-wrapper">
                {/* Title */}
                <div className="upload-header">
                    <h1 className="upload-title">Upload Your Image</h1>
                    <p className="upload-subtitle">
                        JPG, PNG, or TIFF up to 1 GB. We'll check the resolution for your chosen size.
                    </p>
                </div>

                {/* File Chip */}
                <div className="file-chip">
                    <div className="file-chip-left">
                        <div className="file-icon-placeholder" />
                        <div>
                            <p className="file-name">
                                {file?.name || 'No file'}
                            </p>
                            <p className="file-meta">
                                {/* We don't have real width/height yet, so just show size */}
                                {formatBytes(file?.size)}
                            </p>
                        </div>
                    </div>
                    <button
                        className="file-chip-close"
                        onClick={onBackToUpload}
                        title="Remove file"
                    >
                        {/* You can put an X icon here if you like */}
                    </button>
                </div>

                {/* Image Preview */}
                <div className="image-preview-container">
                    <div className="image-preview-inner">
                        <img
                            src={previewUrl}
                            alt="Preview"
                            className="image-preview"
                        />
                    </div>
                </div>

                {/* Resolution Table */}
                <div className="ppi-card">
                    <p className="ppi-title">
                        Estimated resolution at common sizes:
                    </p>

                    <div className="ppi-grid">
                        {PPI_RANGES.map((item) => (
                            <div
                                key={item.size}
                                className={
                                    'ppi-item ' +
                                    (item.currentPpi < item.minPpi
                                        ? 'ppi-item-low'
                                        : 'ppi-item-ok')
                                }
                            >
                                <p className="ppi-size">
                                    {item.size}
                                </p>
                                <p className={`ppi-value ${getPpiClass(item.currentPpi)}`}>
                                    {item.currentPpi} PPI
                                </p>
                            </div>
                        ))}
                    </div>

                    <p className="ppi-note">
                        We recommend 250 PPI for best print quality. You’ll be able to select acceptable sizes in the next step.
                    </p>
                </div>

                {/* Continue Button */}
                <div className="upload-footer">
                    <button
                        className="upload-continue-btn"
                        onClick={onContinue}
                    >
                        Continue to Size & Crop
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UploadPreview;
    