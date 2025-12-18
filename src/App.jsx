// import { useState } from 'react'
// // import reactLogo from './assets/react.svg'
// // import viteLogo from '/vite.svg'
// import './App.css'
// import Homepage from './pages/Homepage'
// import Upload from './pages/Upload'
// import Header from './pages/Header/Header'
// import Size from './pages/Size'
// import Paper from './pages/Paper'
// import Finish from './pages/Finish'
// function App() {

//   return (
//     <div className="container bg-black" >
//       {/* <Homepage /> */}
//       <Header />
//       <Upload />
//       <Size />
//       <Paper />
//       <Finish />
//     </div>
//   )
// }

// export default App
// App.jsx
import { PRINT_SIZES, calculatePPI, getQualityLevel, getQualityColor, PAPERS } from "./pages/printData";

import { useState } from 'react'
import './App.css'

import Upload from './components/costomizer/upload/Upload.jsx'
import Size from './components/costomizer/CropAndPosition/Size.jsx'
import Paper from './components/costomizer/Paper/Paper'
import Header from './components/Header/Header'
import StepFinish from './components/costomizer/finish/StepFinish.jsx'

function App() {
  const [currentStep, setCurrentStep] = useState(1) // 1 = Upload
  const [selectedSizeId, setSelectedSizeId] = useState(PRINT_SIZES[0].id);
  const [selectedPaperId, setSelectedPaperId] = useState(PAPERS[0].id);
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1600&q=80");
  const [borderSize, setBorderSize] = useState("none");
  const [quantity, setQuantity] = useState(1);

  const handleBorderChange = (newBorderSize) => {
    setBorderSize(newBorderSize);
  };

  const handleQuantityChange = (newQuantity) => {
    setQuantity(newQuantity);
  };

  const goToStep = (step) => {
    if (step < 1 || step > 4) return
    setCurrentStep(step)
  }

  const handleBack = () => {
    // Go back one step (or do something like "Back to Product" here)
    setCurrentStep((prev) => (prev > 1 ? prev - 1 : prev))
  }

  const handleClose = () => {
    // Example: reset to first step or navigate to Homepage
    setCurrentStep(1)
    // or if you want Homepage: render <Homepage /> conditionally instead
  }

  const handleNext = () => {
    console.log("------runn")
    setCurrentStep((prev) => (prev < 4 ? prev + 1 : prev))
  }

  return (
    <div className="Appcontainer">
      <Header
        currentStep={currentStep}
        onBack={handleBack}
        onClose={handleClose}
        onStepClick={goToStep} // optional if you want clicking circles to jump
      />

      {/* Render only the active step */}
      {currentStep === 1 && (
        <>
          <Upload handleNext={handleNext} />
          {/* <button onClick={handleNext}>Next</button> */}
        </>
      )}

      {currentStep === 2 && (
        <>
          <Size handleBack={handleBack} handleNext={handleNext} />
          {/* <div>
            <button onClick={handleBack}>Back</button>
            <button onClick={handleNext}>Next</button>
          </div> */}
        </>
      )}

      {currentStep === 3 && (
        <>
          <Paper handleBack={handleBack} handleNext={handleNext} />
          <div>
            {/* <button onClick={handleBack}>Back</button>
            <button onClick={handleNext}>Next</button> */}
          </div>
        </>
      )}

      {currentStep === 4 && (
        <>
          <StepFinish
            imageUrl={imageUrl}
            selectedSizeId={selectedSizeId}
            selectedPaperId={selectedPaperId}
            borderSize={borderSize}
            quantity={quantity}
            onBorderChange={handleBorderChange}
            onQuantityChange={handleQuantityChange}
          />
          {/* <button onClick={handleBack}>Back</button> */}
        </>
      )}
    </div>
  )
}

export default App
