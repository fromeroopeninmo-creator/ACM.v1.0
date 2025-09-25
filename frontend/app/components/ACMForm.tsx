'use client';

import { useState } from 'react';
import { ACMFormData, ComparableProperty, PropertyType, LocationQuality, PropertyCondition, TitleType } from '@/app/types/acm.types';
import jsPDF from 'jspdf';

const initialFormData: ACMFormData = {
  clientName: '',
  advisorName: '',
  phone: '',
  email: '',
  address: '',
  neighborhood: '',
  locality: '',
  propertyType: PropertyType.CASA,
  landArea: 0,
  builtArea: 0,
  hasPlans: false,
  titleType: TitleType.ESCRITURA,
  age: 0,
  condition: PropertyCondition.BUENO,
  locationQuality: LocationQuality.BUENA,
  services: { luz: false, agua: false, gas: false, cloacas: false, pavimento: false },
  isRented: false,
  mainPhotoUrl: '',
  date: new Date().toISOString().split("T")[0],
  comparables: [],
  observations: '',
  considerations: '',
  strengths: '',
  weaknesses: ''
};

const initialComparable: ComparableProperty = {
  builtArea: 0,
  price: 0,
  listingUrl: '',
  description: '',
  daysPublished: 0,
  pricePerM2: 0,
  coefficient: 1
};

export default function ACMForm() {
  const [formData, setFormData] = useState<ACMFormData>(initialFormData);
  const [comparables, setComparables] = useState<ComparableProperty[]>([{ ...initialComparable }]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleComparableChange = (index: number, field: keyof ComparableProperty, value: any) => {
    const updated = [...comparables];
    updated[index] = {
      ...updated[index],
      [field]: field === 'price' || field === 'builtArea' || field === 'daysPublished' || field === 'coefficient'
        ? parseFloat(value) || 0
        : value
    };
    updated[index].pricePerM2 = updated[index].builtArea > 0 ? updated[index].price / updated[index].builtArea : 0;
    setComparables(updated);
    setFormData(prev => ({ ...prev, comparables: updated }));
  };

  const addComparable = () => {
    if (comparables.length < 4) setComparables([...comparables, { ...initialComparable }]);
  };

  const removeComparable = (index: number) => {
    if (comparables.length > 1) setComparables(comparables.filter((_, i) => i !== index));
  };

  // 👉 Generar PDF
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Informe ACM - Análisis Comparativo de Mercado", 10, 10);

    doc.setFontSize(12);
    doc.text(`Cliente: ${formData.clientName}`, 10, 20);
    doc.text(`Asesor: ${formData.advisorName}`, 10, 28);
    doc.text(`Teléfono: ${formData.phone}`, 10, 36);
    doc.text(`Email: ${formData.email}`, 10, 44);

    doc.text(`Dirección: ${formData.address}, Barrio: ${formData.neighborhood}, Localidad: ${formData.locality}`, 10, 60);
    doc.text(`Tipología: ${formData.propertyType} | Antigüedad: ${formData.age} años`, 10, 68);
    doc.text(`Terreno: ${formData.landArea} m² | Cubiertos: ${formData.builtArea} m²`, 10, 76);
    doc.text(`Estado: ${formData.condition} | Ubicación: ${formData.locationQuality}`, 10, 84);

    doc.text("Servicios:", 10, 100);
    const services = Object.entries(formData.services).filter(([_, v]) => v).map(([k]) => k).join(", ") || "Ninguno";
    doc.text(services, 10, 108);

    doc.text("Propiedades comparables:", 10, 124);
    comparables.forEach((c, i) => {
      doc.text(`${i + 1}. ${c.builtArea} m² - USD ${c.price} (${c.pricePerM2.toFixed(2)} USD/m²) - Coef: ${c.coefficient}`, 10, 132 + i * 12);
    });

    doc.text("Observaciones:", 10, 180);
    doc.text(formData.observations || "-", 10, 188, { maxWidth: 180 });

    doc.text("A considerar:", 10, 200);
    doc.text(formData.considerations || "-", 10, 208, { maxWidth: 180 });

    doc.text("Fortalezas:", 10, 220);
    doc.text(formData.strengths || "-", 10, 228, { maxWidth: 180 });

    doc.text("Debilidades:", 10, 240);
    doc.text(formData.weaknesses || "-", 10, 248, { maxWidth: 180 });

    doc.save("informe-acm.pdf");
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <form className="space-y-6 bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Análisis Comparativo de Mercado (ACM)</h2>

        {/* Datos del Cliente */}
        <div>
          <h3 className="font-semibold mb-4">Datos del Cliente</h3>
          <input name="clientName" placeholder="Nombre del Cliente" value={formData.clientName} onChange={handleInputChange} className="border p-2 w-full mb-2"/>
          <input name="advisorName" placeholder="Asesor" value={formData.advisorName} onChange={handleInputChange} className="border p-2 w-full mb-2"/>
          <input name="phone" placeholder="Teléfono" value={formData.phone} onChange={handleInputChange} className="border p-2 w-full mb-2"/>
          <input name="email" placeholder="Email" type="email" value={formData.email} onChange={handleInputChange} className="border p-2 w-full mb-2"/>
        </div>

        {/* Datos de la Propiedad */}
        <div>
          <h3 className="font-semibold mb-4">Datos de la Propiedad</h3>
          <input name="address" placeholder="Dirección" value={formData.address} onChange={handleInputChange} className="border p-2 w-full mb-2"/>
          <input name="neighborhood" placeholder="Barrio" value={formData.neighborhood} onChange={handleInputChange} className="border p-2 w-full mb-2"/>
          <input name="locality" placeholder="Localidad" value={formData.locality} onChange={handleInputChange} className="border p-2 w-full mb-2"/>
          <input name="landArea" placeholder="m² Terreno" type="number" value={formData.landArea} onChange={handleInputChange} className="border p-2 w-full mb-2"/>
          <input name="builtArea" placeholder="m² Cubiertos" type="number" value={formData.builtArea} onChange={handleInputChange} className="border p-2 w-full mb-2"/>
        </div>

        {/* Comparables */}
        <div>
          <h3 className="font-semibold mb-4">Propiedades Comparables</h3>
          {comparables.map((c, i) => (
            <div key={i} className="border p-4 mb-4 rounded">
              <input placeholder="m² Cubiertos" type="number" value={c.builtArea} onChange={e => handleComparableChange(i, "builtArea", e.target.value)} className="border p-2 w-full mb-2"/>
              <input placeholder="Precio (USD)" type="number" value={c.price} onChange={e => handleComparableChange(i, "price", e.target.value)} className="border p-2 w-full mb-2"/>
              <input placeholder="Link publicación" value={c.listingUrl} onChange={e => handleComparableChange(i, "listingUrl", e.target.value)} className="border p-2 w-full mb-2"/>
              <textarea placeholder="Descripción" value={c.description} onChange={e => handleComparableChange(i, "description", e.target.value)} className="border p-2 w-full mb-2"/>
              <input placeholder="Días publicada" type="number" value={c.daysPublished} onChange={e => handleComparableChange(i, "daysPublished", e.target.value)} className="border p-2 w-full mb-2"/>
              <input placeholder="Coeficiente (0.1 - 1)" type="number" step="0.1" min="0.1" max="1" value={c.coefficient} onChange={e => handleComparableChange(i, "coefficient", e.target.value)} className="border p-2 w-full mb-2"/>
              <button type="button" onClick={() => removeComparable(i)} className="bg-red-500 text-white px-3 py-1 rounded">Eliminar</button>
            </div>
          ))}
          <button type="button" onClick={addComparable} className="bg-blue-500 text-white px-4 py-2 rounded">Agregar Propiedad</button>
        </div>

        {/* Observaciones */}
        <div>
          <h3 className="font-semibold mb-4">Comentarios</h3>
          <textarea placeholder="Observaciones" value={formData.observations} onChange={e => setFormData({...formData, observations: e.target.value})} className="border p-2 w-full mb-2"/>
          <textarea placeholder="A considerar" value={formData.considerations} onChange={e => setFormData({...formData, considerations: e.target.value})} className="border p-2 w-full mb-2"/>
          <textarea placeholder="Fortalezas" value={formData.strengths} onChange={e => setFormData({...formData, strengths: e.target.value})} className="border p-2 w-full mb-2"/>
          <textarea placeholder="Debilidades" value={formData.weaknesses} onChange={e => setFormData({...formData, weaknesses: e.target.value})} className="border p-2 w-full mb-2"/>
        </div>

        {/* Botón PDF */}
        <button type="button" onClick={generatePDF} className="bg-green-600 text-white px-6 py-2 rounded">
          Descargar Informe en PDF
        </button>
      </form>
    </div>
  );
}
