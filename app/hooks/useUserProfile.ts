/**
 * Hook personalizado para gestionar el estado del perfil del usuario
 * Simplificado - sin lógica de completar perfil obligatorio
 */

'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

interface UserProfileState {
  isLoading: boolean;
  syncedWithDatabase: boolean;
}

export function useUserProfile() {
  const { user, isLoaded } = useUser();
  const [state, setState] = useState<UserProfileState>({
    isLoading: true,
    syncedWithDatabase: false,
  });

  useEffect(() => {
    if (!isLoaded || !user) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    // Solo sincronizar perfil con BD si es necesario
    syncProfileWithDatabase();
  }, [isLoaded, user]);

  const syncProfileWithDatabase = async () => {
    if (!user) return;

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Sincronizar datos básicos con BD
      const response = await fetch('/api/user/sync-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkUserId: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
        }),
      });

      if (response.ok) {
        setState(prev => ({ 
          ...prev, 
          syncedWithDatabase: true,
          isLoading: false 
        }));
      } else {
        console.warn('Failed to sync profile with database');
        setState(prev => ({ ...prev, isLoading: false }));
      }

    } catch (error) {
      console.error('Error syncing profile with database:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  return {
    user,
    isLoaded,
    isLoading: state.isLoading,
    syncedWithDatabase: state.syncedWithDatabase,
    refreshProfile: syncProfileWithDatabase,
  };
}