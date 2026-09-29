import React, { useEffect } from 'react';
import { AccordionSection } from './AccordionSection';
import { stopSpeech } from '@/utils/workbook/audioFeedback';
import { AudioControl } from './AudioControl';

interface ClassTheoryAccordionProps {
  claseId: string;
}

export const SECTION_SCRIPTS: Record<number, { title: string; text: string }> = {
  1: {
    title: '1. Singular vs. Plural',
    text: 'Sección uno. Singular versus Plural. El primer paso para pensar en inglés consiste en clasificar todo elemento del entorno según su número gramatical. Singular se refiere estrictamente a una sola entidad: student, book, teacher. Plural representa a dos o más entidades. La regla general es añadir s o es: students, books, teachers.',
  },
  2: {
    title: '2. El Filtro Maestro R.O.D.',
    text: 'Sección dos. El Filtro Maestro R.O.D. Procesamiento de pronombres personales a través de tres canales lógicos. Canal Azul, primera persona: I, que significa Yo, el emisor. Canal Verde, bloque plural: You, We, They. Regla de oro de TecLingo: You siempre se clasifica y se procesa estructuralmente como plural. Canal Naranja, tercera persona singular: He, She, It, que son las entidades externas.',
  },
  3: {
    title: '3. La Regla de Oro Sintáctica',
    text: 'Sección tres. La Regla de Oro Sintáctica: El Sujeto Obligatorio. En inglés nunca se omite el sujeto. En español decimos "Es un libro", omitiendo el sujeto. En inglés es estrictamente obligatorio declarar: It is a book.',
  },
  4: {
    title: '4. Tabla de Conexión Direccional',
    text: 'Sección cuatro. Tabla de Conexión Direccional hacia el Verbo To Be. Conectamos los pronombres clasificados con el verbo. Canal Azul: I se conecta con am. Canal Verde plural: You, We, They se conectan con are. Canal Naranja singular: He, She, It se conectan con is.',
  },
};

export const ClassTheoryAccordion: React.FC<ClassTheoryAccordionProps> = ({ claseId }) => {
  // Unmount cleanup: cancel any speech
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  const fullScript = `Lección Fase Cero TecLingo. Fundamentos de singular, plural y pronombres. ${SECTION_SCRIPTS[1].text} ${SECTION_SCRIPTS[2].text} ${SECTION_SCRIPTS[3].text} ${SECTION_SCRIPTS[4].text}`;

  return (
    <AccordionSection
      number="3"
      title={`Fundamentos de la Clase (${claseId})`}
      subtitle="4 secciones colapsables · Todas inician cerradas por defecto"
      badge="Teoría"
      colorScheme="indigo"
      defaultOpen={false}
      headerActions={
        <AudioControl
          id={`theory-full-${claseId}`}
          text={fullScript}
          lang="es-MX"
          rate={0.95}
          label="Teacher Virtual"
          variant="pill"
          size="sm"
        />
      }
    >
      <div className="space-y-3.5">
        {/* Sub-sección 3.1: Singular vs Plural */}
        <AccordionSection
          number="1"
          title="Singular vs. Plural"
          subtitle="Clasificación de cantidad (UNO vs VARIOS)"
          defaultOpen={false}
          headerActions={
            <AudioControl
              id={`theory-sec-1-${claseId}`}
              text={SECTION_SCRIPTS[1].text}
              lang="es-MX"
              rate={0.95}
              size="sm"
            />
          }
        >
          <p className="text-gray-700 text-sm mb-3.5 leading-relaxed">
            El primer paso para pensar en inglés consiste en clasificar todo elemento del entorno según su número gramatical:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 sm:p-4">
              <h5 className="font-bold text-blue-800 text-sm mb-2 flex items-center gap-1.5">
                <span>🔵</span> SINGULAR (UNO)
              </h5>
              <p className="text-gray-700 text-xs mb-2.5">Una sola entidad observable.</p>
              <ul className="space-y-1.5 text-xs sm:text-sm text-gray-800">
                <li className="flex items-center gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <strong className="text-gray-900 font-mono bg-white px-2 py-0.5 rounded border border-blue-200">"student"</strong>
                  <span className="text-gray-600 text-xs">(estudiante)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <strong className="text-gray-900 font-mono bg-white px-2 py-0.5 rounded border border-blue-200">"book"</strong>
                  <span className="text-gray-600 text-xs">(libro)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <strong className="text-gray-900 font-mono bg-white px-2 py-0.5 rounded border border-blue-200">"classroom"</strong>
                  <span className="text-gray-600 text-xs">(aula / salón)</span>
                </li>
              </ul>
            </div>

            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 sm:p-4">
              <h5 className="font-bold text-emerald-800 text-sm mb-2 flex items-center gap-1.5">
                <span>🟢</span> PLURAL (VARIOS)
              </h5>
              <p className="text-gray-700 text-xs mb-2.5">Dos o más entidades. Regla estándar: agregar <code className="text-emerald-800 font-bold font-mono">-s</code> o <code className="text-emerald-800 font-bold font-mono">-es</code>.</p>
              <ul className="space-y-1.5 text-xs sm:text-sm text-gray-800">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <strong className="text-gray-900 font-mono bg-white px-2 py-0.5 rounded border border-emerald-200">"students"</strong>
                  <span className="text-gray-600 text-xs">(estudiantes)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <strong className="text-gray-900 font-mono bg-white px-2 py-0.5 rounded border border-emerald-200">"books"</strong>
                  <span className="text-gray-600 text-xs">(libros)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <strong className="text-gray-900 font-mono bg-white px-2 py-0.5 rounded border border-emerald-200">"teachers"</strong>
                  <span className="text-gray-600 text-xs">(profesores)</span>
                </li>
              </ul>
            </div>
          </div>
        </AccordionSection>

        {/* Sub-sección 3.2: El Filtro Maestro R.O.D. */}
        <AccordionSection
          number="2"
          title="El Filtro Maestro R.O.D."
          subtitle="Procesamiento de Pronombres (3 canales)"
          defaultOpen={false}
          headerActions={
            <AudioControl
              id={`theory-sec-2-${claseId}`}
              text={SECTION_SCRIPTS[2].text}
              lang="es-MX"
              rate={0.95}
              size="sm"
            />
          }
        >
          <p className="text-gray-700 text-sm mb-3.5 leading-relaxed">
            El sistema procesa los 7 pronombres personales a través de tres canales lógicos e inflexibles:
          </p>
          <div className="space-y-3">
            <div className="bg-blue-50/90 border-l-4 border-blue-600 p-3.5 rounded-r-xl border-y border-r border-blue-200">
              <h5 className="font-bold text-blue-800 text-sm">🔵 CANAL AZUL (1ra Persona)</h5>
              <p className="text-gray-800 text-xs sm:text-sm mt-1">
                <strong>Pronombre:</strong> <code className="text-blue-800 bg-blue-100 px-2 py-0.5 rounded font-mono font-bold">"I"</code> (Yo)
              </p>
              <p className="text-gray-600 text-xs mt-1">
                Representa exclusivamente al emisor activo del mensaje.
              </p>
            </div>

            <div className="bg-emerald-50/90 border-l-4 border-emerald-600 p-3.5 rounded-r-xl border-y border-r border-emerald-200">
              <h5 className="font-bold text-emerald-800 text-sm">🟢 CANAL VERDE (Bloque Plural)</h5>
              <p className="text-gray-800 text-xs sm:text-sm mt-1">
                <strong>Pronombres:</strong>{' '}
                <code className="text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-mono font-bold">"You"</code>,{' '}
                <code className="text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-mono font-bold">"We"</code>,{' '}
                <code className="text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-mono font-bold">"They"</code>
              </p>
              <p className="text-emerald-900 text-xs mt-1.5 bg-emerald-100/80 p-2.5 rounded-lg border border-emerald-300">
                <strong>Regla de Oro TecLingo:</strong> "You" siempre se clasifica dentro del bloque de los Plurales por su comportamiento gramatical.
              </p>
            </div>

            <div className="bg-amber-50/90 border-l-4 border-amber-500 p-3.5 rounded-r-xl border-y border-r border-amber-200">
              <h5 className="font-bold text-amber-800 text-sm">🟠 CANAL NARANJA (3ra Persona Singular)</h5>
              <p className="text-gray-800 text-xs sm:text-sm mt-1">
                <strong>Pronombres:</strong>{' '}
                <code className="text-amber-900 bg-amber-100 px-2 py-0.5 rounded font-mono font-bold">"He"</code>,{' '}
                <code className="text-amber-900 bg-amber-100 px-2 py-0.5 rounded font-mono font-bold">"She"</code>,{' '}
                <code className="text-amber-900 bg-amber-100 px-2 py-0.5 rounded font-mono font-bold">"It"</code>
              </p>
              <p className="text-gray-600 text-xs mt-1">
                Entidades singulares fuera de la interacción directa entre emisor y receptor.
              </p>
            </div>
          </div>
        </AccordionSection>

        {/* Sub-sección 3.3: La Regla de Oro Sintáctica */}
        <AccordionSection
          number="3"
          title="La Regla de Oro Sintáctica"
          subtitle="El Sujeto Obligatorio en inglés"
          defaultOpen={false}
          headerActions={
            <AudioControl
              id={`theory-sec-3-${claseId}`}
              text={SECTION_SCRIPTS[3].text}
              lang="es-MX"
              rate={0.95}
              size="sm"
            />
          }
        >
          <p className="text-gray-700 text-sm mb-3.5 leading-relaxed">
            A diferencia del español, donde es muy común omitir el sujeto, en inglés la omisión del pronombre o sujeto es estrictamente incorrecta:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 sm:p-4">
              <h5 className="font-bold text-rose-700 text-sm mb-1.5 flex items-center gap-1.5">
                <span>❌</span> Español (sujeto elidido)
              </h5>
              <p className="text-gray-900 text-base font-medium italic">"Es un libro."</p>
              <p className="text-rose-700 text-xs mt-2">
                En español el sujeto está implícito y se omite.
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 sm:p-4">
              <h5 className="font-bold text-emerald-800 text-sm mb-1.5 flex items-center gap-1.5">
                <span>✅</span> Inglés (estructura obligatoria)
              </h5>
              <p className="text-gray-900 text-base font-mono font-bold">"It is a book."</p>
              <p className="text-emerald-800 text-xs mt-2">
                Es obligatorio declarar <strong className="text-gray-900 font-mono">"It"</strong>. Sujetos como "it" nunca deben omitirse.
              </p>
            </div>
          </div>
        </AccordionSection>

        {/* Sub-sección 3.4: Tabla de Conexión Direccional */}
        <AccordionSection
          number="4"
          title="Tabla de Conexión Direccional"
          subtitle="Fase Cero → Verbo To Be"
          defaultOpen={false}
          headerActions={
            <AudioControl
              id={`theory-sec-4-${claseId}`}
              text={SECTION_SCRIPTS[4].text}
              lang="es-MX"
              rate={0.95}
              size="sm"
            />
          }
        >
          <p className="text-gray-700 text-sm mb-3.5 leading-relaxed">
            Esta matriz visual integra los cimientos de la Fase Cero con la conjugación en tiempo presente del Verbo To Be:
          </p>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-xs">
            <table className="w-full text-xs sm:text-sm text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 uppercase tracking-wider text-[11px]">
                  <th className="p-3 font-semibold">CLASIFICACIÓN</th>
                  <th className="p-3 font-semibold">PRONOMBRES</th>
                  <th className="p-3 font-semibold">VERBO</th>
                  <th className="p-3 font-semibold hidden md:table-cell">EJEMPLO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-800">
                <tr className="hover:bg-blue-50/50 transition-colors">
                  <td className="p-3 font-semibold text-blue-700 whitespace-nowrap">
                    1ra Persona (Singular)
                  </td>
                  <td className="p-3 font-mono font-bold text-gray-900">"I"</td>
                  <td className="p-3 font-mono font-bold text-emerald-700">"am"</td>
                  <td className="p-3 text-gray-700 hidden md:table-cell">"I am a student."</td>
                </tr>
                <tr className="hover:bg-emerald-50/50 transition-colors">
                  <td className="p-3 font-semibold text-emerald-700 whitespace-nowrap">
                    2das Personas (Plurales)
                  </td>
                  <td className="p-3 font-mono font-bold text-gray-900">"You, We, They"</td>
                  <td className="p-3 font-mono font-bold text-emerald-700">"are"</td>
                  <td className="p-3 text-gray-700 hidden md:table-cell">"They are friends."</td>
                </tr>
                <tr className="hover:bg-amber-50/50 transition-colors">
                  <td className="p-3 font-semibold text-amber-800 whitespace-nowrap">
                    3ras Personas (Singulares)
                  </td>
                  <td className="p-3 font-mono font-bold text-gray-900">"He, She, It"</td>
                  <td className="p-3 font-mono font-bold text-emerald-700">"is"</td>
                  <td className="p-3 text-gray-700 hidden md:table-cell">"He is a teacher."</td>
                </tr>
              </tbody>
            </table>
          </div>
        </AccordionSection>
      </div>
    </AccordionSection>
  );
};

