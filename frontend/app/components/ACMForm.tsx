// app/components/ACMForm.tsx
'use client';

import React, { useState } from 'react';
import {
  ACMFormData,
  ComparableProperty,
  PropertyType,
  Orientation,
  LocationQuality,
  PropertyCondition,
  TitleType,
} from '../types/acm.types';
import { createACMAnalysis } from '../lib/api'; // si lo tenés, sino no importa
import jsPDF from 'jspdf';

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });

export default function ACMForm() {
  const [formData, setFormData] = useState<ACMFormData>({
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
    orientation: Orientation.NORTE,
    services: { luz: false, agua: false, gas: false, cloacas: false, pavimento: false },
    isRented: false,
    mainPhotoUrl: '',
    mainPhotoBase64: undefined,
    date: new Date().toISOString().split('T')[0],
    comparables: [],
    observations: '',
    considerations: '',
    strengths: '',
    weaknesses: '',
  });

  const [comparables, setComparables] = useState<ComparableProperty[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // manejo genérico de inputs (incluye checkbox y number)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const newValue: any =
      type === 'checkbox' ? (e.target as HTMLInputElement).checked :
      type === 'number' ? Number((e.target as HTMLInputElement).value) :
      value;
    setFormData(prev => ({ ...(prev as any), [name]: newValue } as ACMFormData));
  };

  // archivo foto principal
  const handleMainPhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await fileToBase64(file);
      setFormData(prev => ({ ...prev, mainPhotoBase64: b64, mainPhotoUrl: '' }));
    } catch (err) {
      console.error('error reading main photo', err);
    }
  };

  // agregar comparable vacío (máx 4)
  const addComparable = () => {
    if (comparables.length >= 4) return;
    setComparables(prev => [
      ...prev,
      {
        builtArea: 0,
        price: 0,
        listingUrl: '',
        description: '',
        daysPublished: 0,
        pricePerM2: 0,
        coefficient: 1,
      },
    ]);
  };

  const removeComparable = (index: number) => {
    setComparables(prev => prev.filter((_, i) => i !== index));
  };

  // actualizar campo de comparable
  const updateComparableField = (index: number, field: keyof ComparableProperty, value: any) => {
    setComparables(prev => {
      const copy = [...prev];
      if (field === 'builtArea' || field === 'price' || field === 'daysPublished' || field === 'coefficient') {
        copy[index][field] = Number(value) || 0;
      } else {
        copy[index][field] = value;
      }
      // recalcular pricePerM2
      copy[index].pricePerM2 = copy[index].builtArea > 0 ? copy[index].price / copy[index].builtArea : 0;
      return copy;
    });
  };

  // subir foto para comparable (file -> base64)
  const handleComparablePhotoFile = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    setComparables(prev => {
      const copy = [...prev];
      copy[index].photoBase64 = b64;
      return copy;
    });
  };

  // Generar PDF (incluye imágenes si hay base64)
  const generatePDF = async () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    doc.setFontSize(14);
    doc.text('Informe ACM - Análisis Comparativo de Mercado', 10, 12);

    // Foto principal (arriba derecha)
    if (formData.mainPhotoBase64) {
      try {
        doc.addImage(formData.mainPhotoBase64, 'JPEG' as any, 150, 10, 45, 34); // x,y,w,h
      } catch (err) {
        // si no es jpeg, jsPDF aceptará dataurl con tipo
        try { doc.addImage(formData.mainPhotoBase64 as any, 150, 10, 45, 34); } catch {}
      }
    } else if (formData.mainPhotoUrl) {
      // opcional: intentar cargar la URL (puede fallar por CORS)
      try {
        const res = await fetch(formData.mainPhotoUrl);
        const blob = await res.blob();
        const b64 = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.onerror = reject;
          r.readAsDataURL(blob);
        });
        doc.addImage(b64, 'JPEG' as any, 150, 10, 45, 34);
      } catch {}
    }

    doc.setFontSize(11);
    let y = 26;
    const row = (label: string, value: string) => {
      doc.text(`${label}: ${value}`, 10, y);
      y += 6;
      if (y > 260) { doc.addPage(); y = 20; }
    };

    // Datos (en el orden pedido)
    row('Cliente', formData.clientName || '-');
    row('Agente', formData.advisorName || '-');
    row('Teléfono', formData.phone || '-');
    row('Email', formData.email || '-');
    row('Dirección', formData.address || '-');
    row('Barrio', formData.neighborhood || '-');
    row('Localidad', formData.locality || '-');
    row('Tipología', formData.propertyType || '-');
    row('m² Terreno', String(formData.landArea || 0));
    row('m² Cubiertos', String(formData.builtArea || 0));
    row('Planos', formData.hasPlans ? 'Sí' : 'No');
    row('Título', formData.titleType || '-');
    row('Antigüedad (años)', String(formData.age || 0));
    row('Estado', formData.condition || '-');
    row('Ubicación', formData.locationQuality || '-');
    row('Orientación', formData.orientation || '-');

    const servicesList = Object.entries(formData.services)
      .filter(([_, v]) => v)
      .map(([k]) => k)
      .join(', ');
    row('Servicios', servicesList || 'Ninguno');
    row('Posee renta actualmente', formData.isRented ? 'Sí' : 'No');
    row('Fecha', formData.date || '-');

    // Comparables
    y += 4;
    doc.setFontSize(12);
    doc.text('Propiedades Comparadas en la Zona', 10, y);
    y += 8;
    doc.setFontSize(10);

    for (let i = 0; i < comparables.length; i++) {
      const c = comparables[i];
      row(`${i + 1}) m² Cubiertos`, String(c.builtArea || 0));
      row('Precio publicado (USD)', String(c.price || 0));
      row('Link publicación / Drive', c.listingUrl || '-');
      row('Descripción', c.description || '-');
      row('Días publicada', String(c.daysPublished || 0));
      row('Precio por m²', c.pricePerM2 ? c.pricePerM2.toFixed(2) : '0');
      row('Coeficiente (0.1-1)', String(c.coefficient || 1));

      // imagen comparable si existe (colocada a la derecha)
      if (c.photoBase64) {
        try {
          if (y + 40 > 280) { doc.addPage(); y = 20; }
          doc.addImage(c.photoBase64 as any, 'JPEG' as any, 140, y - 6, 50, 38);
        } catch { try { doc.addImage(c.photoBase64 as any, 140, y - 6, 50, 38); } catch {} }
        y += 44;
      } else {
        y += 4;
      }
      if (y > 260) { doc.addPage(); y = 20; }
    }

    // Observaciones y secciones
    doc.addPage();
    let y2 = 20;
    doc.setFontSize(12);
    doc.text('Observaciones', 10, y2); y2 += 8;
    doc.setFontSize(10);
    doc.text(formData.observations || '-', 10, y2, { maxWidth: 180 }); y2 += 24;

    doc.setFontSize(12);
    doc.text('A considerar', 10, y2); y2 += 8;
    doc.setFontSize(10);
    doc.text(formData.considerations || '-', 10, y2, { maxWidth: 180 }); y2 += 24;

    doc.setFontSize(12);
    doc.text('Fortalezas', 10, y2); y2 += 8;
    doc.setFontSize(10);
    doc.text(formData.strengths || '-', 10, y2, { maxWidth: 180 }); y2 += 24;

    doc.setFontSize(12);
    doc.text('Debilidades', 10, y2); y2 += 8;
    doc.setFontSize(10);
    doc.text(formData.weaknesses || '-', 10, y2, { maxWidth: 180 });

    doc.save('informe-acm.pdf');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      // guardamos comparables en formData antes de enviar
      const payload: ACMFormData = { ...formData, comparables };
      // si tenés backend, descomenta la siguiente línea y ajusta createACMAnalysis
      // const res = await createACMAnalysis(payload);
      // setResult(res);
      console.log('Payload (ACM):', payload);
      alert('Datos listos. Si tenés backend, los enviará al endpoint.');
    } catch (err: any) {
      setError(err?.message || 'Error al crear análisis');
    } finally {
      setIsSubmitting(false);
    }
  };

  // UI (orden EXACTO solicitado)
  return (
    <div className="max-w-4xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold">Análisis Comparativo de Mercado (ACM)</h1>

        {/* Cliente / Agente / Teléfono / Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input name="clientName" value={formData.clientName} onChange={handleInputChange} placeholder="Cliente" className="border p-2" required />
          <input name="advisorName" value={formData.advisorName} onChange={handleInputChange} placeholder="Agente" className="border p-2" required />
          <input name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Teléfono" className="border p-2" required />
          <input name="email" value={formData.email} onChange={handleInputChange} placeholder="Email" type="email" className="border p-2" required />
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

        {/* m2 terreno / m2 cubiertos / planos (si/no) / titulo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input name="landArea" value={formData.landArea} onChange={handleInputChange} placeholder="m² Terreno" type="number" className="border p-2" />
          <input name="builtArea" value={formData.builtArea} onChange={handleInputChange} placeholder="m² Cubiertos" type="number" className="border p-2" />
          <label className="flex items-center gap-2">
            <input name="hasPlans" checked={formData.hasPlans} onChange={handleInputChange} type="checkbox" /> Planos
          </label>
          <select name="titleType" value={formData.titleType} onChange={handleInputChange} className="border p-2">
            {Object.values(TitleType).map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        {/* antiguedad / estado / ubicacion / servicios (checklist) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input name="age" value={formData.age} onChange={handleInputChange} placeholder="Antigüedad (años)" type="number" className="border p-2" />
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
              <input
                type="checkbox"
                checked={(formData.services as any)[s]}
                onChange={() => setFormData(prev => ({ ...prev, services: { ...(prev.services as any), [s]: !(prev.services as any)[s] } } as ACMFormData))}
              />
              {s}
            </label>
          ))}
        </div>

        {/* posee renta / foto / fecha */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="flex items-center gap-2">
            <input name="isRented" type="checkbox" checked={formData.isRented} onChange={handleInputChange} /> Posee renta actualmente
          </label>

          <div>
            <label className="block mb-1">Foto principal (archivo)</label>
            <input type="file" accept="image/*" onChange={handleMainPhotoFile} />
            <div className="text-sm text-gray-600">También podés pegar URL en "Link foto" abajo</div>
            <input name="mainPhotoUrl" value={formData.mainPhotoUrl} onChange={handleInputChange} placeholder="Link foto (opcional)" className="border p-2 mt-1" />
          </div>

          <input name="date" type="date" value={formData.date} onChange={handleInputChange} className="border p-2" />
        </div>

        {/* Propiedades comparadas (hasta 4) */}
        <div>
          <h2 className="font-semibold text-lg mb-2">Propiedades Comparadas en la Zona (hasta 4)</h2>
          {comparables.map((c, i) => (
            <div key={i} className="border p-3 mb-3 rounded">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input value={c.builtArea} onChange={e => updateComparableField(i, 'builtArea', Number(e.target.value))} placeholder="m² Cubiertos" type="number" className="border p-2" />
                <input value={c.price} onChange={e => updateComparableField(i, 'price', Number(e.target.value))} placeholder="Precio publicado (USD)" type="number" className="border p-2" />
                <input value={c.listingUrl} onChange={e => updateComparableField(i, 'listingUrl', e.target.value)} placeholder="Link publicación / Drive" className="border p-2" />
              </div>

              <textarea value={c.description} onChange={e => updateComparableField(i, 'description', e.target.value)} placeholder="Descripción libre" className="border p-2 mt-2" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                <input value={c.daysPublished} onChange={e => updateComparableField(i, 'daysPublished', Number(e.target.value))} placeholder="Días publicada" type="number" className="border p-2" />
                <input value={c.pricePerM2} readOnly placeholder="Precio / m² (calculado)" className="border p-2 bg-gray-50" />
                <input value={c.coefficient} min={0.1} max={1} step={0.1} onChange={e => updateComparableField(i, 'coefficient', Number(e.target.value))} placeholder="Coeficiente (0.1-1)" type="number" className="border p-2" />
                <div>
                  <label className="block mb-1">Foto comparable (archivo)</label>
                  <input type="file" accept="image/*" onChange={e => handleComparablePhotoFile(i, e)} />
                  <input value={c.photoUrl || ''} onChange={e => updateComparableField(i, 'photoUrl', e.target.value)} placeholder="o URL de la foto" className="border p-2 mt-1" />
                </div>
              </div>

              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => removeComparable(i)} className="bg-red-500 text-white px-3 py-1 rounded">Eliminar</button>
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <button type="button" onClick={addComparable} disabled={comparables.length >= 4} className="bg-blue-600 text-white px-4 py-2 rounded">
              Agregar propiedad comparada
            </button>
          </div>
        </div>

        {/* Texto libre para informe */}
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

        {error && <div className="text-red-600">{error}</div>}
        {result && <pre className="bg-gray-100 p-3 rounded">{JSON.stringify(result, null, 2)}</pre>}
      </form>
    </div>
  );
}
