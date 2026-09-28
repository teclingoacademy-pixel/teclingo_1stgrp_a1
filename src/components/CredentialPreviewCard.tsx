/**
 * CredentialPreviewCard.tsx
 * Vista previa en pantalla de la Credencial Institucional.
 * Mismo diseño que el PDF (formato vertical CR80 54×85.6 mm).
 */
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export type CredentialRole = 'ALUMNO' | 'DOCENTE' | 'DIRECTOR';

export interface CredentialPreviewData {
  name?: string;
  role?: CredentialRole;
  roleLabel?: string;
  institutionName?: string;
  institutionLogo?: string;
  institutionCode?: string;
  controlLabel?: string;
  controlValue?: string;
  nivel?: string;
  grupo?: string | { nombre?: string; grupo?: string; nivel?: string };
  modalidad?: string;
  career?: string;
  semestre?: string;
  modulo?: string;
  avatar?: string;
  slogan?: string;
  verified?: boolean;
  chips?: string[];
  userId?: string;
}

interface Props {
  data: CredentialPreviewData;
}

const ACCENT: Record<CredentialRole, string> = {
  ALUMNO: '#22D3EE',
  DIRECTOR: '#DEFF9A',
  DOCENTE: '#4ADE80',
};

function defaultRoleLabel(r: CredentialRole): string {
  if (r === 'ALUMNO') return 'ALUMNO';
  if (r === 'DIRECTOR') return 'DIRECTOR ACADÉMICO';
  return 'DOCENTE';
}

export function CredentialPreviewCard({ data }: Props) {
  const role: CredentialRole = data.role || 'DIRECTOR';
  const accent = ACCENT[role];
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const value = data.userId || data.institutionCode || data.name || 'teclingo';
    let cancelled = false;
    QRCode.toDataURL(value, {
      width: 320,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#061a1aff', light: '#ffffffff' },
    })
      .then((url) => { if (!cancelled) setQrDataUrl(url); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [data.userId, data.institutionCode, data.name]);

  const chips: string[] = [];
  if (typeof data.grupo === 'string' && data.grupo) chips.push(`GRP ${data.grupo}`);
  else if (data.grupo && typeof data.grupo === 'object') {
    const label = data.grupo.grupo || data.grupo.nombre;
    if (label) chips.push(`GRP ${label}`);
  }
  if (data.nivel) chips.push(`NIVEL ${data.nivel}`);
  if (data.semestre) chips.push(`SEM ${data.semestre}`);
  if (data.modulo) chips.push(`MÓD ${data.modulo}`);
  if (data.modalidad) chips.push(data.modalidad);
  if (data.career) chips.push(data.career);
  if (Array.isArray(data.chips)) chips.push(...data.chips);

  const verifiedLabel =
    role === 'ALUMNO' ? 'STUDENT' : role === 'DIRECTOR' ? 'DIRECTOR' : 'DOCENTE';

  return (
    <div
      className="shadow-2xl"
      style={{
        width: '100%',
        maxWidth: 320,
        aspectRatio: '54 / 85.6',
        background: '#061a1a',
        border: `1.5px solid ${accent}`,
        borderRadius: 16,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ height: 4, background: accent }} />

      <div className="flex items-start gap-2 px-3 pt-3 pb-2">
        <div
          className="flex items-center justify-center shrink-0 overflow-hidden"
          style={{
            width: 38, height: 38,
            background: `${accent}15`,
            border: `1px solid ${accent}40`,
            borderRadius: 10,
          }}
        >
          {data.institutionLogo ? (
            <img src={data.institutionLogo} alt="logo" className="w-full h-full object-contain p-1" />
          ) : (
            <span style={{ color: accent, fontSize: 10, fontWeight: 900 }}>
              {(data.institutionName || 'TEC').slice(0, 3).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-black uppercase text-[11px] tracking-tight truncate leading-tight">
            {data.institutionName || 'TECLINGO ACADEMY'}
          </p>
          <p className="text-[8px] font-bold uppercase tracking-widest mt-0.5" style={{ color: '#96AAAA' }}>
            ID CARD INSTITUCIONAL
          </p>
        </div>
        <div
          className="shrink-0 px-2 py-1 text-center"
          style={{
            background: `${accent}15`,
            border: `1px solid ${accent}50`,
            borderRadius: 6,
          }}
        >
          <p className="text-white font-black text-[7px] tracking-wider leading-none">VERIFIED</p>
          <p className="text-[6px] font-bold tracking-widest leading-none mt-0.5" style={{ color: accent }}>
            {verifiedLabel}
          </p>
        </div>
      </div>

      <div style={{ height: 1, background: `${accent}40`, margin: '0 12px' }} />

      <div className="flex items-start gap-3 px-3 pt-3">
        <div
          className="shrink-0 flex items-center justify-center overflow-hidden"
          style={{
            width: 64, height: 64,
            background: `${accent}15`,
            border: `2px solid ${accent}`,
            borderRadius: '50%',
          }}
        >
          {data.avatar ? (
            <img src={data.avatar} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span style={{ color: '#fff', fontSize: 22, fontWeight: 900 }}>
              {(data.name || 'U')[0]?.toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-black uppercase text-[14px] tracking-tight leading-tight truncate">
            {data.name || 'TITULAR'}
          </p>
          <p className="text-[9px] font-bold uppercase tracking-wider mt-1 truncate" style={{ color: accent }}>
            {data.roleLabel || defaultRoleLabel(role)}
          </p>
          <p className="text-[8px] font-black uppercase tracking-widest mt-1.5 truncate" style={{ color: '#96AAAA' }}>
            ROL: {role}
          </p>
          {data.controlValue && (
            <p className="text-[8px] font-black font-mono uppercase tracking-wider mt-1 truncate" style={{ color: accent }}>
              {(data.controlLabel || (role === 'ALUMNO' ? 'CTL' : role === 'DIRECTOR' ? 'DIR' : 'DOC'))}: {data.controlValue}
            </p>
          )}
        </div>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1 px-3 pt-3">
          {chips.slice(0, 5).map((c, i) => (
            <span
              key={i}
              className="text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5"
              style={{
                background: `${accent}18`,
                border: `1px solid ${accent}50`,
                borderRadius: 4,
                color: '#fff',
              }}
            >
              {c}
            </span>
          ))}
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-3 py-3 min-h-0">
        {qrDataUrl ? (
          <div
            style={{
              width: '62%',
              aspectRatio: '1',
              background: '#fff',
              borderRadius: 8,
              border: `2px solid ${accent}`,
              padding: 4,
            }}
          >
            <img src={qrDataUrl} alt="QR" className="w-full h-full object-contain" />
          </div>
        ) : (
          <div
            className="flex items-center justify-center"
            style={{
              width: '62%',
              aspectRatio: '1',
              background: `${accent}15`,
              borderRadius: 8,
            }}
          >
            <span className="text-[9px] font-black" style={{ color: accent }}>QR...</span>
          </div>
        )}
      </div>

      <div className="px-3 pb-3">
        <div style={{ height: 1, background: `${accent}40`, marginBottom: 8 }} />
        <p
          className="text-center font-black uppercase"
          style={{ color: accent, fontSize: 9, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}
        >
          CONCEPTOS AI MX - PANUCO VER - 2026
        </p>
      </div>
    </div>
  );
}