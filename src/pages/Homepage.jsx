import React from 'react';
import image from '../assets/Container.jpg';


const Homepage = () => {
    return (
        <div className="homepage">
            {/* Header */}

            {/* Main Content Container */}
            <div className="content-container">
                <div className="grid-container">
                    {/* Left Side - Image */}
                    <div className="left-side">
                        <div className="image-container">
                            <img
                                src='https://cdn.shopify.com/s/files/1/0579/9667/3222/files/mens-box-tee-vintage-black-front-68d14a55db011.jpg?v=1758546530'
                                alt="Botanical Art Print"
                                className="image"
                            />
                        </div>
                    </div>

                    {/* Right Side - Product Details */}
                    <div className="right-side">
                        {/* Product Category */}
                        <div>
                            <p className="product-category text-red-600">BigOx Printing</p>
                            <h2 className="product-title">Giclée Fine Art Prints</h2>
                        </div>

                        {/* Product Description */}
                        <p className="product-description">
                            Museum-quality prints on premium fine art papers. Each print is carefully crafted
                            to showcase your work with stunning detail and color accuracy.
                        </p>

                        {/* Price */}
                        <div>
                            <p className="price-label">Starting at</p>
                            <p className="price">$24.00</p>
                        </div>

                        {/* CTA Button */}
                        <button className="cta-button">
                            Create Your Print
                        </button>

                        {/* Features List */}
                        <div className="features-list">
                            <div>
                                <h3 className="feature-title">Premium Materials</h3>
                                <p className="feature-description">Choose from 8+ museum-grade fine art papers</p>
                            </div>

                            <div>
                                <h3 className="feature-title">Custom Sizing</h3>
                                <p className="feature-description">7 standard sizes from 8×10 to 24×36</p>
                            </div>

                            <div>
                                <h3 className="feature-title">Quality Assured</h3>
                                <p className="feature-description">Real-time resolution validation for perfect prints</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Notice Bar */}
            <div className="notice-bar">
                <div className="notice-container">
                    <div className="notice-content">
                        <div className="notice-left">
                            <svg className="notice-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span className="notice-text">You can only view and comment on this file.</span>
                        </div>
                        <div className="notice-right">
                            <button className="ask-to-edit-button">
                                Ask to edit
                            </button>
                            <button className="close-button">
                                <svg className="close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Homepage;
