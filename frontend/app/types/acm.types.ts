// Servicios disponibles
export interface Services {
  luz: boolean;
  agua: boolean;
  gas: boolean;
  cloacas: boolean;
  pavimento: boolean;
}

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

// Propiedad comparable
export interface ComparableProperty {
  builtArea: number;      // m² cubiertos
  price: number;          // precio publicado
  listingUrl: string;     // link publicación / drive
  description: string;    // texto libre
  daysPublished: number;  // días publicada
  pricePerM2: number;     // calculado
  coefficient: number;    // coef (0.1 a 1)
}

// Formulario principal ACM
export interface ACMFormData {
  clientName: string;
  advisorName: string;
  phone: string;
  email: string;
  address: string;
  neighborhood: string;
  locality: string;
  propertyType: PropertyType;
  landArea: number;
  builtArea: number;
  hasPlans: boolean;
  titleType: TitleType;
  age: number;
  condition: PropertyCondition;
  locationQuality: LocationQuality;
  orientation: Orientation;
  services: Services;          // 👈 ESTE CAMPO ES CLAVE
  isRented: boolean;
  mainPhotoUrl: string;
  mainPhotoBase64?: string;    // 👈 opcional
  date: string;
  comparables: ComparableProperty[];

  // Texto libre
  observations: string;
  considerations: string;
  strengths: string;
  weaknesses: string;
}
