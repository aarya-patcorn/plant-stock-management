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
  "White cement grout",
  "Ivory",
  "Black grout",
  "Coffee brown grout",
  "Light grey grout",
  "Grey grout",
  "Red grout",
  "Blue grout",
  "Green grout",
  "Yellow grout",
];

export const epoxyProducts = [
  "White epoxy",
  "Black epoxy",
  "Ivory epoxy",
  "Deep safayar epoxy",
  "Slate grey epoxy",
  "Sand stone epoxy",
  "Light grey epoxy",
  "Dark grey epoxy",
  "Coffee brown epoxy",
  "Harvest Gold epoxy",
  "English walnut epoxy",
  "Dholpur pink epoxy",
  "Redwood epoxy",
];

export const epoxyProductColorMap: Record<string, string> = {
  "White epoxy": "White",
  "Black epoxy": "Black",
  "Ivory epoxy": "Ivory",
  "Deep safayar epoxy": "Deep safayar",
  "Slate grey epoxy": "Slate grey",
  "Sand stone epoxy": "Sand stone",
  "Light grey epoxy": "Light grey",
  "Dark grey epoxy": "Dark grey",
  "Coffee brown epoxy": "Coffee brown",
  "Harvest gold epoxy": "Harvest gold",
  "English walnut epoxy": "English walnut",
  "Dholpur pink epoxy": "Dholpur pink",
  "Redwood epoxy": "Redwood",
};

export const groutProductColorMap: Record<string, string> = {
  "White cement grout": "White",
  "Ivory": "Ivory",
  "Black grout": "Black",
  "Coffee brown grout": "Coffee Brown",
  "Light grey grout": "Light Grey",
  "Grey grout": "Grey",
  "Red grout": "Red",
  "Blue grout": "Blue",
  "Green grout": "Green",
  "Yellow grout": "Yellow",
};

export const groutRecipes: Record<string, RawMaterialRecipeItem[]> = {
  "White cement grout": [
    { rawMaterialName: "Cement", packagingType: "White Cement", level2: "Bag", level3: "", colorOfSandEpoxy: "", materialQuantity: "180", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Grout", level2: "Calcium Carbonate", level3: "", colorOfSandEpoxy: "", materialQuantity: "120", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Adhesive", level2: "K50", level3: "", colorOfSandEpoxy: "", materialQuantity: "4", materialUnit: "kg" },
  ],
  "Ivory grout": [
    { rawMaterialName: "Cement", packagingType: "White Cement", level2: "", level3: "", colorOfSandEpoxy: "", materialQuantity: "180", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Grout", level2: "Calcium Carbonate", level3: "", colorOfSandEpoxy: "", materialQuantity: "120", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Adhesive", level2: "K50", level3: "", colorOfSandEpoxy: "", materialQuantity: "4", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Grout", level2: "Yellow Pigment", level3: "", colorOfSandEpoxy: "", materialQuantity: "100", materialUnit: "gm" },
  ],
  "Black grout": [
    { rawMaterialName: "Cement", packagingType: "PPC", level2: "Bag", level3: "", colorOfSandEpoxy: "", materialQuantity: "180", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Grout", level2: "Calcium Carbonate", level3: "", colorOfSandEpoxy: "", materialQuantity: "120", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Adhesive", level2: "K50", level3: "", colorOfSandEpoxy: "", materialQuantity: "4", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Grout", level2: "Black Pigment", level3: "", colorOfSandEpoxy: "", materialQuantity: "3500", materialUnit: "gm" },
  ],
  "Coffee brown grout": [
    { rawMaterialName: "Cement", packagingType: "White Cement", level2: "Bag", level3: "", colorOfSandEpoxy: "", materialQuantity: "70", materialUnit: "kg" },
    { rawMaterialName: "Cement", packagingType: "PPC", level2: "Bag", level3: "", colorOfSandEpoxy: "", materialQuantity: "20", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Grout", level2: "Calcium Carbonate", level3: "", colorOfSandEpoxy: "", materialQuantity: "60", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Adhesive", level2: "K50", level3: "", colorOfSandEpoxy: "", materialQuantity: "2", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Grout", level2: "Red Pigment", level3: "", colorOfSandEpoxy: "", materialQuantity: "650", materialUnit: "gm" },
    { rawMaterialName: "Chemical", packagingType: "Tile Grout", level2: "Black Pigment", level3: "", colorOfSandEpoxy: "", materialQuantity: "700", materialUnit: "gm" },
  ],
  "Light grey grout": [
    { rawMaterialName: "Cement", packagingType: "White Cement", level2: "Bag", level3: "", colorOfSandEpoxy: "", materialQuantity: "90", materialUnit: "kg" },
    { rawMaterialName: "Cement", packagingType: "PPC", level2: "Bag", level3: "", colorOfSandEpoxy: "", materialQuantity: "20", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Grout", level2: "Calcium Carbonate", level3: "", colorOfSandEpoxy: "", materialQuantity: "60", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Adhesive", level2: "K50", level3: "", colorOfSandEpoxy: "", materialQuantity: "2", materialUnit: "kg" },
  ],
  "Grey grout": [
    { rawMaterialName: "Cement", packagingType: "PPC", level2: "Bag", level3: "", colorOfSandEpoxy: "", materialQuantity: "50", materialUnit: "kg" },
    { rawMaterialName: "Cement", packagingType: "White Cement", level2: "Bag", level3: "", colorOfSandEpoxy: "", materialQuantity: "70", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Grout", level2: "Calcium Carbonate", level3: "", colorOfSandEpoxy: "", materialQuantity: "60", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Adhesive", level2: "K50", level3: "", colorOfSandEpoxy: "", materialQuantity: "2", materialUnit: "kg" },
  ],
  "Red grout": [
    { rawMaterialName: "Cement", packagingType: "White Cement", level2: "Bag", level3: "", colorOfSandEpoxy: "", materialQuantity: "100", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Grout", level2: "Calcium Carbonate", level3: "", colorOfSandEpoxy: "", materialQuantity: "50", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Adhesive", level2: "K50", level3: "", colorOfSandEpoxy: "", materialQuantity: "1.5", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Grout", level2: "Red Pigment", level3: "", colorOfSandEpoxy: "", materialQuantity: "900", materialUnit: "gm" },
  ],
  "Blue grout": [
    { rawMaterialName: "Cement", packagingType: "White Cement", level2: "Bag", level3: "", colorOfSandEpoxy: "", materialQuantity: "100", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Grout", level2: "Calcium Carbonate", level3: "", colorOfSandEpoxy: "", materialQuantity: "50", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Adhesive", level2: "K50", level3: "", colorOfSandEpoxy: "", materialQuantity: "1.5", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Grout", level2: "Blue Pigment", level3: "", colorOfSandEpoxy: "", materialQuantity: "2000", materialUnit: "gm" },
  ],
  "Green grout": [
    { rawMaterialName: "Cement", packagingType: "White Cement", level2: "Bag", level3: "", colorOfSandEpoxy: "", materialQuantity: "100", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Grout", level2: "Calcium Carbonate", level3: "", colorOfSandEpoxy: "", materialQuantity: "50", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Adhesive", level2: "K50", level3: "", colorOfSandEpoxy: "", materialQuantity: "1.5", materialUnit: "kg" },
    { rawMaterialName: "Chemical", packagingType: "Tile Grout", level2: "Blue Pigment", level3: "", colorOfSandEpoxy: "", materialQuantity: "1550", materialUnit: "gm" },
    { rawMaterialName: "Chemical", packagingType: "Tile Adhesive", level2: "K50", level3: "", colorOfSandEpoxy: "", materialQuantity: "450", materialUnit: "gm" },
  ],
  "Yellow grout": [
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
      { rawMaterialName: "Chemical", packagingType: "Tile Adhesive", level2: "K90", level3: "", colorOfSandEpoxy: "", materialQuantity: "9", materialUnit: "kg" },
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


