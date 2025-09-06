/**
 * Activity Log Service
 * 
 * Servicio para registrar y gestionar la actividad de usuarios en el sistema.
 * Incluye funciones para login/logout, captura de metadatos de sesión,
 * geolocalización y limpieza automática de logs.
 * 
 * @author Sistema de Sincronización Clerk
 * @version 1.0.0
 */

import { PrismaClient } from '@prisma/client';
import { headers } from 'next/headers';

// === CONFIGURACIÓN PRISMA ===
const prismaClient = new PrismaClient();
const prisma = prismaClient as any;

// === INTERFACES Y TIPOS ===

/**
 * Tipos de acciones que se pueden registrar en el log de actividad
 */
export type ActivityAction = 'LOGIN' | 'LOGOUT' | 'SESSION_UPDATE' | 'PROFILE_UPDATE' | 'PASSWORD_CHANGE' | 'EMAIL_CHANGE';

/**
 * Datos de sesión de Clerk
 */
export interface ClerkSessionData {
  sessionId: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  lastActiveAt: number;
  expireAt: number;
  status: string;
}

/**
 * Metadatos de actividad del usuario
 */
export interface ActivityMetadata {
  userAgent?: string;
  ipAddress?: string;
  deviceType?: string;
  operatingSystem?: string;
  browser?: string;
  location?: {
    country?: string;
    city?: string;
    region?: string;
  };
  sessionDuration?: number;
  previousLoginAt?: Date;
}

/**
 * Datos para crear un log de actividad
 */
export interface CreateActivityLogData {
  clerkUserId: string;
  clerkSessionId?: string;
  action: ActivityAction;
  metadata?: ActivityMetadata;
  description?: string;
}

/**
 * Configuración del servicio de logs
 */
interface ActivityLogConfig {
  enableGeolocation: boolean;
  enableDeviceDetection: boolean;
  logRetentionDays: number;
  maxLogsPerUser: number;
}

// === CONFIGURACIÓN POR DEFECTO ===
const DEFAULT_CONFIG: ActivityLogConfig = {
  enableGeolocation: true,
  enableDeviceDetection: true,
  logRetentionDays: 90, // 3 meses de retención
  maxLogsPerUser: 1000
};

// === UTILIDADES INTERNAS ===

/**
 * Extrae la dirección IP del cliente desde las cabeceras de la petición
 */
async function extractClientIP(): Promise<string | null> {
  try {
    const headersList = await headers();
    
    // Intentar obtener IP de diferentes cabeceras
    const forwardedFor = headersList.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
    
    const realIP = headersList.get('x-real-ip');
    if (realIP) {
      return realIP;
    }
    
    const cfConnectingIP = headersList.get('cf-connecting-ip');
    if (cfConnectingIP) {
      return cfConnectingIP;
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting client IP:', error);
    return null;
  }
}

/**
 * Extrae el User Agent desde las cabeceras de la petición
 */
async function extractUserAgent(): Promise<string | null> {
  try {
    const headersList = await headers();
    return headersList.get('user-agent') || null;
  } catch (error) {
    console.error('Error extracting user agent:', error);
    return null;
  }
}

/**
 * Detecta el tipo de dispositivo basado en el User Agent
 */
function detectDeviceType(userAgent: string): string {
  if (!userAgent) return 'unknown';
  
  const ua = userAgent.toLowerCase();
  
  // Detectar dispositivos móviles
  if (ua.includes('mobile') || 
      ua.includes('android') || 
      ua.includes('iphone') ||
      ua.includes('ipod') ||
      ua.includes('blackberry') ||
      ua.includes('windows phone') ||
      ua.includes('webos')) {
    return 'mobile';
  }
  
  // Detectar tablets
  if (ua.includes('tablet') || 
      ua.includes('ipad') ||
      ua.includes('kindle') ||
      ua.includes('silk') ||
      (ua.includes('android') && !ua.includes('mobile'))) {
    return 'tablet';
  }
  
  // Detectar smart TV
  if (ua.includes('smart-tv') ||
      ua.includes('smarttv') ||
      ua.includes('googletv') ||
      ua.includes('appletv') ||
      ua.includes('hbbtv') ||
      ua.includes('pov_tv')) {
    return 'smart-tv';
  }
  
  // Detectar consolas de juegos
  if (ua.includes('playstation') ||
      ua.includes('xbox') ||
      ua.includes('nintendo')) {
    return 'gaming-console';
  }
  
  return 'desktop';
}

/**
 * Detecta el sistema operativo basado en el User Agent
 */
function detectOperatingSystem(userAgent: string): string {
  if (!userAgent) return 'unknown';
  
  const ua = userAgent.toLowerCase();
  
  // Windows (diferentes versiones)
  if (ua.includes('windows nt 10.0')) return 'Windows 10/11';
  if (ua.includes('windows nt 6.3')) return 'Windows 8.1';
  if (ua.includes('windows nt 6.2')) return 'Windows 8';
  if (ua.includes('windows nt 6.1')) return 'Windows 7';
  if (ua.includes('windows')) return 'Windows';
  
  // macOS/iOS
  if (ua.includes('mac os x 10_15') || ua.includes('macos 10.15')) return 'macOS Catalina';
  if (ua.includes('mac os x 10_14') || ua.includes('macos 10.14')) return 'macOS Mojave';
  if (ua.includes('mac os x') || ua.includes('macos')) return 'macOS';
  if (ua.includes('iphone os') || ua.includes('ios')) return 'iOS';
  if (ua.includes('ipad')) return 'iPadOS';
  
  // Android
  if (ua.includes('android 13')) return 'Android 13';
  if (ua.includes('android 12')) return 'Android 12';
  if (ua.includes('android 11')) return 'Android 11';
  if (ua.includes('android 10')) return 'Android 10';
  if (ua.includes('android')) return 'Android';
  
  // Linux
  if (ua.includes('ubuntu')) return 'Ubuntu';
  if (ua.includes('debian')) return 'Debian';
  if (ua.includes('fedora')) return 'Fedora';
  if (ua.includes('centos')) return 'CentOS';
  if (ua.includes('linux')) return 'Linux';
  
  // Otros sistemas
  if (ua.includes('freebsd')) return 'FreeBSD';
  if (ua.includes('openbsd')) return 'OpenBSD';
  if (ua.includes('sunos')) return 'Solaris';
  if (ua.includes('cros')) return 'Chrome OS';
  
  return 'unknown';
}

/**
 * Detecta el navegador basado en el User Agent
 */
function detectBrowser(userAgent: string): string {
  if (!userAgent) return 'unknown';
  
  const ua = userAgent.toLowerCase();
  
  // Detectar navegadores específicos (orden importante)
  if (ua.includes('edg/')) return 'Microsoft Edge';
  if (ua.includes('edge/')) return 'Microsoft Edge Legacy';
  if (ua.includes('opr/') || ua.includes('opera/')) return 'Opera';
  if (ua.includes('chrome/') && !ua.includes('edge')) return 'Google Chrome';
  if (ua.includes('firefox/')) return 'Mozilla Firefox';
  if (ua.includes('safari/') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('msie') || ua.includes('trident/')) return 'Internet Explorer';
  
  // Navegadores móviles específicos
  if (ua.includes('crios/')) return 'Chrome iOS';
  if (ua.includes('fxios/')) return 'Firefox iOS';
  if (ua.includes('mobile safari')) return 'Mobile Safari';
  
  // Otros navegadores
  if (ua.includes('brave/')) return 'Brave';
  if (ua.includes('vivaldi/')) return 'Vivaldi';
  if (ua.includes('yabrowser/')) return 'Yandex Browser';
  if (ua.includes('ucbrowser/')) return 'UC Browser';
  if (ua.includes('samsungbrowser/')) return 'Samsung Internet';
  
  return 'unknown';
}

/**
 * Análisis completo del User Agent
 * Combina toda la información de dispositivo, OS y navegador
 */
function analyzeUserAgent(userAgent: string): {
  deviceType: string;
  operatingSystem: string;
  browser: string;
  isMobile: boolean;
  isBot: boolean;
} {
  if (!userAgent) {
    return {
      deviceType: 'unknown',
      operatingSystem: 'unknown',
      browser: 'unknown',
      isMobile: false,
      isBot: false
    };
  }

  const ua = userAgent.toLowerCase();
  
  // Detectar bots
  const isBot = ua.includes('bot') ||
                ua.includes('crawler') ||
                ua.includes('spider') ||
                ua.includes('scraper') ||
                ua.includes('facebookexternalhit') ||
                ua.includes('twitterbot') ||
                ua.includes('linkedinbot') ||
                ua.includes('googlebot');

  const deviceType = detectDeviceType(userAgent);
  const operatingSystem = detectOperatingSystem(userAgent);
  const browser = detectBrowser(userAgent);
  const isMobile = deviceType === 'mobile' || deviceType === 'tablet';

  return {
    deviceType,
    operatingSystem,
    browser,
    isMobile,
    isBot
  };
}

/**
 * Función exportable para análisis completo de User Agent
 */
export function parseUserAgent(userAgent: string): {
  deviceType: string;
  operatingSystem: string;
  browser: string;
  isMobile: boolean;
  isBot: boolean;
} {
  return analyzeUserAgent(userAgent);
}

// === FUNCIONES DE ANÁLISIS DE SEGURIDAD ===

/**
 * Detecta múltiples inicios de sesión simultáneos desde diferentes ubicaciones
 */
export async function detectSuspiciousLogins(userId: string, currentIP: string): Promise<{
  isSuspicious: boolean;
  reason?: string;
  recentLogins: any[];
}> {
  try {
    // Obtener logins recientes (últimas 24 horas)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentLogins = await prisma.userActivityLog.findMany({
      where: {
        userId,
        eventType: 'login',
        createdAt: {
          gte: twentyFourHoursAgo
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    if (recentLogins.length === 0) {
      return { isSuspicious: false, recentLogins: [] };
    }

    // Verificar múltiples IPs en corto período
     const uniqueIPs = new Set(recentLogins.map((login: any) => login.ipAddress).filter(Boolean));
    if (uniqueIPs.size > 3) {
      return {
        isSuspicious: true,
        reason: 'Multiple IP addresses detected in 24h period',
        recentLogins
      };
    }

    // Verificar logins desde países diferentes
     const countries = recentLogins
       .map((login: any) => login.metadata?.location?.country)
       .filter(Boolean);
    const uniqueCountries = new Set(countries);
    
    if (uniqueCountries.size > 2) {
      return {
        isSuspicious: true,
        reason: 'Logins from multiple countries detected',
        recentLogins
      };
    }

    // Verificar frecuencia de logins (más de 5 en 1 hora)
     const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
     const recentHourLogins = recentLogins.filter((login: any) => 
       new Date(login.createdAt) > oneHourAgo
     );

    if (recentHourLogins.length > 5) {
      return {
        isSuspicious: true,
        reason: 'High frequency login attempts detected',
        recentLogins
      };
    }

    return { isSuspicious: false, recentLogins };
  } catch (error) {
    console.error('Error detecting suspicious logins:', error);
    return { isSuspicious: false, recentLogins: [] };
  }
}

/**
 * Analiza patrones de comportamiento del usuario
 */
export async function analyzeUserBehaviorPattern(userId: string): Promise<{
  riskScore: number;
  patterns: string[];
  recommendations: string[];
}> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const activities = await prisma.userActivityLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    let riskScore = 0;
    const patterns: string[] = [];
    const recommendations: string[] = [];

    // Analizar dispositivos únicos
     const uniqueDevices = new Set(
       activities.map((a: any) => a.metadata?.deviceType).filter(Boolean)
     );
    
    if (uniqueDevices.size > 5) {
      riskScore += 20;
      patterns.push('Multiple devices used');
      recommendations.push('Review device access and revoke unknown devices');
    }

    // Analizar ubicaciones únicas
     const uniqueLocations = new Set(
       activities.map((a: any) => a.metadata?.location?.city).filter(Boolean)
     );
    
    if (uniqueLocations.size > 10) {
      riskScore += 30;
      patterns.push('Access from many locations');
      recommendations.push('Enable location-based alerts');
    }

    // Analizar actividad nocturna (entre 2 AM y 6 AM)
     const nightActivities = activities.filter((activity: any) => {
       const hour = new Date(activity.createdAt).getHours();
       return hour >= 2 && hour <= 6;
     });

    if (nightActivities.length > activities.length * 0.3) {
      riskScore += 15;
      patterns.push('High nocturnal activity');
    }

    // Analizar intentos de login fallidos (si los hubiera)
     const failedLogins = activities.filter((a: any) => 
       a.eventType === 'login_failed' || a.metadata?.success === false
     );

    if (failedLogins.length > 10) {
      riskScore += 25;
      patterns.push('Multiple failed login attempts');
      recommendations.push('Consider enabling 2FA');
    }

    // Determinar nivel de riesgo
    if (riskScore > 50) {
      recommendations.push('Account requires immediate security review');
    } else if (riskScore > 25) {
      recommendations.push('Consider additional security measures');
    }

    return {
      riskScore: Math.min(riskScore, 100),
      patterns,
      recommendations
    };
  } catch (error) {
    console.error('Error analyzing user behavior:', error);
    return {
      riskScore: 0,
      patterns: [],
      recommendations: ['Error analyzing behavior - manual review recommended']
    };
  }
}

/**
 * Detecta actividad de bots o automatizada
 */
export function detectBotActivity(userAgent: string, metadata: any): {
  isBot: boolean;
  confidence: number;
  indicators: string[];
} {
  const indicators: string[] = [];
  let confidence = 0;

  if (!userAgent) {
    indicators.push('Missing User Agent');
    confidence += 30;
  } else {
    const ua = userAgent.toLowerCase();
    
    // Detectar bots conocidos
    const botPatterns = [
      'bot', 'crawler', 'spider', 'scraper', 'automated',
      'curl', 'wget', 'python-requests', 'postman'
    ];
    
    for (const pattern of botPatterns) {
      if (ua.includes(pattern)) {
        indicators.push(`Bot pattern detected: ${pattern}`);
        confidence += 40;
      }
    }

    // Detectar User Agents sospechosos
    if (ua.length < 20) {
      indicators.push('Unusually short User Agent');
      confidence += 20;
    }

    if (!ua.includes('mozilla') && !ua.includes('webkit')) {
      indicators.push('Non-standard User Agent format');
      confidence += 15;
    }
  }

  // Analizar patrones de timing si están disponibles
  if (metadata?.requestTiming) {
    const timing = metadata.requestTiming;
    if (timing < 100) { // Menos de 100ms entre requests
      indicators.push('Extremely fast request timing');
      confidence += 25;
    }
  }

  // Analizar ausencia de headers típicos de navegador
  if (metadata?.headers) {
    const headers = metadata.headers;
    if (!headers['accept-language']) {
      indicators.push('Missing Accept-Language header');
      confidence += 10;
    }
    if (!headers['accept-encoding']) {
      indicators.push('Missing Accept-Encoding header');
      confidence += 10;
    }
  }

  return {
    isBot: confidence > 50,
    confidence: Math.min(confidence, 100),
    indicators
  };
}

/**
 * Valida la consistencia geográfica de los accesos
 */
export async function validateGeographicConsistency(
  userId: string, 
  currentLocation: any
): Promise<{
  isConsistent: boolean;
  travelTime?: number;
  lastLocation?: any;
  warning?: string;
}> {
  try {
    if (!currentLocation?.latitude || !currentLocation?.longitude) {
      return { isConsistent: true };
    }

    // Obtener la última ubicación conocida
    const lastActivity = await prisma.userActivityLog.findFirst({
      where: {
        userId,
        metadata: {
          path: ['location', 'latitude'],
          not: null
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!lastActivity?.metadata?.location) {
      return { isConsistent: true };
    }

    const lastLocation = lastActivity.metadata.location;
    const timeDiff = Date.now() - new Date(lastActivity.createdAt).getTime();
    const timeDiffHours = timeDiff / (1000 * 60 * 60);

    // Calcular distancia aproximada (fórmula de Haversine simplificada)
    const lat1 = parseFloat(lastLocation.latitude);
    const lon1 = parseFloat(lastLocation.longitude);
    const lat2 = parseFloat(currentLocation.latitude);
    const lon2 = parseFloat(currentLocation.longitude);

    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    // Velocidad máxima realista (avión comercial ~900 km/h)
    const maxSpeed = 900;
    const requiredTime = distance / maxSpeed;

    if (timeDiffHours < requiredTime && distance > 100) {
      return {
        isConsistent: false,
        travelTime: requiredTime,
        lastLocation,
        warning: `Impossible travel: ${distance.toFixed(0)}km in ${timeDiffHours.toFixed(1)}h`
      };
    }

    return {
      isConsistent: true,
      travelTime: requiredTime,
      lastLocation
    };
  } catch (error) {
    console.error('Error validating geographic consistency:', error);
    return { isConsistent: true };
  }
}

// === FUNCIONES PRINCIPALES ===

/**
 * Valida los datos de entrada para crear un log de actividad
 */
function validateActivityLogData(data: CreateActivityLogData): boolean {
  if (!data.clerkUserId || typeof data.clerkUserId !== 'string') {
    console.error('Invalid clerkUserId provided');
    return false;
  }
  
  if (!data.action || !['LOGIN', 'LOGOUT', 'SESSION_UPDATE', 'PROFILE_UPDATE', 'PASSWORD_CHANGE', 'EMAIL_CHANGE'].includes(data.action)) {
    console.error('Invalid action provided');
    return false;
  }
  
  return true;
}

/**
 * Registra un evento de login de usuario
 * 
 * @param clerkUserId - ID del usuario en Clerk
 * @param clerkSessionId - ID de la sesión en Clerk
 * @param sessionData - Datos adicionales de la sesión (opcional)
 * @returns Promise con el resultado del registro
 */
export async function logUserLogin(
  clerkUserId: string,
  clerkSessionId?: string,
  sessionData?: ClerkSessionData
): Promise<{ success: boolean; logId?: string; error?: string }> {
  try {
    // Validar datos de entrada
    if (!clerkUserId || typeof clerkUserId !== 'string') {
      return {
        success: false,
        error: 'clerkUserId es requerido y debe ser una cadena válida'
      };
    }

    // Capturar metadatos de la petición
    const ipAddress = await extractClientIP();
    const userAgent = await extractUserAgent();
    
    // Construir metadatos de actividad
    const metadata: ActivityMetadata = {
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined
    };

    // Detectar información del dispositivo si hay User Agent
    if (userAgent) {
      metadata.deviceType = detectDeviceType(userAgent);
      metadata.operatingSystem = detectOperatingSystem(userAgent);
      metadata.browser = detectBrowser(userAgent);
    }

    // Obtener el último login para calcular tiempo desde último acceso
    try {
      const lastLogin = await prisma.userActivityLog.findFirst({
        where: {
          clerkUserId: clerkUserId,
          action: 'LOGIN'
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (lastLogin) {
        metadata.previousLoginAt = lastLogin.createdAt;
      }
    } catch (error) {
      console.warn('No se pudo obtener el último login:', error);
    }

    // Crear el registro de actividad
    const activityLog = await prisma.userActivityLog.create({
      data: {
        clerkUserId: clerkUserId,
        clerkSessionId: clerkSessionId || null,
        action: 'LOGIN',
        description: `Usuario ${clerkUserId} inició sesión`,
        metadata: metadata,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        createdAt: new Date()
      }
    });

    console.log(`✅ Login registrado para usuario ${clerkUserId}:`, {
      logId: activityLog.id,
      sessionId: clerkSessionId,
      ipAddress: ipAddress,
      deviceType: metadata.deviceType,
      browser: metadata.browser
    });

    return {
      success: true,
      logId: activityLog.id
    };

  } catch (error) {
    console.error('❌ Error registrando login:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Registra un evento de logout de usuario
 * 
 * @param clerkUserId - ID del usuario en Clerk
 * @param clerkSessionId - ID de la sesión en Clerk
 * @param sessionData - Datos adicionales de la sesión (opcional)
 * @returns Promise con el resultado del registro
 */
export async function logUserLogout(
  clerkUserId: string,
  clerkSessionId?: string,
  sessionData?: ClerkSessionData
): Promise<{ success: boolean; logId?: string; sessionDuration?: number; error?: string }> {
  try {
    // Validar datos de entrada
    if (!clerkUserId || typeof clerkUserId !== 'string') {
      return {
        success: false,
        error: 'clerkUserId es requerido y debe ser una cadena válida'
      };
    }

    // Capturar metadatos de la petición
    const ipAddress = await extractClientIP();
    const userAgent = await extractUserAgent();
    
    // Construir metadatos de actividad
    const metadata: ActivityMetadata = {
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined
    };

    // Detectar información del dispositivo si hay User Agent
    if (userAgent) {
      metadata.deviceType = detectDeviceType(userAgent);
      metadata.operatingSystem = detectOperatingSystem(userAgent);
      metadata.browser = detectBrowser(userAgent);
    }

    // Calcular duración de la sesión
    let sessionDuration: number | undefined;
    try {
      // Buscar el último login del usuario
      const lastLogin = await prisma.userActivityLog.findFirst({
        where: {
          clerkUserId: clerkUserId,
          action: 'LOGIN',
          ...(clerkSessionId && { clerkSessionId: clerkSessionId })
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (lastLogin) {
        const loginTime = new Date(lastLogin.createdAt);
        const logoutTime = new Date();
        sessionDuration = Math.floor((logoutTime.getTime() - loginTime.getTime()) / 1000); // en segundos
        metadata.sessionDuration = sessionDuration;
        
        console.log(`📊 Duración de sesión calculada: ${sessionDuration} segundos (${Math.floor(sessionDuration / 60)} minutos)`);
      } else {
        console.warn(`⚠️ No se encontró login previo para usuario ${clerkUserId}`);
      }
    } catch (error) {
      console.warn('No se pudo calcular la duración de la sesión:', error);
    }

    // Crear el registro de actividad
    const activityLog = await prisma.userActivityLog.create({
      data: {
        clerkUserId: clerkUserId,
        clerkSessionId: clerkSessionId || null,
        action: 'LOGOUT',
        description: sessionDuration 
          ? `Usuario ${clerkUserId} cerró sesión (duración: ${Math.floor(sessionDuration / 60)} min)`
          : `Usuario ${clerkUserId} cerró sesión`,
        metadata: metadata,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        createdAt: new Date()
      }
    });

    console.log(`✅ Logout registrado para usuario ${clerkUserId}:`, {
      logId: activityLog.id,
      sessionId: clerkSessionId,
      sessionDuration: sessionDuration ? `${Math.floor(sessionDuration / 60)} minutos` : 'No calculada',
      ipAddress: ipAddress,
      deviceType: metadata.deviceType,
      browser: metadata.browser
    });

    return {
      success: true,
      logId: activityLog.id,
      sessionDuration: sessionDuration
    };

  } catch (error) {
    console.error('❌ Error registrando logout:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Registra un evento de actividad genérico del usuario
 * 
 * @param data - Datos del evento de actividad
 * @returns Promise con el resultado del registro
 */
export async function logUserActivity(
  data: CreateActivityLogData
): Promise<{ success: boolean; logId?: string; error?: string }> {
  try {
    // Validar datos de entrada
    if (!validateActivityLogData(data)) {
      return {
        success: false,
        error: 'Datos de actividad inválidos'
      };
    }

    // Capturar metadatos de la petición si no se proporcionaron
    let finalMetadata = data.metadata || {};
    
    // Si no hay metadatos de IP o User Agent, intentar capturarlos
    if (!finalMetadata.ipAddress || !finalMetadata.userAgent) {
      const ipAddress = await extractClientIP();
      const userAgent = await extractUserAgent();
      
      finalMetadata = {
        ...finalMetadata,
        ipAddress: finalMetadata.ipAddress || ipAddress || undefined,
        userAgent: finalMetadata.userAgent || userAgent || undefined
      };

      // Detectar información del dispositivo si hay User Agent y no está ya presente
      if (userAgent && (!finalMetadata.deviceType || !finalMetadata.operatingSystem || !finalMetadata.browser)) {
        finalMetadata.deviceType = finalMetadata.deviceType || detectDeviceType(userAgent);
        finalMetadata.operatingSystem = finalMetadata.operatingSystem || detectOperatingSystem(userAgent);
        finalMetadata.browser = finalMetadata.browser || detectBrowser(userAgent);
      }
    }

    // Generar descripción automática si no se proporciona
    let description = data.description;
    if (!description) {
      switch (data.action) {
        case 'SESSION_UPDATE':
          description = `Usuario ${data.clerkUserId} actualizó su sesión`;
          break;
        case 'PROFILE_UPDATE':
          description = `Usuario ${data.clerkUserId} actualizó su perfil`;
          break;
        case 'PASSWORD_CHANGE':
          description = `Usuario ${data.clerkUserId} cambió su contraseña`;
          break;
        case 'EMAIL_CHANGE':
          description = `Usuario ${data.clerkUserId} cambió su email`;
          break;
        default:
          description = `Usuario ${data.clerkUserId} realizó acción: ${data.action}`;
      }
    }

    // Crear el registro de actividad
    const activityLog = await prisma.userActivityLog.create({
      data: {
        clerkUserId: data.clerkUserId,
        clerkSessionId: data.clerkSessionId || null,
        action: data.action,
        description: description,
        metadata: finalMetadata,
        ipAddress: finalMetadata.ipAddress || null,
        userAgent: finalMetadata.userAgent || null,
        createdAt: new Date()
      }
    });

    console.log(`✅ Actividad registrada para usuario ${data.clerkUserId}:`, {
      logId: activityLog.id,
      action: data.action,
      sessionId: data.clerkSessionId,
      ipAddress: finalMetadata.ipAddress,
      deviceType: finalMetadata.deviceType,
      browser: finalMetadata.browser
    });

    return {
      success: true,
      logId: activityLog.id
    };

  } catch (error) {
    console.error(`❌ Error registrando actividad ${data.action}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Función de conveniencia para registrar actualizaciones de sesión
 */
export async function logSessionUpdate(
  clerkUserId: string,
  clerkSessionId: string,
  metadata?: ActivityMetadata
): Promise<{ success: boolean; logId?: string; error?: string }> {
  return logUserActivity({
    clerkUserId,
    clerkSessionId,
    action: 'SESSION_UPDATE',
    metadata,
    description: `Sesión ${clerkSessionId} actualizada`
  });
}

/**
 * Función de conveniencia para registrar actualizaciones de perfil
 */
export async function logProfileUpdate(
  clerkUserId: string,
  changes?: string[],
  metadata?: ActivityMetadata
): Promise<{ success: boolean; logId?: string; error?: string }> {
  const description = changes && changes.length > 0 
    ? `Perfil actualizado: ${changes.join(', ')}`
    : 'Perfil actualizado';
    
  return logUserActivity({
    clerkUserId,
    action: 'PROFILE_UPDATE',
    metadata,
    description
  });
}

/**
 * Función de conveniencia para registrar cambios de contraseña
 */
export async function logPasswordChange(
  clerkUserId: string,
  metadata?: ActivityMetadata
): Promise<{ success: boolean; logId?: string; error?: string }> {
  return logUserActivity({
    clerkUserId,
    action: 'PASSWORD_CHANGE',
    metadata,
    description: 'Contraseña cambiada por el usuario'
  });
}

/**
 * Función de conveniencia para registrar cambios de email
 */
export async function logEmailChange(
  clerkUserId: string,
  oldEmail?: string,
  newEmail?: string,
  metadata?: ActivityMetadata
): Promise<{ success: boolean; logId?: string; error?: string }> {
  const description = oldEmail && newEmail 
    ? `Email cambiado de ${oldEmail} a ${newEmail}`
    : 'Email cambiado';
    
  return logUserActivity({
    clerkUserId,
    action: 'EMAIL_CHANGE',
    metadata,
    description
  });
}

// === FUNCIONES DE GEOLOCALIZACIÓN ===

/**
 * Obtiene información de geolocalización basada en la dirección IP
 * Utiliza el servicio gratuito ip-api.com (limitado a 1000 requests/mes)
 * 
 * @param ipAddress - Dirección IP del usuario
 * @returns Promise con información de ubicación o null si falla
 */
async function getLocationFromIP(ipAddress: string): Promise<{
  country?: string;
  city?: string;
  region?: string;
} | null> {
  try {
    // No procesar IPs locales o privadas
    if (!ipAddress || 
        ipAddress === '127.0.0.1' || 
        ipAddress === '::1' || 
        ipAddress.startsWith('192.168.') ||
        ipAddress.startsWith('10.') ||
        ipAddress.startsWith('172.')) {
      return null;
    }

    // Usar servicio gratuito de geolocalización IP
    const response = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,country,regionName,city`, {
      method: 'GET',
      headers: {
        'User-Agent': 'ActivityLogService/1.0'
      },
      // Timeout de 5 segundos
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      console.warn(`Geolocalización IP falló: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        country: data.country || undefined,
        region: data.regionName || undefined,
        city: data.city || undefined
      };
    } else {
      console.warn('Geolocalización IP falló:', data.message);
      return null;
    }

  } catch (error) {
    // No logear como error ya que es funcionalidad opcional
    console.debug('No se pudo obtener geolocalización:', error);
    return null;
  }
}

/**
 * Enriquece los metadatos con información de geolocalización si está habilitada
 * 
 * @param metadata - Metadatos existentes
 * @param ipAddress - Dirección IP del usuario
 * @param config - Configuración del servicio
 * @returns Promise con metadatos enriquecidos
 */
async function enrichMetadataWithLocation(
  metadata: ActivityMetadata,
  ipAddress: string | null,
  config: ActivityLogConfig = DEFAULT_CONFIG
): Promise<ActivityMetadata> {
  // Si la geolocalización no está habilitada o no hay IP, retornar metadatos sin cambios
  if (!config.enableGeolocation || !ipAddress) {
    return metadata;
  }

  try {
    const location = await getLocationFromIP(ipAddress);
    
    if (location) {
      return {
        ...metadata,
        location: {
          country: location.country,
          region: location.region,
          city: location.city
        }
      };
    }
  } catch (error) {
    console.debug('Error enriqueciendo metadatos con ubicación:', error);
  }

  return metadata;
}

/**
 * Función auxiliar para obtener geolocalización de forma independiente
 * Útil para testing o uso manual
 * 
 * @param ipAddress - Dirección IP a consultar
 * @returns Promise con información de ubicación
 */
export async function getGeolocation(ipAddress: string): Promise<{
  country?: string;
  city?: string;
  region?: string;
} | null> {
  return getLocationFromIP(ipAddress);
}

// === FUNCIONES MEJORADAS CON GEOLOCALIZACIÓN ===

/**
 * Versión mejorada de logUserLogin con geolocalización
 */
export async function logUserLoginWithLocation(
  clerkUserId: string,
  clerkSessionId?: string,
  sessionData?: ClerkSessionData,
  config: ActivityLogConfig = DEFAULT_CONFIG
): Promise<{ success: boolean; logId?: string; error?: string }> {
  try {
    // Validar datos de entrada
    if (!clerkUserId || typeof clerkUserId !== 'string') {
      return {
        success: false,
        error: 'clerkUserId es requerido y debe ser una cadena válida'
      };
    }

    // Capturar metadatos de la petición
    const ipAddress = await extractClientIP();
    const userAgent = await extractUserAgent();
    
    // Construir metadatos base
    let metadata: ActivityMetadata = {
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined
    };

    // Detectar información del dispositivo si hay User Agent
    if (userAgent) {
      metadata.deviceType = detectDeviceType(userAgent);
      metadata.operatingSystem = detectOperatingSystem(userAgent);
      metadata.browser = detectBrowser(userAgent);
    }

    // Enriquecer con geolocalización si está habilitada
    metadata = await enrichMetadataWithLocation(metadata, ipAddress, config);

    // Obtener el último login para calcular tiempo desde último acceso
    try {
      const lastLogin = await prisma.userActivityLog.findFirst({
        where: {
          clerkUserId: clerkUserId,
          action: 'LOGIN'
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (lastLogin) {
        metadata.previousLoginAt = lastLogin.createdAt;
      }
    } catch (error) {
      console.warn('No se pudo obtener el último login:', error);
    }

    // Crear el registro de actividad
    const activityLog = await prisma.userActivityLog.create({
      data: {
        clerkUserId: clerkUserId,
        clerkSessionId: clerkSessionId || null,
        action: 'LOGIN',
        description: `Usuario ${clerkUserId} inició sesión${metadata.location?.city ? ` desde ${metadata.location.city}, ${metadata.location.country}` : ''}`,
        metadata: metadata,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        createdAt: new Date()
      }
    });

    console.log(`✅ Login con geolocalización registrado para usuario ${clerkUserId}:`, {
      logId: activityLog.id,
      sessionId: clerkSessionId,
      ipAddress: ipAddress,
      location: metadata.location ? `${metadata.location.city}, ${metadata.location.country}` : 'No disponible',
      deviceType: metadata.deviceType,
      browser: metadata.browser
    });

    return {
      success: true,
      logId: activityLog.id
    };

  } catch (error) {
    console.error('❌ Error registrando login con geolocalización:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// === EXPORTACIONES ===
export {
  prisma,
  prismaClient,
  DEFAULT_CONFIG,
  extractClientIP,
  extractUserAgent,
  detectDeviceType,
  detectOperatingSystem,
  detectBrowser,
  validateActivityLogData
};