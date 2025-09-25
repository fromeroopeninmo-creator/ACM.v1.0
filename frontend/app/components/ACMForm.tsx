'use client';

import { useState } from 'react';
import {
  ACMFormData,
  ComparableProperty,
  PropertyType,
  Orientation,
  LocationQuality,
  PropertyCondition,
  TitleType,
} from '../types/acm.types';
import { createACMAnalysis } from '../lib/api';

const initialFormData: ACMFormData = {
  clientName: '',
  advisorName: '',
  phone: '',
  email: '',
  address: '',
  neighborhood: '',
  propertyType: PropertyType.CASA,
  age: 0,
  landArea: 0,
  builtArea: 0,
  hasPlans: false,
  orientation: Orientation.NORTE,
  locationQuality: LocationQuality.BUENA,
  condition: PropertyCondition.BUENO,
  hasGas: true,
  hasElectricity: true,
  hasSewer: true,
  hasWater: true,
  titleType: TitleType.ESCRITURA,
  isRented: false,
  mainPhotoUrl: '',
  comparables: [],
};

const initialComparable: ComparableProperty = {
  address: '',
  photoUrl: '',
  listingUrl: '',
  builtArea: 0,
  price: 0,
  description: '',
};

export default function ACMForm() {
  const [formData, setFormData] = useState<ACMFormData>(initialFormData);
  const [comparables, setComparables] = useState<ComparableProperty[]>([
    { ...initialComparable },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleComparableChange = (
    index: number,
    field: keyof ComparableProperty,
    value: any
  ) => {
    const updatedComparables = [...comparables];
    updatedComparables[index] = {
      ...updatedComparables[index],
      [field]:
        field === 'builtArea' || field === 'price'
          ? parseFloat(value) || 0
          : value,
    };
    setComparables(updatedComparables);
  };

  const addComparable = () => {
    if (comparables.length < 4) {
      setComparables([...comparables, { ...initialComparable }]);
    }
  };

  const removeComparable = (index: number) => {
    if (comparables.length > 1) {
      setComparables(comparables.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const dataToSubmit = {
        ...formData,
        comparables: comparables.filter(
          (c) => c.address && c.price > 0 && c.builtArea > 0
        ),
      };

      const response = await createACMAnalysis(dataToSubmit);
      setResult(response);

      // Reset form
      setFormData(initialFormData);
      setComparables([{ ...initialComparable }]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al crear el análisis'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <form
        onSubmit={handleSubmit}
        className="space-y-8 bg-white rounded-lg shadow-lg p-8"
      >
        {/* Datos del Cliente */}
        <div className="border-b pb-8">
          <h3 className="text-xl font-semibold mb-6">Datos del Cliente</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              type="text"
              name="clientName"
              value={formData.clientName}
              onChange={handleInputChange}
              required
              placeholder="Nombre del Cliente"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              name="advisorName"
              value={formData.advisorName}
              onChange={handleInputChange}
              required
              placeholder="Asesor"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              placeholder="Teléfono"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="Email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* Datos de la Propiedad */}
        <div className="border-b pb-8">
          <h3 className="text-xl font-semibold mb-6">Datos de la Propiedad</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
              placeholder="Dirección"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              name="neighborhood"
              value={formData.neighborhood}
              onChange={handleInputChange}
              required
              placeholder="Barrio"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <select
              name="propertyType"
              value={formData.propertyType}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              {Object.values(PropertyType).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleInputChange}
              placeholder="Antigüedad"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* Comparables */}
        <div className="border-b pb-8">
          <h3 className="text-xl font-semibold mb-6">Propiedades Comparables</h3>
          {comparables.map((comp, index) => (
            <div
              key={index}
              className="p-4 mb-4 border rounded-lg bg-gray-50 space-y-4"
            >
              <input
                type="text"
                value={comp.address}
                onChange={(e) =>
                  handleComparableChange(index, 'address', e.target.value)
                }
                placeholder="Dirección"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="number"
                value={comp.builtArea}
                onChange={(e) =>
                  handleComparableChange(index, 'builtArea', e.target.value)
                }
                placeholder="Metros cuadrados construidos"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="number"
                value={comp.price}
                onChange={(e) =>
                  handleComparableChange(index, 'price', e.target.value)
                }
                placeholder="Precio"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <textarea
                value={comp.description}
                onChange={(e) =>
                  handleComparableChange(index, 'description', e.target.value)
                }
                placeholder="Descripción"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              {comparables.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeComparable(index)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg"
                >
                  Eliminar
                </button>
              )}
            </div>
          ))}
          {comparables.length < 4 && (
            <button
              type="button"
              onClick={addComparable}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg"
            >
              Agregar comparable
            </button>
          )}
        </div>

        {/* Botón de envío */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-green-600 text-white rounded-lg disabled:opacity-50"
          >
            {isSubmitting ? 'Enviando...' : 'Crear Análisis'}
          </button>
        </div>
      </form>

      {/* Mostrar resultado o error */}
      {result && (
        <div className="mt-6 p-4 bg-green-100 rounded-lg">
          <h4 className="text-lg font-bold">Análisis creado:</h4>
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      {error && (
        <div className="mt-6 p-4 bg-red-100 rounded-lg">
          <h4 className="text-lg font-bold">Error:</h4>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}

        </div>
      )}
    </div>
  );
}
