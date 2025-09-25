"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import {
  ACMFormData,
  ComparableProperty,
  PropertyType,
  PropertyCondition,
  LocationQuality,
  TitleType,
  Orientation,
} from "../types/acm.types";

export default function ACMForm() {
  const [formData, setFormData] = useState<ACMFormData>({
    clientName: "",
    advisorName: "",
    phone: "",
    email: "",
    address: "",
    neighborhood: "",
    locality: "",
    propertyType: PropertyType.CASA,
    landArea: 0,
    builtArea: 0,
    hasPlans: false,
    titleType: TitleType.ESCRITURA,
    age: 0,
    condition: PropertyCondition.BUENO,
    locationQuality: LocationQuality.BUENA,
    orientation: Orientation.NORTE,
    services: { luz: false, agua: false, gas: false, cloacas: false, pavimento: false },
    isRented: false,
    mainPhotoUrl: "",
    date: new Date().toISOString().split("T")[0],
    comparables: [
      { builtArea: 0, price: 0, listingUrl: "", description: "", daysPublished: 0, pricePerM2: 0, coefficient: 1 },
    ],
    observations: "",
    considerations: "",
    strengths: "",
    weaknesses: "",
  });

  // ✅ Manejo inputs generales
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else if (type === "number") {
      setFormData({ ...formData, [name]: Number(value) || 0 });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // ✅ Manejo de servicios (checkboxes dentro de un objeto)
  const handleServiceChange = (service: keyof ACMFormData["services"]) => {
    setFormData({
      ...formData,
      services: { ...formData.services, [service]: !formData.services[service] },
    });
  };

  // ✅ Manejo comparables
  const handleComparableChange = <K extends keyof ComparableProperty>(
  index: number,
  field: K,
  value: ComparableProperty[K]
) => {
  const copy = [...formData.comparables];

  if (
    field === "builtArea" ||
    field === "price" ||
    field === "daysPublished" ||
    field === "coefficient"
  ) {
    copy[index][field] = Number(value) as ComparableProperty[K];
  } else {
    copy[index][field] = value;
  }

  // recalcular pricePerM2
  copy[index].pricePerM2 =
    copy[index].builtArea > 0 ? copy[index].price / copy[index].builtArea : 0;

  setFormData({ ...formData, comparables: copy });
};

  const addComparable = () => {
    if (formData.comparables.length < 4) {
      setFormData({
        ...formData,
        comparables: [
          ...formData.comparables,
          { builtArea: 0, price: 0, listingUrl: "", description: "", daysPublished: 0, pricePerM2: 0, coefficient: 1 },
        ],
      });
    }
  };

  const removeComparable = (index: number) => {
    const copy = formData.comparables.filter((_, i) => i !== index);
    setFormData({ ...formData, comparables: copy });
  };

  // ✅ Generar PDF
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Análisis Comparativo de Mercado (ACM)", 10, 10);

    doc.setFontSize(12);
    doc.text(`Cliente: ${formData.clientName}`, 10, 20);
    doc.text(`Asesor: ${formData.advisorName}`, 10, 30);
    doc.text(`Teléfono: ${formData.phone}`, 10, 40);
    doc.text(`Email: ${formData.email}`, 10, 50);

    doc.text(`Dirección: ${formData.address}`, 10, 60);
    doc.text(`Barrio: ${formData.neighborhood}`, 10, 70);
    doc.text(`Localidad: ${formData.locality}`, 10, 80);

    doc.text(`Tipología: ${formData.propertyType}`, 10, 90);
    doc.text(`m² Terreno: ${formData.landArea}`, 10, 100);
    doc.text(`m² Cubiertos: ${formData.builtArea}`, 10, 110);
    doc.text(`Antigüedad: ${formData.age}`, 10, 120);
    doc.text(`Estado: ${formData.condition}`, 10, 130);
    doc.text(`Ubicación: ${formData.locationQuality}`, 10, 140);
    doc.text(`Orientación: ${formData.orientation}`, 10, 150);

    // Comparables
    let y = 170;
    formData.comparables.forEach((c, i) => {
      doc.text(`Comparable ${i + 1}:`, 10, y);
      y += 10;
      doc.text(`m² Cubiertos: ${c.builtArea}`, 10, y);
      y += 10;
      doc.text(`Precio: $${c.price}`, 10, y);
      y += 10;
      doc.text(`Precio/m²: $${c.pricePerM2.toFixed(2)}`, 10, y);
      y += 10;
      doc.text(`Días publicada: ${c.daysPublished}`, 10, y);
      y += 10;
      doc.text(`Coeficiente: ${c.coefficient}`, 10, y);
      y += 15;
    });

    // Textos libres
    doc.text("Observaciones:", 10, y);
    y += 10;
    doc.text(formData.observations || "-", 10, y);
    y += 15;

    doc.text("A considerar:", 10, y);
    y += 10;
    doc.text(formData.considerations || "-", 10, y);
    y += 15;

    doc.text("Fortalezas:", 10, y);
    y += 10;
    doc.text(formData.strengths || "-", 10, y);
    y += 15;

    doc.text("Debilidades:", 10, y);
    y += 10;
    doc.text(formData.weaknesses || "-", 10, y);

    doc.save("acm.pdf");
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Análisis Comparativo de Mercado (ACM)</h2>

      {/* Cliente */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input name="clientName" placeholder="Nombre del cliente" value={formData.clientName} onChange={handleChange} />
        <input name="advisorName" placeholder="Nombre del asesor" value={formData.advisorName} onChange={handleChange} />
        <input name="phone" placeholder="Teléfono" value={formData.phone} onChange={handleChange} />
        <input name="email" placeholder="Email" value={formData.email} onChange={handleChange} />
      </div>

      {/* Dirección */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <input name="address" placeholder="Dirección" value={formData.address} onChange={handleChange} />
        <input name="neighborhood" placeholder="Barrio" value={formData.neighborhood} onChange={handleChange} />
        <input name="locality" placeholder="Localidad" value={formData.locality} onChange={handleChange} />
      </div>

      {/* Servicios */}
      <div className="mt-6">
        <h3 className="font-semibold mb-2">Servicios</h3>
        {Object.keys(formData.services).map((service) => (
          <label key={service} className="mr-4">
            <input
              type="checkbox"
              checked={formData.services[service as keyof ACMFormData["services"]]}
              onChange={() => handleServiceChange(service as keyof ACMFormData["services"])}
            />{" "}
            {service}
          </label>
        ))}
      </div>

      {/* Comparables */}
      <div className="mt-6">
        <h3 className="font-semibold mb-2">Propiedades Comparables</h3>
        {formData.comparables.map((c, i) => (
          <div key={i} className="border p-4 mb-2">
            <input
              type="number"
              placeholder="m² Cubiertos"
              value={c.builtArea}
              onChange={(e) => handleComparableChange(i, "builtArea", e.target.value)}
            />
            <input
              type="number"
              placeholder="Precio"
              value={c.price}
              onChange={(e) => handleComparableChange(i, "price", e.target.value)}
            />
            <input
              type="text"
              placeholder="Link publicación"
              value={c.listingUrl}
              onChange={(e) => handleComparableChange(i, "listingUrl", e.target.value)}
            />
            <input
              type="number"
              placeholder="Días publicada"
              value={c.daysPublished}
              onChange={(e) => handleComparableChange(i, "daysPublished", e.target.value)}
            />
            <input
              type="number"
              placeholder="Coeficiente"
              step="0.1"
              min="0.1"
              max="1"
              value={c.coefficient}
              onChange={(e) => handleComparableChange(i, "coefficient", e.target.value)}
            />
            <button type="button" onClick={() => removeComparable(i)}>Eliminar</button>
          </div>
        ))}
        <button type="button" onClick={addComparable} className="mt-2">Agregar comparable</button>
      </div>

      {/* Texto libre */}
      <textarea
        name="observations"
        placeholder="Observaciones"
        value={formData.observations}
        onChange={handleChange}
        className="w-full border mt-4"
      />
      <textarea
        name="considerations"
        placeholder="A considerar"
        value={formData.considerations}
        onChange={handleChange}
        className="w-full border mt-2"
      />
      <textarea
        name="strengths"
        placeholder="Fortalezas"
        value={formData.strengths}
        onChange={handleChange}
        className="w-full border mt-2"
      />
      <textarea
        name="weaknesses"
        placeholder="Debilidades"
        value={formData.weaknesses}
        onChange={handleChange}
        className="w-full border mt-2"
      />

      <button
        type="button"
        onClick={generatePDF}
        className="mt-6 bg-blue-600 text-white px-4 py-2 rounded"
      >
        Descargar PDF
      </button>
    </div>
  );
}
