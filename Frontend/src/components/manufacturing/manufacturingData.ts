export type RawMaterialRecipeItem = {
  rawMaterialName: string;
  packagingType: string;
  level2: string;
  level3: string;
  colorOfSandEpoxy: string;
  materialQuantity: string;
  materialUnit: string;
};

export const epoxyColors = [
  "Deep Safayar",
  "Light Grey",
  "Slate Grey",
  "Ivory",
  "White",
  "Coffee Brown",
  "Dark Grey",
  "Black",
  "Harvest Gold",
  "English Walnut",
  "Dhaulpur Pink",
  "Redwood",
];

export const groutProducts = [
  "300 kg White cement grout",
  "Ivory 300kg",
  "300 kg Black cement grout",
  "150 kg coffee brown grout",
  "150 kg light grey grout",
  "150 kg  grey grout",
  "150 kg RED grout",
  "150 kg BLUE grout",
  "150 kg GREEN grout",
  "150 kg YELLOW grout",
];

export const epoxyProducts = [
  "White epoxy",
  "Black epoxy",
  "Ivory epoxy",
  "Deep safayar epoxy",
  "Slate greyepoxy",
  "Light grey epoxy",
  "Dark grey epoxy",
  "Coffee brown epoxy",
  "Harvest Gold epoxy",
  "English walnut epoxy",
  "Dhaulpur pink epoxy",
  "Redwood epoxy",
];

export const epoxyProductColorMap: Record<string, string> = {
  "White epoxy": "White",
  "Black epoxy": "Black",
  "Ivory epoxy": "Ivory",
  "Deep safayar epoxy": "Deep Safayar",
  "Slate greyepoxy": "Slate Grey",
  "Light grey epoxy": "Light Grey",
  "Dark grey epoxy": "Dark Grey",
  "Coffee brown epoxy": "Coffee Brown",
  "Harvest Gold epoxy": "Harvest Gold",
  "English walnut epoxy": "English Walnut",
  "Dhaulpur pink epoxy": "Dhaulpur Pink",
  "Redwood epoxy": "Redwood",
};

export const groutProductColorMap: Record<string, string> = {
  "300 kg White cement grout": "White",
  "Ivory 300kg": "Ivory",
  "300 kg Black cement grout": "Black",
  "150 kg coffee brown grout": "Coffee Brown",
  "150 kg light grey grout": "Light Grey",
  "150 kg  grey grout": "Grey",
  "150 kg RED grout": "Red",
  "150 kg BLUE grout": "Blue",
  "150 kg GREEN grout": "Green",
  "150 kg YELLOW grout": "Yellow",
};

export const groutRecipes: Record<string, RawMaterialRecipeItem[]> = {
  "300 kg White cement grout": [
    { rawMaterialName: "Cement", packagingType: "White Cement", level2: "Bag", level3: "", colorOfSandEpoxy: "", materialQuantity: "180", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Grout", level2: "Calcium Carbonate", level3: "", colorOfSandEpoxy: "", materialQuantity: "120", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Adhesive", level2: "K50", level3: "", colorOfSandEpoxy: "", materialQuantity: "4", materialUnit: "kg" },
  ],
  "Ivory 300kg": [
    { rawMaterialName: "Cement", packagingType: "White Cement", level2: "", level3: "", colorOfSandEpoxy: "", materialQuantity: "180", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Grout", level2: "Calcium Carbonate", level3: "", colorOfSandEpoxy: "", materialQuantity: "120", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Adhesive", level2: "K50", level3: "", colorOfSandEpoxy: "", materialQuantity: "4", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Grout", level2: "Yellow Pigment", level3: "", colorOfSandEpoxy: "", materialQuantity: "100", materialUnit: "gm" },
  ],
  "300 kg Black cement grout": [
    { rawMaterialName: "Cement", packagingType: "PPC", level2: "Bag", level3: "", colorOfSandEpoxy: "", materialQuantity: "180", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Grout", level2: "Calcium Carbonate", level3: "", colorOfSandEpoxy: "", materialQuantity: "120", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Adhesive", level2: "K50", level3: "", colorOfSandEpoxy: "", materialQuantity: "4", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Grout", level2: "Black Pigment", level3: "", colorOfSandEpoxy: "", materialQuantity: "3500", materialUnit: "gm" },
  ],
  "150 kg coffee brown grout": [
    { rawMaterialName: "Cement", packagingType: "White Cement", level2: "Bag", level3: "", colorOfSandEpoxy: "", materialQuantity: "70", materialUnit: "kg" },
    { rawMaterialName: "Cement", packagingType: "PPC", level2: "Bag", level3: "", colorOfSandEpoxy: "", materialQuantity: "20", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Grout", level2: "Calcium Carbonate", level3: "", colorOfSandEpoxy: "", materialQuantity: "60", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Adhesive", level2: "K50", level3: "", colorOfSandEpoxy: "", materialQuantity: "2", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Grout", level2: "Red Pigment", level3: "", colorOfSandEpoxy: "", materialQuantity: "650", materialUnit: "gm" },
    { rawMaterialName: "Chemical", packagingType: "Tile Grout", level2: "Black Pigment", level3: "", colorOfSandEpoxy: "", materialQuantity: "700", materialUnit: "gm" },
  ],
  "150 kg light grey grout": [
    { rawMaterialName: "Cement", packagingType: "White Cement", level2: "Bag", level3: "", colorOfSandEpoxy: "", materialQuantity: "90", materialUnit: "kg" },
    { rawMaterialName: "Cement", packagingType: "PPC", level2: "Bag", level3: "", colorOfSandEpoxy: "", materialQuantity: "20", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Grout", level2: "Calcium Carbonate", level3: "", colorOfSandEpoxy: "", materialQuantity: "60", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Adhesive", level2: "K50", level3: "", colorOfSandEpoxy: "", materialQuantity: "2", materialUnit: "kg" },
  ],
  "150 kg grey grout": [
    { rawMaterialName: "Cement", packagingType: "PPC", level2: "Bag", level3: "", colorOfSandEpoxy: "", materialQuantity: "50", materialUnit: "kg" },
    { rawMaterialName: "Cement", packagingType: "White Cement", level2: "Bag", level3: "", colorOfSandEpoxy: "", materialQuantity: "70", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Grout", level2: "Calcium Carbonate", level3: "", colorOfSandEpoxy: "", materialQuantity: "60", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Adhesive", level2: "K50", level3: "", colorOfSandEpoxy: "", materialQuantity: "2", materialUnit: "kg" },
  ],
  "150 kg RED grout": [
    { rawMaterialName: "Cement", packagingType: "White Cement", level2: "Bag", level3: "", colorOfSandEpoxy: "", materialQuantity: "100", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Grout", level2: "Calcium Carbonate", level3: "", colorOfSandEpoxy: "", materialQuantity: "50", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Adhesive", level2: "K50", level3: "", colorOfSandEpoxy: "", materialQuantity: "1.5", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Grout", level2: "Red Pigment", level3: "", colorOfSandEpoxy: "", materialQuantity: "900", materialUnit: "gm" },
  ],
  "150 kg BLUE grout": [
    { rawMaterialName: "Cement", packagingType: "White Cement", level2: "Bag", level3: "", colorOfSandEpoxy: "", materialQuantity: "100", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Grout", level2: "Calcium Carbonate", level3: "", colorOfSandEpoxy: "", materialQuantity: "50", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Adhesive", level2: "K50", level3: "", colorOfSandEpoxy: "", materialQuantity: "1.5", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Grout", level2: "Blue Pigment", level3: "", colorOfSandEpoxy: "", materialQuantity: "2000", materialUnit: "gm" },
  ],
  "150 kg GREEN grout": [
    { rawMaterialName: "Cement", packagingType: "White Cement", level2: "Bag", level3: "", colorOfSandEpoxy: "", materialQuantity: "100", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Grout", level2: "Calcium Carbonate", level3: "", colorOfSandEpoxy: "", materialQuantity: "50", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Adhesive", level2: "K50", level3: "", colorOfSandEpoxy: "", materialQuantity: "1.5", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Grout", level2: "Blue Pigment", level3: "", colorOfSandEpoxy: "", materialQuantity: "1550", materialUnit: "gm" },
    { rawMaterialName: "Chemical", packagingType: "Tile Adhesive", level2: "K50", level3: "", colorOfSandEpoxy: "", materialQuantity: "450", materialUnit: "gm" },
  ],
  "150 kg YELLOW grout": [
    { rawMaterialName: "Cement", packagingType: "White Cement", level2: "Bag", level3: "", colorOfSandEpoxy: "", materialQuantity: "100", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Grout", level2: "Calcium Carbonate", level3: "", colorOfSandEpoxy: "", materialQuantity: "50", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Adhesive", level2: "K50", level3: "", colorOfSandEpoxy: "", materialQuantity: "1.5", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Grout", level2: "Yellow Pigment", level3: "", colorOfSandEpoxy: "", materialQuantity: "500", materialUnit: "gm" },
  ],
};

export const epoxyRecipes: Record<string, RawMaterialRecipeItem[]> = {
  "White": [
    { rawMaterialName: "Chemical", packagingType: "Epoxy", level2: "Resin", level3: "", colorOfSandEpoxy: "", materialQuantity: "12.500", materialUnit: "kg" },
    { rawMaterialName: "Packaging", packagingType: "FG", level2: "Epoxy", level3: "Coloured Sand", colorOfSandEpoxy: "White", materialQuantity: "50", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Epoxy", level2: "Byk", level3: "", colorOfSandEpoxy: "", materialQuantity: "60", materialUnit: "gm" },
    { rawMaterialName: "Chemical", packagingType: "Epoxy", level2: "Benton", level3: "", colorOfSandEpoxy: "", materialQuantity: "60", materialUnit: "gm" },
  ],
  "Black": [
    { rawMaterialName: "Chemical", packagingType: "Epoxy", level2: "Resin", level3: "", colorOfSandEpoxy: "", materialQuantity: "12.500", materialUnit: "kg" },
    { rawMaterialName: "Packaging", packagingType: "FG", level2: "Epoxy", level3: "Coloured Sand", colorOfSandEpoxy: "Black", materialQuantity: "50", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Epoxy", level2: "Byk", level3: "", colorOfSandEpoxy: "", materialQuantity: "60", materialUnit: "gm" },
    { rawMaterialName: "Chemical", packagingType: "Epoxy", level2: "Benton", level3: "", colorOfSandEpoxy: "", materialQuantity: "60", materialUnit: "gm" },
  ],
  "Ivory": [
    { rawMaterialName: "Chemical", packagingType: "Epoxy", level2: "Resin", level3: "", colorOfSandEpoxy: "", materialQuantity: "12.500", materialUnit: "kg" },
    { rawMaterialName: "Packaging", packagingType: "FG", level2: "Epoxy", level3: "Coloured Sand", colorOfSandEpoxy: "Ivory", materialQuantity: "50", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Epoxy", level2: "Byk", level3: "", colorOfSandEpoxy: "", materialQuantity: "60", materialUnit: "gm" },
    { rawMaterialName: "Chemical", packagingType: "Epoxy", level2: "Benton", level3: "", colorOfSandEpoxy: "", materialQuantity: "60", materialUnit: "gm" },
  ],
  "Deep Safayar": [
    { rawMaterialName: "Chemical", packagingType: "Epoxy", level2: "Resin", level3: "", colorOfSandEpoxy: "", materialQuantity: "12.500", materialUnit: "kg" },
    { rawMaterialName: "Packaging", packagingType: "FG", level2: "Epoxy", level3: "Coloured Sand", colorOfSandEpoxy: "Blue", materialQuantity: "50", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Epoxy", level2: "Byk", level3: "", colorOfSandEpoxy: "", materialQuantity: "60", materialUnit: "gm" },
    { rawMaterialName: "Chemical", packagingType: "Epoxy", level2: "Benton", level3: "", colorOfSandEpoxy: "", materialQuantity: "60", materialUnit: "gm" },
  ],
  "Slate Grey": [
    { rawMaterialName: "Chemical", packagingType: "Epoxy", level2: "Resin", level3: "", colorOfSandEpoxy: "", materialQuantity: "12.500", materialUnit: "kg" },
    { rawMaterialName: "Packaging", packagingType: "FG", level2: "Epoxy", level3: "Coloured Sand", colorOfSandEpoxy: "Slate Grey", materialQuantity: "50", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Epoxy", level2: "Byk", level3: "", colorOfSandEpoxy: "", materialQuantity: "60", materialUnit: "gm" },
    { rawMaterialName: "Chemical", packagingType: "Epoxy", level2: "Benton", level3: "", colorOfSandEpoxy: "", materialQuantity: "60", materialUnit: "gm" },
  ],
  "Light Grey": [
    { rawMaterialName: "Chemical", packagingType: "Epoxy", level2: "Resin", level3: "", colorOfSandEpoxy: "", materialQuantity: "12.500", materialUnit: "kg" },
    { rawMaterialName: "Packaging", packagingType: "FG", level2: "Epoxy", level3: "Coloured Sand", colorOfSandEpoxy: "Light Grey", materialQuantity: "50", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Epoxy", level2: "Byk", level3: "", colorOfSandEpoxy: "", materialQuantity: "60", materialUnit: "gm" },
    { rawMaterialName: "Chemical", packagingType: "Epoxy", level2: "Benton", level3: "", colorOfSandEpoxy: "", materialQuantity: "60", materialUnit: "gm" },
  ],
  "Dark Grey": [
    { rawMaterialName: "Chemical", packagingType: "Epoxy", level2: "Resin", level3: "", colorOfSandEpoxy: "", materialQuantity: "12.500", materialUnit: "kg" },
    { rawMaterialName: "Packaging", packagingType: "FG", level2: "Epoxy", level3: "Coloured Sand", colorOfSandEpoxy: "Dark Grey", materialQuantity: "50", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Epoxy", level2: "Byk", level3: "", colorOfSandEpoxy: "", materialQuantity: "60", materialUnit: "gm" },
    { rawMaterialName: "Chemical", packagingType: "Epoxy", level2: "Benton", level3: "", colorOfSandEpoxy: "", materialQuantity: "60", materialUnit: "gm" },
  ],
  "Coffee Brown": [
    { rawMaterialName: "Chemical", packagingType: "Epoxy", level2: "Resin", level3: "", colorOfSandEpoxy: "", materialQuantity: "12.500", materialUnit: "kg" },
    { rawMaterialName: "Packaging", packagingType: "FG", level2: "Epoxy", level3: "Coloured Sand", colorOfSandEpoxy: "Coffee Brown", materialQuantity: "50", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Epoxy", level2: "Byk", level3: "", colorOfSandEpoxy: "", materialQuantity: "60", materialUnit: "gm" },
    { rawMaterialName: "Chemical", packagingType: "Epoxy", level2: "Benton", level3: "", colorOfSandEpoxy: "", materialQuantity: "60", materialUnit: "gm" },
  ],
  "Harvest Gold": [
    { rawMaterialName: "Chemical", packagingType: "Epoxy", level2: "Resin", level3: "", colorOfSandEpoxy: "", materialQuantity: "12.500", materialUnit: "kg" },
    { rawMaterialName: "Packaging", packagingType: "FG", level2: "Epoxy", level3: "Coloured Sand", colorOfSandEpoxy: "Jaisalmer", materialQuantity: "50", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Epoxy", level2: "Byk", level3: "", colorOfSandEpoxy: "", materialQuantity: "60", materialUnit: "gm" },
    { rawMaterialName: "Chemical", packagingType: "Epoxy", level2: "Benton", level3: "", colorOfSandEpoxy: "", materialQuantity: "60", materialUnit: "gm" },
  ],
  "English Walnut": [
    { rawMaterialName: "Chemical", packagingType: "Epoxy", level2: "Resin", level3: "", colorOfSandEpoxy: "", materialQuantity: "12.500", materialUnit: "kg" },
    { rawMaterialName: "Packaging", packagingType: "FG", level2: "Epoxy", level3: "Coloured Sand", colorOfSandEpoxy: "Sabal", materialQuantity: "50", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Epoxy", level2: "Byk", level3: "", colorOfSandEpoxy: "", materialQuantity: "60", materialUnit: "gm" },
    { rawMaterialName: "Chemical", packagingType: "Epoxy", level2: "Benton", level3: "", colorOfSandEpoxy: "", materialQuantity: "60", materialUnit: "gm" },
  ],
  "Dhaulpur Pink": [
    { rawMaterialName: "Chemical", packagingType: "Epoxy", level2: "Resin", level3: "", colorOfSandEpoxy: "", materialQuantity: "12.500", materialUnit: "kg" },
    { rawMaterialName: "Packaging", packagingType: "FG", level2: "Epoxy", level3: "Coloured Sand", colorOfSandEpoxy: "Savetrane", materialQuantity: "50", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Epoxy", level2: "Byk", level3: "", colorOfSandEpoxy: "", materialQuantity: "60", materialUnit: "gm" },
    { rawMaterialName: "Chemical", packagingType: "Epoxy", level2: "Benton", level3: "", colorOfSandEpoxy: "", materialQuantity: "60", materialUnit: "gm" },
  ],
  "Redwood": [
    { rawMaterialName: "Chemical", packagingType: "Epoxy", level2: "Resin", level3: "", colorOfSandEpoxy: "", materialQuantity: "12.500", materialUnit: "kg" },
    { rawMaterialName: "Packaging", packagingType: "FG", level2: "Epoxy", level3: "Coloured Sand", colorOfSandEpoxy: "Terracotta", materialQuantity: "50", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Epoxy", level2: "Byk", level3: "", colorOfSandEpoxy: "", materialQuantity: "60", materialUnit: "gm" },
    { rawMaterialName: "Chemical", packagingType: "Epoxy", level2: "Benton", level3: "", colorOfSandEpoxy: "", materialQuantity: "60", materialUnit: "gm" },
  ],
};

export const tileCleanerRecipes: Record<string, RawMaterialRecipeItem[]> = {
  "Crystal X 1L": [
    { rawMaterialName: "Chemical", packagingType: "Tile Cleaner", level2: "Alcohol Ethoxylate", level3: "", colorOfSandEpoxy: "", materialQuantity: "60", materialUnit: "ml" },
    { rawMaterialName: "Chemical", packagingType: "Tile Cleaner", level2: "Sodium Gluconate", level3: "", colorOfSandEpoxy: "", materialQuantity: "25", materialUnit: "ml" },
    { rawMaterialName: "Chemical", packagingType: "Tile Cleaner", level2: "2-Butoxyethanol", level3: "", colorOfSandEpoxy: "", materialQuantity: "20", materialUnit: "ml" },
    { rawMaterialName: "Chemical", packagingType: "Tile Cleaner", level2: "Isopropyl Alcohol (IPA 99%)", level3: "", colorOfSandEpoxy: "", materialQuantity: "20", materialUnit: "ml" },
    { rawMaterialName: "Chemical", packagingType: "Tile Cleaner", level2: "Benzalkonium Chloride (BKC)", level3: "", colorOfSandEpoxy: "", materialQuantity: "5", materialUnit: "ml" },
    { rawMaterialName: "Chemical", packagingType: "Tile Cleaner", level2: "Premium Fragrance & Dye", level3: "", colorOfSandEpoxy: "", materialQuantity: "5", materialUnit: "ml" },
  ],
  "Crystal X 5L": [
    { rawMaterialName: "Chemical", packagingType: "Tile Cleaner", level2: "Alcohol Ethoxylate", level3: "", colorOfSandEpoxy: "", materialQuantity: "300", materialUnit: "ml" },
    { rawMaterialName: "Chemical", packagingType: "Tile Cleaner", level2: "Sodium Gluconate", level3: "", colorOfSandEpoxy: "", materialQuantity: "125", materialUnit: "ml" },
    { rawMaterialName: "Chemical", packagingType: "Tile Cleaner", level2: "2-Butoxyethanol", level3: "", colorOfSandEpoxy: "", materialQuantity: "100", materialUnit: "ml" },
    { rawMaterialName: "Chemical", packagingType: "Tile Cleaner", level2: "Isopropyl Alcohol (IPA 99%)", level3: "", colorOfSandEpoxy: "", materialQuantity: "100", materialUnit: "ml" },
    { rawMaterialName: "Chemical", packagingType: "Tile Cleaner", level2: "Benzalkonium Chloride (BKC)", level3: "", colorOfSandEpoxy: "", materialQuantity: "25", materialUnit: "ml" },
    { rawMaterialName: "Chemical", packagingType: "Tile Cleaner", level2: "Premium Fragrance & Dye", level3: "", colorOfSandEpoxy: "", materialQuantity: "25", materialUnit: "ml" },
  ],
  "Shine X 1L": [
    { rawMaterialName: "Chemical", packagingType: "Tile Cleaner", level2: "Urea (Technical Grade)", level3: "", colorOfSandEpoxy: "", materialQuantity: "30", materialUnit: "ml" },
    { rawMaterialName: "Chemical", packagingType: "Tile Cleaner", level2: "Sulphamic Acid", level3: "", colorOfSandEpoxy: "", materialQuantity: "35", materialUnit: "ml" },
    { rawMaterialName: "Chemical", packagingType: "Tile Cleaner", level2: "Hydrochloric Acid (32%)", level3: "", colorOfSandEpoxy: "", materialQuantity: "30", materialUnit: "ml" },
    { rawMaterialName: "Chemical", packagingType: "Tile Cleaner", level2: "Citric Acid", level3: "", colorOfSandEpoxy: "", materialQuantity: "20", materialUnit: "ml" },
    { rawMaterialName: "Chemical", packagingType: "Tile Cleaner", level2: "2-Butoxyethanol", level3: "", colorOfSandEpoxy: "", materialQuantity: "20", materialUnit: "ml" },
    { rawMaterialName: "Chemical", packagingType: "Tile Cleaner", level2: "Cocamidopropyl Betaine", level3: "", colorOfSandEpoxy: "", materialQuantity: "35", materialUnit: "ml" },
    { rawMaterialName: "Chemical", packagingType: "Tile Cleaner", level2: "Alphox-200", level3: "", colorOfSandEpoxy: "", materialQuantity: "20", materialUnit: "ml" },
    { rawMaterialName: "Chemical", packagingType: "Tile Cleaner", level2: "Xanthan Gum", level3: "", colorOfSandEpoxy: "", materialQuantity: "3", materialUnit: "ml" },
    { rawMaterialName: "Chemical", packagingType: "Tile Cleaner", level2: "Fragrance & Dye", level3: "", colorOfSandEpoxy: "", materialQuantity: "2", materialUnit: "ml" },
  ],
  "Shine X 5L": [
    { rawMaterialName: "Chemical", packagingType: "Tile Cleaner", level2: "Urea (Technical Grade)", level3: "", colorOfSandEpoxy: "", materialQuantity: "150", materialUnit: "ml" },
    { rawMaterialName: "Chemical", packagingType: "Tile Cleaner", level2: "Sulphamic Acid", level3: "", colorOfSandEpoxy: "", materialQuantity: "175", materialUnit: "ml" },
    { rawMaterialName: "Chemical", packagingType: "Tile Cleaner", level2: "Hydrochloric Acid (32%)", level3: "", colorOfSandEpoxy: "", materialQuantity: "150", materialUnit: "ml" },
    { rawMaterialName: "Chemical", packagingType: "Tile Cleaner", level2: "Citric Acid", level3: "", colorOfSandEpoxy: "", materialQuantity: "100", materialUnit: "ml" },
    { rawMaterialName: "Chemical", packagingType: "Tile Cleaner", level2: "2-Butoxyethanol", level3: "", colorOfSandEpoxy: "", materialQuantity: "100", materialUnit: "ml" },
    { rawMaterialName: "Chemical", packagingType: "Tile Cleaner", level2: "Cocamidopropyl Betaine", level3: "", colorOfSandEpoxy: "", materialQuantity: "175", materialUnit: "ml" },
    { rawMaterialName: "Chemical", packagingType: "Tile Cleaner", level2: "Alphox-200", level3: "", colorOfSandEpoxy: "", materialQuantity: "100", materialUnit: "ml" },
    { rawMaterialName: "Chemical", packagingType: "Tile Cleaner", level2: "Xanthan Gum", level3: "", colorOfSandEpoxy: "", materialQuantity: "15", materialUnit: "ml" },
    { rawMaterialName: "Chemical", packagingType: "Tile Cleaner", level2: "Fragrance & Dye", level3: "", colorOfSandEpoxy: "", materialQuantity: "10", materialUnit: "ml" },
  ],
};

export const bondureRecipes: RawMaterialRecipeItem[] = [
  { rawMaterialName: "Cement", packagingType: "PPC", level2: "Silo", level3: "", colorOfSandEpoxy: "", materialQuantity: "400", materialUnit: "kg" },
  { rawMaterialName: "Sand", packagingType: "Grey", level2: "Big (1200 micron)", level3: "", colorOfSandEpoxy: "", materialQuantity: "600", materialUnit: "kg" },
  { rawMaterialName: "Chemical", packagingType: "Tile Adhesive", level2: "K50", level3: "", colorOfSandEpoxy: "", materialQuantity: "4", materialUnit: "kg" },
];

export const tileAdhesiveRecipes: Record<string, Record<string, RawMaterialRecipeItem[]>> = {
  White: {
    "K90": [
      { rawMaterialName: "Cement", packagingType: "White Cement", level2: "Bag", level3: "", colorOfSandEpoxy: "", materialQuantity: "275", materialUnit: "kg" },
      { rawMaterialName: "Sand", packagingType: "White", level2: "", level3: "", colorOfSandEpoxy: "", materialQuantity: "225", materialUnit: "kg" },
      { rawMaterialName: "Chemical", packagingType: "Tile Adhesive", level2: "K50", level3: "", colorOfSandEpoxy: "", materialQuantity: "9", materialUnit: "kg" },
    ],
    "K80": [
      { rawMaterialName: "Cement", packagingType: "White Cement", level2: "Bag", level3: "", colorOfSandEpoxy: "", materialQuantity: "225", materialUnit: "kg" },
      { rawMaterialName: "Sand", packagingType: "White", level2: "", level3: "", colorOfSandEpoxy: "", materialQuantity: "275", materialUnit: "kg" },
      { rawMaterialName: "Chemical", packagingType: "Tile Adhesive", level2: "K80", level3: "", colorOfSandEpoxy: "", materialQuantity: "4.5", materialUnit: "kg" },
    ],
    "K60": [
      { rawMaterialName: "Cement", packagingType: "White Cement", level2: "Bag", level3: "", colorOfSandEpoxy: "", materialQuantity: "225", materialUnit: "kg" },
      { rawMaterialName: "Sand", packagingType: "White", level2: "", level3: "", colorOfSandEpoxy: "", materialQuantity: "275", materialUnit: "kg" },
      { rawMaterialName: "Chemical", packagingType: "Tile Adhesive", level2: "K60", level3: "", colorOfSandEpoxy: "", materialQuantity: "4.5", materialUnit: "kg" },
    ],
    "Kamdhenu X": [
      { rawMaterialName: "Cement", packagingType: "White Cement", level2: "Bag", level3: "", colorOfSandEpoxy: "", materialQuantity: "250", materialUnit: "kg" },
      { rawMaterialName: "Sand", packagingType: "White", level2: "", level3: "", colorOfSandEpoxy: "", materialQuantity: "225", materialUnit: "kg" },
      { rawMaterialName: "Chemical", packagingType: "Tile Adhesive", level2: "KX", level3: "", colorOfSandEpoxy: "", materialQuantity: "20", materialUnit: "kg" },
    ],
  },
  Grey: {
    "K90": [
      { rawMaterialName: "Cement", packagingType: "OPC", level2: "Silo", level3: "", colorOfSandEpoxy: "", materialQuantity: "550", materialUnit: "kg" },
      { rawMaterialName: "Sand", packagingType: "Grey", level2: "Small (600 micron)", level3: "", colorOfSandEpoxy: "", materialQuantity: "450", materialUnit: "kg" },
      { rawMaterialName: "Chemical", packagingType: "Tile Adhesive", level2: "K90", level3: "", colorOfSandEpoxy: "", materialQuantity: "18", materialUnit: "kg" },
    ],
    "K80": [
      { rawMaterialName: "Cement", packagingType: "PPC", level2: "Silo", level3: "", colorOfSandEpoxy: "", materialQuantity: "450", materialUnit: "kg" },
      { rawMaterialName: "Sand", packagingType: "Grey", level2: "Small (600 micron)", level3: "", colorOfSandEpoxy: "", materialQuantity: "550", materialUnit: "kg" },
      { rawMaterialName: "Chemical", packagingType: "Tile Adhesive", level2: "K80", level3: "", colorOfSandEpoxy: "", materialQuantity: "9", materialUnit: "kg" },
    ],
    "K60": [
      { rawMaterialName: "Cement", packagingType: "PPC", level2: "Silo", level3: "", colorOfSandEpoxy: "", materialQuantity: "450", materialUnit: "kg" },
      { rawMaterialName: "Sand", packagingType: "Grey", level2: "Small (600 micron)", level3: "", colorOfSandEpoxy: "", materialQuantity: "550", materialUnit: "kg" },
      { rawMaterialName: "Chemical", packagingType: "Tile Adhesive", level2: "K60", level3: "", colorOfSandEpoxy: "", materialQuantity: "9", materialUnit: "kg" },
    ],
    "K50": [
      { rawMaterialName: "Cement", packagingType: "PPC", level2: "Silo", level3: "", colorOfSandEpoxy: "", materialQuantity: "400", materialUnit: "kg" },
      { rawMaterialName: "Sand", packagingType: "Grey", level2: "Small (600 micron)", level3: "", colorOfSandEpoxy: "", materialQuantity: "600", materialUnit: "kg" },
      { rawMaterialName: "Chemical", packagingType: "Tile Adhesive", level2: "K50", level3: "", colorOfSandEpoxy: "", materialQuantity: "4", materialUnit: "kg" },
    ],
    "Kamdhenu X": [
      { rawMaterialName: "Cement", packagingType: "OPC", level2: "Silo", level3: "", colorOfSandEpoxy: "", materialQuantity: "500", materialUnit: "kg" },
      { rawMaterialName: "Sand", packagingType: "Grey", level2: "Small (600 micron)", level3: "", colorOfSandEpoxy: "", materialQuantity: "450", materialUnit: "kg" },
      { rawMaterialName: "Chemical", packagingType: "Tile Adhesive", level2: "KX", level3: "", colorOfSandEpoxy: "", materialQuantity: "40", materialUnit: "kg" },
    ],
  },
};
