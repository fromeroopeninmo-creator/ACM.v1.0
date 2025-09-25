// app/components/ACMForm.tsx
"use client";

import React, { useState } from "react";
import jsPDF from "jspdf";
import {
  ACMFormData,
  ComparableProperty,
  PropertyType,
  PropertyCondition,
  Orientation,
  LocationQuality,
  TitleType,
} from "../types/acm.types";

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Error leyendo archivo"));
    reader.readAsDataURL(file);
  });

export default function ACMForm() {
  const emptyComparable = (): ComparableProperty => ({
    builtArea: 0,
    price: 0,
    listingUrl: "",
    description: "",
    daysPublished: 0,
    pricePerM2: 0,
    coefficient: 1,
  });

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
    // mainPhotoBase64 optionally included in payload
    date: new Date().toISOString().split("T")[0],
    comparables: [],
    observations: "",
    considerations: "",
    strengths: "",
    weaknesses: "",
  });

  const [mainPhotoBase64, setMainPhotoBase64] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  // --- Helpers de actualización de estado ---
  const updateField = (name: keyof ACMFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value } as ACMFormData));
  };

  // Manejo general de inputs (text, date, select, number, checkbox name-based)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, type, value } = e.target as HTMLInputElement & HTMLSelectElement & HTMLTextAreaElement;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      updateField(name as keyof ACMFormData, checked);
    } else if (type === "number") {
      // note: some selects send string even if numbers; use Number()
      updateField(name as keyof ACMFormData, Number(value || 0));
    } else {
      updateField(name as keyof ACMFormData, value);
    }
  };

  // Toggle para servicios (usa key de services)
  const toggleService = (serviceKey: keyof ACMFormData["services"]) => {
    setFormData((prev) => ({
      ...prev,
      services: {
        ...prev.services,
        [serviceKey]: !prev.services[serviceKey],
      },
    }));
  };

  // --- Main photo upload (file -> base64) ---
  const handleMainPhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await fileToBase64(file);
      setMainPhotoBase64(b64);
      updateField("mainPhotoUrl", ""); // clear URL if using file
    } catch (err) {
      console.error("Error leyendo foto principal:", err);
    }
  };

  // --- Comparables handlers ---
  const addComparable = () => {
    setFormData((prev) => {
      if (prev.comparables.length >= 4) return prev;
      return { ...prev, comparables: [...prev.comparables, emptyComparable()] };
    });
  };

  const removeComparable = (index: number) => {
    setFormData((prev) => {
      const copy = prev.comparables.filter((_, i) => i !== index);
      return { ...prev, comparables: copy };
    });
  };

  // Generic, typed handler for comparable fields
  const handleComparableChange = <K extends keyof ComparableProperty>(
    index: number,
    field: K,
    value: ComparableProperty[K] | string | number
  ) => {
    setFormData((prev) => {
      const copy = prev.comparables.map((c) => ({ ...c }));
      // normalize numeric fields
      if (field === "builtArea" || field === "price" || field === "daysPublished" || field === "coefficient") {
        copy[index][field] = Number(value) as ComparableProperty[K];
      } else {
        copy[index][field] = value as ComparableProperty[K];
      }
      // recalcular pricePerM2
      copy[index].pricePerM2 = copy[index].builtArea > 0 ? copy[index].price / copy[index].builtArea : 0;
      return { ...prev, comparables: copy };
    });
  };

  const handleComparablePhotoFile = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await fileToBase64(file);
      handleComparableChange(index, "listingUrl", ""); // optional: clear listingUrl if using file
      // We don't have photoBase64 in ComparableProperty in the interface; store in listingUrl as data: URL (or adapt types)
      // To avoid changing types file, we'll set listingUrl to the base64 (works for PDF generation)
      handleComparableChange(index, "listingUrl", b64 as any);
    } catch (err) {
      console.error("Error leyendo foto comparable:", err);
    }
  };

  // --- Submit (envía al backend si API_URL configurada) ---
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);

    try {
      // preparar payload
      const payload: ACMFormData & { mainPhotoBase64?: string } = {
        ...formData,
        mainPhotoUrl: formData.mainPhotoUrl || "",
        // si subiste archivo principal, mandarlo en base64
        ...(mainPhotoBase64 ? { mainPhotoBase64 } : {}),
      };

      // Si la API está configurada, hacemos POST
      if (API_URL) {
        const res = await fetch(`${API_URL.replace(/\/$/, "")}/acm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Error server: ${res.status} ${res.statusText}`);
        const data = await res.json();
        alert("Análisis guardado en backend");
        console.log("Respuesta backend:", data);
      } else {
        // sin backend: mostramos en consola
        console.log("Payload ACM (sin backend):", payload);
        alert("Payload listo en consola. Configura NEXT_PUBLIC_API_URL para enviar al backend.");
      }
    } catch (err: any) {
      console.error("Error submit ACM:", err);
      alert("Error al enviar: " + (err?.message || String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- PDF generation (incluye imágenes si son base64 en mainPhotoBase64 o comparables.listingUrl) ---
  const generatePDF = async () => {
    const doc = new jsPDF("p", "mm", "a4");
    doc.setFontSize(14);
    doc.text("Informe ACM - Análisis Comparativo de Mercado", 10, 12);

    let y = 20;
    const row = (label: string, value: string) => {
      doc.setFontSize(10);
      doc.text(`${label}: ${value}`, 10, y);
      y += 6;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    };

    row("Cliente", formData.clientName || "-");
    row("Agente", formData.advisorName || "-");
    row("Teléfono", formData.phone || "-");
    row("Email", formData.email || "-");
    row("Dirección", formData.address || "-");
    row("Barrio", formData.neighborhood || "-");
    row("Localidad", formData.locality || "-");
    row("Tipología", String(formData.propertyType));
    row("m² Terreno", String(formData.landArea));
    row("m² Cubiertos", String(formData.builtArea));
    row("Planos", formData.hasPlans ? "Sí" : "No");
    row("Título", String(formData.titleType));
    row("Antigüedad (años)", String(formData.age));
    row("Estado", String(formData.condition));
    row("Ubicación", String(formData.locationQuality));
    row("Orientación", String(formData.orientation));
    const services = Object.entries(formData.services).filter(([, v]) => v).map(([k]) => k).join(", ");
    row("Servicios", services || "Ninguno");
    row("Posee renta actualmente", formData.isRented ? "Sí" : "No");
    row("Fecha", formData.date || "-");

    // Foto principal si está en base64 o URL
    if (mainPhotoBase64) {
      try {
        // agregar imagen arriba derecha (x,y,w,h en mm)
        doc.addImage(mainPhotoBase64, 150, 12, 45, 34);
      } catch {
        // ignorar si falla
      }
      y += 6;
    } else if (formData.mainPhotoUrl) {
      // intentar fetch -> blob -> dataURL (puede fallar por CORS)
      try {
        const resp = await fetch(formData.mainPhotoUrl);
        const blob = await resp.blob();
        const url = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.onerror = () => reject("error leyendo blob");
          r.readAsDataURL(blob);
        });
        doc.addImage(url, 150, 12, 45, 34);
      } catch {
        // no hacer nada
      }
    }

    // Comparables
    y += 4;
    doc.setFontSize(12);
    doc.text("Propiedades comparadas", 10, y);
    y += 8;
    doc.setFontSize(10);

    for (let i = 0; i < formData.comparables.length; i++) {
      const c = formData.comparables[i];
      row(`${i + 1}) m² Cubiertos`, String(c.builtArea || 0));
      row("Precio publicado", String(c.price || 0));
      row("Link / Foto", c.listingUrl || "-");
      row("Descripción", c.description || "-");
      row("Días publicada", String(c.daysPublished || 0));
      row("Precio por m²", c.pricePerM2 ? c.pricePerM2.toFixed(2) : "0");
      row("Coeficiente", String(c.coefficient || 1));

      // si listingUrl contiene base64 (cuando cargaste foto comparable), intentar agregar
      if (c.listingUrl && c.listingUrl.startsWith("data:")) {
        try {
          if (y + 40 > 280) {
            doc.addPage();
            y = 20;
          }
          doc.addImage(c.listingUrl, 140, y - 6, 50, 38);
          y += 44;
        } catch {
          // ignore
        }
      }
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
    }

    // Secciones finales
    doc.addPage();
    let y2 = 20;
    doc.setFontSize(12);
    doc.text("Observaciones", 10, y2); y2 += 8;
    doc.setFontSize(10);
    doc.text(formData.observations || "-", 10, y2, { maxWidth: 180 }); y2 += 28;

    doc.setFontSize(12);
    doc.text("A considerar", 10, y2); y2 += 8;
    doc.setFontSize(10);
    doc.text(formData.considerations || "-", 10, y2, { maxWidth: 180 }); y2 += 28;

    doc.setFontSize(12);
    doc.text("Fortalezas", 10, y2); y2 += 8;
    doc.setFontSize(10);
    doc.text(formData.strengths || "-", 10, y2, { maxWidth: 180 }); y2 += 28;

    doc.setFontSize(12);
    doc.text("Debilidades", 10, y2); y2 += 8;
    doc.setFontSize(10);
    doc.text(formData.weaknesses || "-", 10, y2, { maxWidth: 180 });

    doc.save("informe-acm.pdf");
  };

  // --- JSX (orden y campos pedidos) ---
  return (
    <div className="max-w-4xl mx-auto p-6">
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6 bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold">Análisis Comparativo de Mercado (ACM)</h1>

        {/* Cliente / Agente / Tel / Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input name="clientName" value={formData.clientName} onChange={handleInputChange} placeholder="Cliente" className="border p-2" required />
          <input name="advisorName" value={formData.advisorName} onChange={handleInputChange} placeholder="Agente" className="border p-2" required />
          <input name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Teléfono" className="border p-2" required />
          <input name="email" value={formData.email} onChange={handleInputChange} placeholder="Email" className="border p-2" required />
        </div>

        {/* Dirección / Barrio / Localidad / Tipología */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input name="address" value={formData.address} onChange={handleInputChange} placeholder="Dirección" className="border p-2" />
          <input name="neighborhood" value={formData.neighborhood} onChange={handleInputChange} placeholder="Barrio" className="border p-2" />
          <input name="locality" value={formData.locality} onChange={handleInputChange} placeholder="Localidad" className="border p-2" />
          <select name="propertyType" value={formData.propertyType} onChange={handleInputChange} className="border p-2">
            {Object.values(PropertyType).map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        {/* m2 terreno / m2 cubiertos / planos / titulo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input type="number" name="landArea" value={formData.landArea} onChange={handleInputChange} placeholder="m² Terreno" className="border p-2" />
          <input type="number" name="builtArea" value={formData.builtArea} onChange={handleInputChange} placeholder="m² Cubiertos" className="border p-2" />
          <label className="flex items-center gap-2">
            <input type="checkbox" name="hasPlans" checked={formData.hasPlans} onChange={handleInputChange} /> Planos
          </label>
          <select name="titleType" value={formData.titleType} onChange={handleInputChange} className="border p-2">
            {Object.values(TitleType).map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        {/* antiguedad / estado / ubicacion / orientacion */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input type="number" name="age" value={formData.age} onChange={handleInputChange} placeholder="Antigüedad (años)" className="border p-2" />
          <select name="condition" value={formData.condition} onChange={handleInputChange} className="border p-2">
            {Object.values(PropertyCondition).map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select name="locationQuality" value={formData.locationQuality} onChange={handleInputChange} className="border p-2">
            {Object.values(LocationQuality).map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select name="orientation" value={formData.orientation} onChange={handleInputChange} className="border p-2">
            {Object.values(Orientation).map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        {/* servicios checklist */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {Object.keys(formData.services).map((s) => (
            <label key={s} className="inline-flex items-center gap-2">
              <input type="checkbox" checked={(formData.services as any)[s]} onChange={() => toggleService(s as keyof ACMFormData["services"])} />
              {s}
            </label>
          ))}
        </div>

        {/* renta / foto / fecha */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isRented" checked={formData.isRented} onChange={handleInputChange} /> Posee renta actualmente
          </label>

          <div>
            <label className="block mb-1">Foto principal (archivo)</label>
            <input type="file" accept="image/*" onChange={handleMainPhotoFile} />
            <div className="text-sm text-gray-600">O pegá un link abajo</div>
            <input name="mainPhotoUrl" value={formData.mainPhotoUrl} onChange={handleInputChange} placeholder="Link foto (opcional)" className="border p-2 mt-1" />
          </div>

          <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="border p-2" />
        </div>

        {/* comparables */}
        <div>
          <h2 className="font-semibold text-lg mb-2">Propiedades Comparadas en la Zona (hasta 4)</h2>
          {formData.comparables.map((c, i) => (
            <div key={i} className="border p-3 mb-3 rounded">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input type="number" placeholder="m² Cubiertos" value={c.builtArea} onChange={(e) => handleComparableChange(i, "builtArea", Number(e.target.value))} className="border p-2" />
                <input type="number" placeholder="Precio publicado (USD)" value={c.price} onChange={(e) => handleComparableChange(i, "price", Number(e.target.value))} className="border p-2" />
                <input type="text" placeholder="Link publicación / Drive" value={c.listingUrl} onChange={(e) => handleComparableChange(i, "listingUrl", e.target.value)} className="border p-2" />
              </div>

              <textarea value={c.description} onChange={(e) => handleComparableChange(i, "description", e.target.value)} placeholder="Descripción libre" className="border p-2 mt-2" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                <input type="number" placeholder="Días publicada" value={c.daysPublished} onChange={(e) => handleComparableChange(i, "daysPublished", Number(e.target.value))} className="border p-2" />
                <input readOnly placeholder="Precio / m² (calculado)" value={c.pricePerM2 ? c.pricePerM2.toFixed(2) : ""} className="border p-2 bg-gray-50" />
                <select value={c.coefficient} onChange={(e) => handleComparableChange(i, "coefficient", Number(e.target.value))} className="border p-2">
                  {[1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1].map(val => <option key={val} value={val}>{val.toFixed(1)}</option>)}
                </select>
                <div>
                  <label className="block mb-1">Foto comparable (archivo)</label>
                  <input type="file" accept="image/*" onChange={(e) => handleComparablePhotoFile(i, e)} />
                  <div className="text-sm text-gray-600 mt-1">O pegá URL en "Link publicación"</div>
                </div>
              </div>

              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => removeComparable(i)} className="bg-red-500 text-white px-3 py-1 rounded">Eliminar</button>
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <button type="button" onClick={addComparable} disabled={formData.comparables.length >= 4} className="bg-blue-600 text-white px-4 py-2 rounded">
              Agregar propiedad comparada
            </button>
          </div>
        </div>

        {/* textos libres */}
        <div>
          <h2 className="font-semibold">Redacción informe</h2>
          <textarea name="observations" value={formData.observations} onChange={handleInputChange} placeholder="Observaciones" className="border p-2 w-full my-2" />
          <textarea name="considerations" value={formData.considerations} onChange={handleInputChange} placeholder="A considerar" className="border p-2 w-full my-2" />
          <textarea name="strengths" value={formData.strengths} onChange={handleInputChange} placeholder="Fortalezas" className="border p-2 w-full my-2" />
          <textarea name="weaknesses" value={formData.weaknesses} onChange={handleInputChange} placeholder="Debilidades" className="border p-2 w-full my-2" />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={isSubmitting} className="bg-green-600 text-white px-5 py-2 rounded">
            {isSubmitting ? 'Enviando...' : 'Guardar / Enviar al backend'}
          </button>

          <button type="button" onClick={generatePDF} className="bg-gray-800 text-white px-5 py-2 rounded">
            Descargar Informe en PDF (con fotos)
          </button>
        </div>
      </form>
    </div>
  );
}

