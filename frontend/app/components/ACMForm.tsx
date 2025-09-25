"use client";

import { useState } from "react";
import {
  ACMFormData,
  ComparableProperty,
  PropertyType,
  PropertyCondition,
  Orientation,
  LocationQuality,
  TitleType,
} from "../types/acm.types";
import { createACMAnalysis } from "../lib/api";

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
    orientation: Orientation.NORTE,
    locationQuality: LocationQuality.BUENA,
    services: {
      luz: false,
      agua: false,
      gas: false,
      cloacas: false,
      pavimento: false,
    },
    isRented: false,
    mainPhotoUrl: "",
    date: new Date().toISOString(),
    comparables: [],
    observations: "",
    considerations: "",
    strengths: "",
    weaknesses: "",
  });

  const [comparables, setComparables] = useState<ComparableProperty[]>([
    {
      builtArea: 0,
      price: 0,
      listingUrl: "",
      description: "",
      daysPublished: 0,
      pricePerM2: 0,
      coefficient: 1,
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // ✅ FIX para TypeScript con checkbox
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleComparableChange = (
    index: number,
    field: keyof ComparableProperty,
    value: any
  ) => {
    const updated = [...comparables];
    updated[index] = {
      ...updated[index],
      [field]:
        field === "builtArea" || field === "price" || field === "daysPublished"
          ? parseFloat(value) || 0
          : field === "coefficient"
          ? parseFloat(value) || 1
          : value,
    };

    updated[index].pricePerM2 =
      updated[index].builtArea > 0
        ? updated[index].price / updated[index].builtArea
        : 0;

    setComparables(updated);
  };

  const addComparable = () => {
    if (comparables.length < 4) {
      setComparables([
        ...comparables,
        {
          builtArea: 0,
          price: 0,
          listingUrl: "",
          description: "",
          daysPublished: 0,
          pricePerM2: 0,
          coefficient: 1,
        },
      ]);
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
      const response = await createACMAnalysis({
        ...formData,
        comparables,
      });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el análisis");
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
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          Análisis Comparativo de Mercado (ACM)
        </h2>

        {/* ✅ Datos del Cliente */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input
            type="text"
            name="clientName"
            placeholder="Nombre del Cliente"
            value={formData.clientName}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />
          <input
            type="text"
            name="advisorName"
            placeholder="Asesor"
            value={formData.advisorName}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />
          <input
            type="tel"
            name="phone"
            placeholder="Teléfono"
            value={formData.phone}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />
        </div>

        {/* ✅ Observaciones del agente */}
        <textarea
          name="observations"
          placeholder="Observaciones"
          value={formData.observations}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <textarea
          name="considerations"
          placeholder="A considerar"
          value={formData.considerations}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <textarea
          name="strengths"
          placeholder="Fortalezas"
          value={formData.strengths}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <textarea
          name="weaknesses"
          placeholder="Debilidades"
          value={formData.weaknesses}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          {isSubmitting ? "Enviando..." : "Generar Análisis"}
        </button>
      </form>
    </div>
  );
}
