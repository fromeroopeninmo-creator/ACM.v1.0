// app/types/acm.types.ts

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

// Orientación de la propiedad
export enum Orientation {
  NORTE = "Norte",
  SUR = "Sur",
  ESTE = "Este",
  OESTE = "Oeste",
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

// Servicios básicos
export interface Services {
  luz: boolean;
  agua: boolean;
  gas: boolean;
  cloacas: boolean;
  pavimento: boolean;
}

// Propiedad comparable (hasta 4)
export interface ComparableProperty {
  builtArea: number;      // m² cubiertos
  price: number;          // precio publicado (USD)
  listingUrl: string;     // link de publicación / drive
  description: string;    // descripción libre
  daysPublished: number;  // días que lleva publicada
  pricePerM2: number;     // calculado: price / builtArea
  coefficient: number;    // coeficiente multiplicador (0.1 a 1)
  photoUrl?: string;      // opción: link de foto
  photoBase64?: string;   // si se sube archivo, lo guardamos como base64 para el PDF
}

// Datos principales del formulario ACM
export interface ACMFormData {
  clientName: string;
  advisorName: string;
  phone: string;
  email: string;
  address: string;
  neighborhood: string;
  locality: string;
  propertyType: PropertyType;
  landArea: number;        // m² terreno
  builtArea: number;       // m² cubiertos
  hasPlans: boolean;       // planos si/no
  titleType: TitleType;    // escritura / boleto / posesion
  age: number;             // antiguedad (años)
  condition: PropertyCondition;
  locationQuality: LocationQuality;
  orientation: Orientation;
  services: Services;
  isRented: boolean;       // posee renta actualmente
  mainPhotoUrl: string;    // opcional link de foto
  mainPhotoBase64?: string;// base64 si se sube archivo
  date: string;            // fecha ISO string (ej. "2025-09-25")
  comparables: ComparableProperty[]; // hasta 4

  // Texto libre para el informe
  observations: string;
  considerations: string;
  strengths: string;
  weaknesses: string;
}
