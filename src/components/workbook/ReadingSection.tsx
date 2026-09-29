import React, { useState, useEffect } from 'react';
import { apiUrl } from '@/services/apiConfig';

interface ReadingSectionProps {
  claseId: string;
}

export const ReadingSection: React.FC<ReadingSectionProps> = ({ claseId }) => {
  const [textoBase, setTextoBase] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchTextoBase = async () => {
      try {
        // AGREGAR TIMESTAMP PARA EVITAR CACHÉ
        const response = await fetch(
          apiUrl(`/api/v1/textos-base?clase_id=${encodeURIComponent(claseId)}&t=${Date.now()}`),
          { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } }
        );
        const data = await response.json();

        if (data.success && data.texto) {
          setTextoBase(data.texto);
          // Guardar en localStorage con versión
          try {
            localStorage.setItem(
              `texto_${claseId}`,
              JSON.stringify({
                ...data.texto,
                version: Date.now()
              })
            );
          } catch {}
        }
      } catch (error) {
        console.error('Error al cargar texto base:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTextoBase();
  }, [claseId]);

  if (loading) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-slate-500 text-center animate-pulse">
        Cargando texto base desde Google Sheets...
      </div>
    );
  }

  if (!textoBase) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-700 text-center">
        No se encontró texto para esta clase.
      </div>
    );
  }

  return (
    <div className="bg-blue-50/80 border-2 border-blue-200 rounded-xl p-6 mb-6 shadow-sm">
      <h2 className="text-xl font-bold text-blue-900 mb-3 tracking-tight">
        {textoBase.titulo_texto || textoBase.titulo}
      </h2>
      <p className="text-slate-800 leading-relaxed whitespace-pre-line text-base sm:text-lg">
        {textoBase.contenido_texto || textoBase.contenido}
      </p>
      <div className="mt-4 pt-3 border-t border-blue-100 flex flex-wrap gap-4 text-xs font-semibold text-blue-700">
        <span>📊 {textoBase.palabras_count} palabras</span>
        <span>⏱️ {textoBase.tiempo_audio_seg}s de audio</span>
      </div>
    </div>
  );
};

export default ReadingSection;

