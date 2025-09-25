"use client";

import React, { useState } from "react";
import {
  ACMFormData,
  ComparableProperty,
  PropertyType,
  Orientation,
  LocationQuality,
  PropertyCondition,
  TitleType,
} from "@/app/types/acm.types";

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
    comparables: [],
    observations: "",
    considerations: "",
    strengths: "",
    weaknesses: "",
  });

  const [newComparable, setNewComparable] = useState<ComparableProperty>({
    builtArea: 0,
    price: 0,
    listingUrl: "",
    description: "",
    daysPublished: 0,
    pricePerM2: 0,
    coefficient: 1,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleComparableChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewComparable({
      ...newComparable,
      [name]: name === "price" || name === "builtArea" || name === "daysPublished" || name === "coefficient"
        ? Number(value)
        : value,
    });
  };

  const addComparable = () => {
    if (newComparable.builtArea > 0) {
      setFormData({
        ...formData,
        comparables: [...formData.comparables, { ...newComparable, pricePerM2: newComparable.price / newComparable.builtArea }],
      });
      setNewComparable({
        builtArea: 0,
        price: 0,
        listingUrl: "",
        description: "",
        daysPublished: 0,
        pricePerM2: 0,
        coefficient: 1,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Datos del ACM:", formData);
    alert("Formulario enviado. (Aquí conectaremos con el backend o generaremos PDF)");
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <h2 className="text-xl font-bold">Datos de la Propiedad</h2>

      <input type="text" name="clientName" placeholder="Cliente" value={formData.clientName} onChange={handleChange} className="border p-2 w-full" />
      <input type="text" name="advisorName" placeholder="Agente" value={formData.advisorName} onChange={handleChange} className="border p-2 w-full" />
      <input type="text" name="phone" placeholder="Teléfono" value={formData.phone} onChange={handleChange} className="border p-2 w-full" />
      <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="border p-2 w-full" />
      <input type="text" name="address" placeholder="Dirección" value={formData.address} onChange={handleChange} className="border p-2 w-full" />
      <input type="text" name="neighborhood" placeholder="Barrio" value={formData.neighborhood} onChange={handleChange} className="border p-2 w-full" />
      <input type="text" name="locality" placeholder="Localidad" value={formData.locality} onChange={handleChange} className="border p-2 w-full" />

      <select name="propertyType" value={formData.propertyType} onChange={handleChange} className="border p-2 w-full">
        {Object.values(PropertyType).map((type) => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>

      <input type="number" name="landArea" placeholder="m² Terreno" value={formData.landArea} onChange={handleChange} className="border p-2 w-full" />
      <input type="number" name="builtArea" placeholder="m² Cubiertos" value={formData.builtArea} onChange={handleChange} className="border p-2 w-full" />

      <label>
        <input type="checkbox" name="hasPlans" checked={formData.hasPlans} onChange={handleChange} /> Planos
      </label>

      <select name="titleType" value={formData.titleType} onChange={handleChange} className="border p-2 w-full">
        {Object.values(TitleType).map((title) => (
          <option key={title} value={title}>{title}</option>
        ))}
      </select>

      <input type="number" name="age" placeholder="Antigüedad (años)" value={formData.age} onChange={handleChange} className="border p-2 w-full" />

      <select name="condition" value={formData.condition} onChange={handleChange} className="border p-2 w-full">
        {Object.values(PropertyCondition).map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <select name="locationQuality" value={formData.locationQuality} onChange={handleChange} className="border p-2 w-full">
        {Object.values(LocationQuality).map((q) => (
          <option key={q} value={q}>{q}</option>
        ))}
      </select>

      <h3 className="font-bold">Servicios</h3>
      {Object.keys(formData.services).map((service) => (
        <label key={service} className="block">
          <input
            type="checkbox"
            checked={formData.services[service as keyof typeof formData.services]}
            onChange={() =>
              setFormData({
                ...formData,
                services: { ...formData.services, [service]: !formData.services[service as keyof typeof formData.services] },
              })
            }
          />{" "}
          {service}
        </label>
      ))}

      <label>
        <input type="checkbox" name="isRented" checked={formData.isRented} onChange={handleChange} /> Posee renta
      </label>

      <input type="text" name="mainPhotoUrl" placeholder="URL de foto" value={formData.mainPhotoUrl} onChange={handleChange} className="border p-2 w-full" />
      <input type="date" name="date" value={formData.date} onChange={handleChange} className="border p-2 w-full" />

      <h2 className="text-xl font-bold mt-6">Propiedades Comparadas</h2>

      <input type="number" name="builtArea" placeholder="m² Cubiertos" value={newComparable.builtArea} onChange={handleComparableChange} className="border p-2 w-full" />
      <input type="number" name="price" placeholder="Precio" value={newComparable.price} onChange={handleComparableChange} className="border p-2 w-full" />
      <input type="text" name="listingUrl" placeholder="URL publicación/drive" value={newComparable.listingUrl} onChange={handleComparableChange} className="border p-2 w-full" />
      <textarea name="description" placeholder="Descripción" value={newComparable.description} onChange={handleComparableChange} className="border p-2 w-full" />
      <input type="number" name="daysPublished" placeholder="Días publicada" value={newComparable.daysPublished} onChange={handleComparableChange} className="border p-2 w-full" />
      <input type="number" name="coefficient" step="0.1" min="0.1" max="1" placeholder="Coeficiente (0.1 a 1)" value={newComparable.coefficient} onChange={handleComparableChange} className="border p-2 w-full" />

      <button type="button" onClick={addComparable} className="bg-blue-500 text-white px-4 py-2">Agregar comparable</button>

      <div>
        <h3 className="font-bold">Observaciones</h3>
        <textarea name="observations" value={formData.observations} onChange={handleChange} className="border p-2 w-full" />
      </div>

      <div>
        <h3 className="font-bold">A considerar</h3>
        <textarea name="considerations" value={formData.considerations} onChange={handleChange} className="border p-2 w-full" />
      </div>

      <div>
        <h3 className="font-bold">Fortalezas</h3>
        <textarea name="strengths" value={formData.strengths} onChange={handleChange} className="border p-2 w-full" />
      </div>

      <div>
        <h3 className="font-bold">Debilidades</h3>
        <textarea name="weaknesses" value={formData.weaknesses} onChange={handleChange} className="border p-2 w-full" />
      </div>

      <button type="submit" className="bg-green-600 text-white px-6 py-2 mt-4">Generar Informe</button>
    </form>
  );
}
