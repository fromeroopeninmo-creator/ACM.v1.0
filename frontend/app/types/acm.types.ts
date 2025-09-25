// Tipología de propiedad
export enum PropertyType {
  CASA = "Casa",
  DEPARTAMENTO = "Departamento",
  PH = "PH",
  LOTE = "Lote",
}

// Estado de conservación
export enum PropertyCondition {
  ESTRENAR = "A estrenar",
  EXCELENTE = "Excelente",
  MUY_BUENO = "Muy bueno",
  BUENO = "Bueno",
  REGULAR = "Regular",
  MALO = "Malo",
}

// Orientación
export enum Orientation {
  NORTE = "Norte",
  SUR = "Sur",
  ESTE = "Este",
  OESTE = "Oeste"
}

// Calidad de ubicación
export enum LocationQuality {
  EXCELENTE = "Excelente",
  MUY_BUENA = "Muy buena",
  BUENA = "Buena",
  MALA = "Mala",
}

// Tipo de título
export enum TitleType {
  ESCRITURA = "Escritura",
  BOLETO = "Boleto",
  POSESION = "Posesión",
}

// Servicios
export interface Services {
  luz: boolean;
  agua: boolean;
  gas: boolean;
  cloacas: boolean;
  pavimento: boolean;
}

// Propiedad comparable
export interface ComparableProperty {
  builtArea: number;      // m² cubiertos
  price: number;          // precio publicado
  listingUrl: string;     // link de publicación / drive
  description: string;    // descripción libre
  daysPublished: number;  // días publicada
  pricePerM2: number;     // calculado
  coefficient: number;    // coeficiente multiplicador (0.1 a 1)
}

// Formulario principal de ACM
export interface ACMFormData {
  clientName: string;
  advisorName: string;
  phone: string;
  email: string;
  address: string;
  neighborhood: string;
  locality: string;
  propertyType: PropertyType;
  landArea: number;       // m² terreno
  builtArea: number;      // m² cubiertos
  hasPlans: boolean;
  titleType: TitleType;
  age: number;
  condition: PropertyCondition;
  locationQuality: LocationQuality;
  orientation: Orientation; // 👉 agregado acá
  services: Services;
  isRented: boolean;
  mainPhotoUrl: string;   // link de foto
  date: string;           // fecha ISO string
  comparables: ComparableProperty[];

  // Texto libre para informe
  observations: string;
  considerations: string;
  strengths: string;
  weaknesses: string;
}
