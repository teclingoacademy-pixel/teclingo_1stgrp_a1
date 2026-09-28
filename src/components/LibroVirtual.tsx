/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * LibroVirtual.tsx
 * Wrapper que integra los componentes del workbook (teclingo_workbook_main)
 * con el sistema de autenticación y contexto de TECLINGO-V4.
 * 
 * Migrado desde teclingo_workbook_main el 2026-09-12.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { ClassIndexScreen } from './workbook/ClassIndexScreen';
import { ClassDetailScreen } from './workbook/ClassDetailScreen';
import type { SheetProgresoUsuarioRow } from '../types/workbook/workbookRows';

// ==========================================
// INTERFACES
// ==========================================
interface LibroVirtualProps {
  lessonId?: string;
  role: 'alumno' | 'docente' | 'director';
}

type ViewMode = 'index' | 'detail';

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export function LibroVirtual({ lessonId = "A1_C01", role }: LibroVirtualProps) {
  const { userEmail } = useAppContext();
  const [viewMode, setViewMode] = useState<ViewMode>('index');
  const [selectedClaseId, setSelectedClaseId] = useState<string>(lessonId);
  const [progress, setProgress] = useState<SheetProgresoUsuarioRow[]>([]);

  // ==========================================
  // AUTH BRIDGE: Adaptar TECLINGO-V4 AppContext → Workbook auth
  // ==========================================
  useEffect(() => {
    if (userEmail) {
      // Store user data in localStorage for workbook components
      const existingUser = localStorage.getItem('user');
      if (!existingUser) {
        const workbookUser = {
          user_id: userEmail.replace('@', '_at_').replace(/\./g, '_'),
          email: userEmail,
          nombre: userEmail.split('@')[0],
          tipo_cuenta: 'regular',
        };
        localStorage.setItem('user', JSON.stringify(workbookUser));
      }
    }
  }, [userEmail]);

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleSelectClass = useCallback((claseId: string) => {
    setSelectedClaseId(claseId);
    setViewMode('detail');
  }, []);

  const handleBackToIndex = useCallback(() => {
    setViewMode('index');
  }, []);

  const handleBackToCover = useCallback(() => {
    // Navigate to parent component's back handler if needed
    setViewMode('index');
  }, []);

  const handleSaveProgress = useCallback((newProgressRows: SheetProgresoUsuarioRow[]) => {
    setProgress(prev => [...prev, ...newProgressRows]);
  }, []);

  const handleSelectNextClass = useCallback((nextClaseId: string) => {
    setSelectedClaseId(nextClaseId);
    setViewMode('detail');
  }, []);

  const handleResetMockProgress = useCallback(() => {
    setProgress([]);
  }, []);

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="w-full min-h-screen">
      {viewMode === 'index' ? (
        <ClassIndexScreen
          onSelectClass={handleSelectClass}
          onBackToCover={handleBackToCover}
          customProgreso={progress}
          onResetMockProgress={handleResetMockProgress}
        />
      ) : (
        <ClassDetailScreen
          claseId={selectedClaseId}
          onBackToIndex={handleBackToIndex}
          onSelectNextClass={handleSelectNextClass}
          onSaveProgress={handleSaveProgress}
          existingProgress={progress}
        />
      )}
    </div>
  );
}
