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

/** Helper: file -> base64 dataURL */
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Error leyendo archivo"));
    reader.readAsDataURL(file);
  });

export default function ACMForm() {
  // configuración de colores (puedes cambiar aquí)
  const colors = {
    primary: "#F2C94C", // amarillo cabecera
    accent: "#F2994A",
    text: "#111827",
  };

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
    date: new Date().toISOString().slice(0, 10),
    comparables: [emptyComparable()],
    observations: "",
    considerations: "",
    strengths: "",
    weaknesses: "",
  });

  const [mainPhotoBase64, setMainPhotoBase64] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Actualiza campo por nombre (tipo safe-cast)
  const updateField = (name: keyof ACMFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Manejo genérico de inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, type } = target;
    if (type === "checkbox") {
      updateField(name as keyof ACMFormData, (target as HTMLInputElement).checked);
    } else if (type === "number") {
      updateField(name as keyof ACMFormData, Number((target as HTMLInputElement).value || 0));
    } else {
      updateField(name as keyof ACMFormData, (target as HTMLInputElement).value);
    }
  };

  // Foto principal (file) -> preview + base64
  const handleMainPhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await fileToBase64(file);
      setMainPhotoBase64(b64);
      // ponemos la base64 en mainPhotoUrl para incluir en pdf/payload
      updateField("mainPhotoUrl", b64);
    } catch (err) {
      console.error("Error leyendo foto principal", err);
    }
  };

  // toggle servicios
  const toggleService = (k: keyof ACMFormData["services"]) => {
    setFormData((prev) => ({ ...prev, services: { ...prev.services, [k]: !prev.services[k] } }));
  };

  // COMPARABLES
  const addComparable = () => {
    setFormData((prev) => (prev.comparables.length >= 4 ? prev : { ...prev, comparables: [...prev.comparables, emptyComparable()] }));
  };

  const removeComparable = (index: number) => {
    setFormData((prev) => ({ ...prev, comparables: prev.comparables.filter((_, i) => i !== index) }));
  };

  const handleComparableChange = <K extends keyof ComparableProperty>(index: number, field: K, value: ComparableProperty[K] | string | number) => {
    setFormData((prev) => {
      const copy = prev.comparables.map((c) => ({ ...c }));
      if (field === "builtArea" || field === "price" || field === "daysPublished" || field === "coefficient") {
        copy[index][field] = Number(value) as ComparableProperty[K];
      } else {
        copy[index][field] = value as ComparableProperty[K];
      }
      copy[index].pricePerM2 = copy[index].builtArea > 0 ? copy[index].price / copy[index].builtArea : 0;
      return { ...prev, comparables: copy };
    });
  };

  // foto para comparable -> lo guardo en listingUrl como dataURL (para pdf)
  const handleComparablePhotoFile = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await fileToBase64(file);
      handleComparableChange(index, "listingUrl", b64 as any);
    } catch (err) {
      console.error("Error leyendo foto comparable", err);
    }
  };

  // Envío al backend (si configurado). No obligatorio.
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { ...formData, mainPhotoBase64 };
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
      if (API_URL) {
        const res = await fetch(`${API_URL.replace(/\/$/, "")}/acm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        alert("Guardado en backend");
      } else {
        console.log("Payload (no hay API configurada):", payload);
        alert("No hay NEXT_PUBLIC_API_URL configurada. Revisa la consola.");
      }
    } catch (err: any) {
      alert("Error al enviar: " + (err?.message || String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  // GENERAR PDF con layout parecido al que enviaste
  const generatePDF = async () => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageW = 210;
    const margin = 10;
    let y = 10;

    // Cabecera: barra amarilla + logo pequeño + título
    doc.setFillColor(colors.primary);
    doc.rect(margin, y, pageW - 2 * margin, 18, "F"); // header band
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("ANÁLISIS COMPARATIVO DE MERCADO", margin + 10, y + 12);

    // Logo placeholder (lado izquierdo)
    try {
      // si tenés un logo en base64 podés agregarlo aquí
      // doc.addImage(logoBase64, "JPEG", pageW - margin - 30, y + 2, 28, 14);
    } catch (err) {
      /* ignore */
    }

    y += 24;

    // Bloque: tabla cliente / asesor / foto (3 columnas)
    const col1X = margin;
    const colGap = 6;
    const colW = (pageW - margin * 2 - colGap) * 0.5;
    const photoW = (pageW - margin * 2 - colGap) * 0.5;

    // Left column (cliente / asesor)
    const leftX = col1X;
    doc.setFontSize(10);
    const writeRow = (label: string, value: string) => {
      doc.setFont(undefined, "bold");
      doc.text(label + ":", leftX, y);
      doc.setFont(undefined, "normal");
      doc.text(String(value || "-"), leftX + 42, y);
      y += 6;
    };

    writeRow("Fecha", formData.date || "-");
    writeRow("Cliente", formData.clientName || "-");
    writeRow("Teléfono", formData.phone || "-");
    writeRow("Dirección", formData.address || "-");
    writeRow("Barrio", formData.neighborhood || "-");
    writeRow("Localidad", formData.locality || "-");

    // move y back to top of block for second column
    const topY = y - 6 * 6; // approximate rows count used above
    let currY = topY;

    // Second column (asesor / datos propiedad)
    const rightX = leftX + colW + colGap;
    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    doc.text("Asesor:", rightX, currY);
    doc.setFont(undefined, "normal");
    doc.text(String(formData.advisorName || "-"), rightX + 28, currY);
    currY += 6;
    doc.setFont(undefined, "bold"); doc.text("Email:", rightX, currY); doc.setFont(undefined, "normal"); doc.text(String(formData.email || "-"), rightX + 28, currY); currY += 6;
    doc.setFont(undefined, "bold"); doc.text("Tipología:", rightX, currY); doc.setFont(undefined, "normal"); doc.text(String(formData.propertyType || "-"), rightX + 28, currY); currY += 6;
    doc.setFont(undefined, "bold"); doc.text("m² Cubiertos:", rightX, currY); doc.setFont(undefined, "normal"); doc.text(String(formData.builtArea || 0), rightX + 36, currY); currY += 6;
    doc.setFont(undefined, "bold"); doc.text("m² Terreno:", rightX, currY); doc.setFont(undefined, "normal"); doc.text(String(formData.landArea || 0), rightX + 36, currY); currY += 6;
    doc.setFont(undefined, "bold"); doc.text("Antigüedad:", rightX, currY); doc.setFont(undefined, "normal"); doc.text(String(formData.age || 0) + " años", rightX + 36, currY); currY += 6;
    doc.setFont(undefined, "bold"); doc.text("Estado:", rightX, currY); doc.setFont(undefined, "normal"); doc.text(String(formData.condition || "-"), rightX + 36, currY); currY += 6;
    doc.setFont(undefined, "bold"); doc.text("Ubicación:", rightX, currY); doc.setFont(undefined, "normal"); doc.text(String(formData.locationQuality || "-"), rightX + 36, currY); currY += 6;
    doc.setFont(undefined, "bold"); doc.text("Orientación:", rightX, currY); doc.setFont(undefined, "normal"); doc.text(String(formData.orientation || "-"), rightX + 36, currY); currY += 6;

    // Photo column (rightmost)
    const photoX = rightX + colW - 2; // place inside right column
    const photoY = topY;
    try {
      if (formData.mainPhotoUrl && formData.mainPhotoUrl.startsWith("data:")) {
        doc.addImage(formData.mainPhotoUrl, photoX, photoY, photoW - 6, 40);
      } else if (mainPhotoBase64) {
        doc.addImage(mainPhotoBase64, photoX, photoY, photoW - 6, 40);
      } else if (formData.mainPhotoUrl) {
        // attempt fetch & convert (may fail by CORS)
        try {
          const resp = await fetch(formData.mainPhotoUrl);
          const blob = await resp.blob();
          const b64 = await new Promise<string>((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result as string);
            r.onerror = () => reject("error");
            r.readAsDataURL(blob);
          });
          doc.addImage(b64, photoX, photoY, photoW - 6, 40);
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }

    y = Math.max(y, currY) + 6;

    // Servicios (título)
    doc.setDrawColor(0);
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text("Servicios", leftX, y);
    y += 6;
    doc.setFont(undefined, "normal");
    const activeServices = Object.entries(formData.services).filter(([, v]) => v).map(([k]) => k).join(", ") || "-";
    doc.text(activeServices, leftX, y);
    y += 10;

    // Propiedades comparadas (tabla como columnas)
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.setFillColor(colors.primary);
    doc.rect(margin, y, pageW - 2 * margin, 8, "F");
    doc.setTextColor(0);
    doc.text("PROPIEDADES COMPARADAS EN LA ZONA", margin + 4, y + 6);
    y += 14;

    const comps = formData.comparables;
    const cols = comps.length || 1;
    const usableW = pageW - 2 * margin;
    const colWidth = usableW / cols;

    // header row labels vertical left (Direccion/Foto/Descripcion/Link/Fields)
    // We will draw a left column with labels and then columns for each comparable
    const leftLabelX = margin;
    let topTableY = y;
    const labelColW = 30;

    const labels = ["DIRECCIÓN", "FOTO", "DESCRIPCIÓN", "LINK", "DÍAS PUBLICADA", "M² cubiertos", "Precio USD", "Precio USD/m²", "Coeficiente"];
    // draw table labels on left
    let rowY = topTableY;
    doc.setFontSize(9);
    for (let r = 0; r < labels.length; r++) {
      doc.setFont(undefined, "bold");
      doc.text(labels[r], leftLabelX + 2, rowY + 5);
      rowY += 18;
    }

    // now fill each comparable column
    for (let i = 0; i < cols; i++) {
      const c = comps[i];
      const colX = margin + labelColW + i * colWidth;
      let cy = topTableY;

      // Dirección
      doc.setFont(undefined, "normal");
      doc.text(c.listingUrl && c.listingUrl.startsWith("data:") ? "Foto/Link" : (c.listingUrl || "-"), colX + 2, cy + 5);
      cy += 18;

      // Foto (if base64)
      if (c.listingUrl && c.listingUrl.startsWith("data:")) {
        try {
          doc.addImage(c.listingUrl, colX + 2, cy - 2, colWidth - 6, 24);
        } catch {
          // ignore
        }
      }
      cy += 26;

      // Descripción
      doc.text(c.description || "-", colX + 2, cy + 5, { maxWidth: colWidth - 6 });
      cy += 18;

      // Link (display short)
      doc.text(c.listingUrl && !c.listingUrl.startsWith("data:") ? (c.listingUrl.length > 30 ? c.listingUrl.slice(0, 30) + "..." : c.listingUrl) : "-", colX + 2, cy + 5);
      cy += 18;

      // Días publicada
      doc.text(String(c.daysPublished || 0), colX + 2, cy + 5);
      cy += 18;

      // M² cubiertos
      doc.text(String(c.builtArea || 0), colX + 2, cy + 5);
      cy += 18;

      // Precio USD
      doc.text(String(c.price || 0), colX + 2, cy + 5);
      cy += 18;

      // Precio USD/m²
      doc.text(c.pricePerM2 ? Number(c.pricePerM2).toFixed(2) : "0", colX + 2, cy + 5);
      cy += 18;

      // Coeficiente
      doc.text(String(c.coefficient ?? 1), colX + 2, cy + 5);
      cy += 18;
    }

    // compute averages and suggested price (sencillo: promedio precio y promedio pricePerM2)
    y = topTableY + labels.length * 18 + 8;
    const validPrices = comps.filter((c) => c.price > 0);
    const avgPrice = validPrices.length ? validPrices.reduce((s, c) => s + c.price, 0) / validPrices.length : 0;
    const avgPricePerM2 = comps.filter((c) => c.pricePerM2 > 0).length ? comps.reduce((s, c) => s + (c.pricePerM2 || 0), 0) / comps.length : 0;

    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    doc.text("Resumen", margin, y);
    doc.setFont(undefined, "normal");
    doc.text(`Precio promedio USD: ${avgPrice ? avgPrice.toFixed(2) : "-"}`, margin, y + 8);
    doc.text(`Precio promedio USD/m²: ${avgPricePerM2 ? Number(avgPricePerM2).toFixed(2) : "-"}`, margin, y + 16);

    // Consideraciones para coeficiente corrector (cuadro amarillo con 4 filas)
    let boxY = y + 30;
    doc.setFillColor(colors.primary);
    doc.rect(margin, boxY, 90, 40, "F");
    doc.setFont(undefined, "bold");
    doc.setTextColor(0);
    doc.text("Consideraciones para el coeficiente corrector:", margin + 2, boxY + 6);
    doc.setFont(undefined, "normal");
    const cons = ["Ubicación", "Antigüedad", "Comodidades/Distribución/Terreno", "Calidad constructiva"];
    for (let i = 0; i < cons.length; i++) {
      doc.text(`- ${cons[i]}`, margin + 4, boxY + 14 + i * 7);
    }

    // Observaciones / A considerar / Fortalezas / Debilidades en nueva página
    doc.addPage();
    let y2 = 18;
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("Observaciones", margin, y2); y2 += 8;
    doc.setFont(undefined, "normal");
    doc.text(formData.observations || "-", margin, y2, { maxWidth: pageW - 2 * margin }); y2 += 26;

    doc.setFont(undefined, "bold");
    doc.text("A considerar", margin, y2); y2 += 8;
    doc.setFont(undefined, "normal");
    doc.text(formData.considerations || "-", margin, y2, { maxWidth: pageW - 2 * margin }); y2 += 26;

    doc.setFont(undefined, "bold");
    doc.text("Fortalezas", margin, y2); y2 += 8;
    doc.setFont(undefined, "normal");
    doc.text(formData.strengths || "-", margin, y2, { maxWidth: pageW - 2 * margin }); y2 += 26;

    doc.setFont(undefined, "bold");
    doc.text("Debilidades", margin, y2); y2 += 8;
    doc.setFont(undefined, "normal");
    doc.text(formData.weaknesses || "-", margin, y2, { maxWidth: pageW - 2 * margin });

    // Guardar
    doc.save("ACM_informe.pdf");
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Análisis Comparativo de Mercado (ACM)</h1>
            <p className="text-sm text-gray-600">Fecha: <span className="font-medium">{formData.date}</span></p>
          </div>
          <div className="text-right">
            <button
              onClick={generatePDF}
              className="bg-gray-800 text-white px-4 py-2 rounded shadow hover:opacity-95"
            >
              Descargar PDF
            </button>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
          {/* DATOS PRINCIPALES */}
          <section className="bg-white shadow rounded-lg p-5">
            <h2 className="text-lg font-semibold mb-3">Datos principales</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input name="clientName" value={formData.clientName} onChange={handleInputChange} placeholder="Cliente" className="border rounded p-2" />
              <input name="advisorName" value={formData.advisorName} onChange={handleInputChange} placeholder="Asesor" className="border rounded p-2" />
              <div className="flex flex-col">
                <label className="text-sm text-gray-600">Foto principal (vista previa)</label>
                <div className="mt-1 flex items-center gap-2">
                  <input type="file" accept="image/*" onChange={handleMainPhotoFile} />
                </div>
                {formData.mainPhotoUrl && formData.mainPhotoUrl.startsWith("data:") && (
                  <img src={formData.mainPhotoUrl} alt="preview" className="mt-2 w-40 h-28 object-cover border rounded" />
                )}
              </div>

              <input name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Teléfono" className="border rounded p-2" />
              <input name="email" value={formData.email} onChange={handleInputChange} placeholder="Email" className="border rounded p-2" />
              <input name="address" value={formData.address} onChange={handleInputChange} placeholder="Dirección" className="border rounded p-2" />

              <input name="neighborhood" value={formData.neighborhood} onChange={handleInputChange} placeholder="Barrio" className="border rounded p-2" />
              <input name="locality" value={formData.locality} onChange={handleInputChange} placeholder="Localidad" className="border rounded p-2" />
              <select name="propertyType" value={formData.propertyType} onChange={handleInputChange} className="border rounded p-2">
                {Object.values(PropertyType).map((v) => <option key={v} value={v}>{v}</option>)}
              </select>

              {/* m2 terreno / cubiertos / planos / titulo */}
              <input type="number" name="landArea" value={formData.landArea} onChange={handleInputChange} placeholder="m² Terreno" className="border rounded p-2" />
              <input type="number" name="builtArea" value={formData.builtArea} onChange={handleInputChange} placeholder="m² Cubiertos" className="border rounded p-2" />
              <select name="titleType" value={formData.titleType} onChange={handleInputChange} className="border rounded p-2">
                {Object.values(TitleType).map((v) => <option key={v} value={v}>{v}</option>)}
              </select>

              {/* antiguedad / estado / ubicacion / orientacion */}
              <input type="number" name="age" value={formData.age} onChange={handleInputChange} placeholder="Antigüedad (años)" className="border rounded p-2" />
              <select name="condition" value={formData.condition} onChange={handleInputChange} className="border rounded p-2">
                {Object.values(PropertyCondition).map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
              <select name="locationQuality" value={formData.locationQuality} onChange={handleInputChange} className="border rounded p-2">
                {Object.values(LocationQuality).map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
              <select name="orientation" value={formData.orientation} onChange={handleInputChange} className="border rounded p-2">
                {Object.values(Orientation).map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </section>

          {/* SERVICIOS */}
          <section className="bg-white shadow rounded-lg p-5">
            <h2 className="text-lg font-semibold mb-3">Servicios</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {Object.keys(formData.services).map((s) => (
                <label key={s} className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={(formData.services as any)[s]} onChange={() => toggleService(s as keyof ACMFormData["services"])} />
                  <span className="capitalize">{s}</span>
                </label>
              ))}
            </div>
          </section>

          {/* COMPARABLES */}
          <section className="bg-white shadow rounded-lg p-5">
            <h2 className="text-lg font-semibold mb-3">Propiedades comparadas en la zona (máx 4)</h2>
            {formData.comparables.map((c, i) => (
              <div key={i} className="border rounded p-3 mb-3 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input type="number" placeholder="m² Cubiertos" value={c.builtArea} onChange={(e) => handleComparableChange(i, "builtArea", Number(e.target.value))} className="border rounded p-2" />
                  <input type="number" placeholder="Precio USD" value={c.price} onChange={(e) => handleComparableChange(i, "price", Number(e.target.value))} className="border rounded p-2" />
                  <input placeholder="Link publicación / Drive" value={c.listingUrl} onChange={(e) => handleComparableChange(i, "listingUrl", e.target.value)} className="border rounded p-2" />
                </div>

                <textarea placeholder="Descripción" value={c.description} onChange={(e) => handleComparableChange(i, "description", e.target.value)} className="border rounded p-2 mt-2" />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 items-center">
                  <input type="number" placeholder="Días publicada" value={c.daysPublished} onChange={(e) => handleComparableChange(i, "daysPublished", Number(e.target.value))} className="border rounded p-2" />
                  <input readOnly placeholder="Precio / m²" value={c.pricePerM2 ? c.pricePerM2.toFixed(2) : ""} className="border rounded p-2 bg-white" />
                  <select value={c.coefficient} onChange={(e) => handleComparableChange(i, "coefficient", Number(e.target.value))} className="border rounded p-2">
                    {[1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1].map((val) => <option key={val} value={val}>{val.toFixed(1)}</option>)}
                  </select>
                  <div>
                    <label className="block text-sm mb-1">Foto</label>
                    <input type="file" accept="image/*" onChange={(e) => handleComparablePhotoFile(i, e)} />
                    {c.listingUrl && c.listingUrl.startsWith("data:") && <img src={c.listingUrl} alt={`comp-${i}`} className="mt-2 w-28 h-20 object-cover rounded border" />}
                  </div>
                </div>

                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => removeComparable(i)} className="bg-red-500 text-white px-3 py-1 rounded">Eliminar</button>
                </div>
              </div>
            ))}

            <div className="flex gap-2">
              <button type="button" onClick={addComparable} disabled={formData.comparables.length >= 4} className="bg-blue-600 text-white px-4 py-2 rounded">
                Agregar comparable
              </button>
            </div>
          </section>

          {/* REDACCIÓN */}
          <section className="bg-white shadow rounded-lg p-5">
            <h2 className="text-lg font-semibold mb-3">Redacción del informe</h2>
            <textarea name="observations" placeholder="Observaciones" value={formData.observations} onChange={handleInputChange} className="border rounded p-2 w-full mb-2" />
            <textarea name="considerations" placeholder="A considerar" value={formData.considerations} onChange={handleInputChange} className="border rounded p-2 w-full mb-2" />
            <textarea name="strengths" placeholder="Fortalezas" value={formData.strengths} onChange={handleInputChange} className="border rounded p-2 w-full mb-2" />
            <textarea name="weaknesses" placeholder="Debilidades" value={formData.weaknesses} onChange={handleInputChange} className="border rounded p-2 w-full mb-2" />
          </section>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => generatePDF()} className="bg-gray-800 text-white px-5 py-2 rounded">Descargar PDF</button>
            <button type="submit" disabled={isSubmitting} className="bg-green-600 text-white px-5 py-2 rounded">{isSubmitting ? "Enviando..." : "Guardar / Enviar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
