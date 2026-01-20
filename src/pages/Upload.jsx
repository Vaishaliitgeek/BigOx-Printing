import React, { useState, useRef } from 'react';
// import { UploadCloud } from 'lucide-react';
// import '../App.css'
// import './Upload.css';
import { IoCloudUploadOutline } from "react-icons/io5";

const Upload = () => {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState(null); // File state
    const fileInputRef = useRef(null); // Reference for file input

    // Handle drag over event
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    // Handle drag leave event
    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    // Handle file drop event
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && isValidFile(droppedFile)) {
            setFile(droppedFile);
            // console.log('File dropped:', droppedFile);
        }
    };

    // Trigger file input on div click
    const handleClick = (e) => {
        e.stopPropagation(); // Prevent the event from bubbling up
        fileInputRef.current?.click(); // Trigger the file input
    };

    // Handle file change (from file input)
    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && isValidFile(selectedFile)) {
            setFile(selectedFile);
            // console.log('File selected:', selectedFile);
        }
    };

    // Validate the selected file
    const isValidFile = (selectedFile) => {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff', 'image/tif'];
        const maxSize = 1 * 1024 * 1024 * 1024; // 1GB

        if (!validTypes.includes(selectedFile.type)) {
            alert('Please upload JPG, PNG, or TIFF only');
            return false;
        }
        if (selectedFile.size > maxSize) {
            alert('File size must be under 1GB');
            return false;
        }
        return true;
    };

    return (
        <div className="upload-page">
            <div className="upload-container">
                <h1 className="upload-title">
                    Upload Your Image
                </h1>

                <p className="upload-subtitle">
                    JPG, PNG, or TIFF up to 1 GB. We'll check the resolution for your chosen size.
                </p>

                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleClick}
                    className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
                >
                    {/* Hidden native file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/tiff,image/tif"
                        onChange={handleFileChange}
                        className="upload-input"
                    />

                    <div className="upload-content">
                        <IoCloudUploadOutline className="upload-icon" />
                        {/* <UploadCloud className="upload-icon" strokeWidth={1.5} /> */}

                        <p className="upload-text">
                            {isDragging ? (
                                'Drop your image here...'
                            ) : (
                                <>
                                    Drag and drop your image here, or{' '}
                                    <span className="upload-browse-text">
                                        browse
                                    </span>
                                </>
                            )}
                        </p>

                        <p className="upload-hint">
                            JPG, PNG, TIFF · Max 1 GB
                        </p>

                        {file && (
                            <div className="upload-selected-file">
                                Selected: {file.name}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Upload;

