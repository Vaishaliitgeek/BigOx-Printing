// printData.js

// Dummy data for print sizes and papers

export const PRINT_SIZES = [
  { id: 's1', label: '8×10"', width: 8, height: 10, basePrice: 24 },
  { id: 's2', label: '11×14"', width: 11, height: 14, basePrice: 38 },
  { id: 's3', label: '12×18"', width: 12, height: 18, basePrice: 48 },
  { id: 's4', label: '16×20"', width: 16, height: 20, basePrice: 68 },
  { id: 's5', label: '18×24"', width: 18, height: 24, basePrice: 88 },
  { id: 's6', label: '20×30"', width: 20, height: 30, basePrice: 118 },
  { id: 's7', label: '24×36"', width: 24, height: 36, basePrice: 168 },
];

export const PAPERS = [
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

export const BORDER_OPTIONS = [
  { id: 'none', label: 'No Border', value: 0 },
  { id: 'quarter', label: '¼"', value: 0.25 },
  { id: 'half', label: '½"', value: 0.5 },
  { id: 'one', label: '1"', value: 1 },
  { id: 'two', label: '2"', value: 2 },
];

// calculate min PPI for a given print size
export function calculatePPI(imageWidth, imageHeight, printWidth, printHeight) {
  const ppiWidth = imageWidth / printWidth;
  const ppiHeight = imageHeight / printHeight;
  return Math.min(ppiWidth, ppiHeight);
}

// quality buckets
export function getQualityLevel(ppi) {
  if (ppi >= 180) return 'excellent';
  if (ppi >= 150) return 'good';
  return 'poor';
}

// map quality to a color key (you can match these to CSS classes)
export function getQualityColor(quality) {
  switch (quality) {
    case 'excellent':
      return 'green'; // e.g. green
    case 'good':
      return 'orange'; // e.g. orange
    case 'poor':
      return 'red'; // e.g. red
    default:
      return 'muted';
  }
}
