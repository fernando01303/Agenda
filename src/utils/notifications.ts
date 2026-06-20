// Importações comentadas para evitar que o Expo Go tente inicializar o módulo de Push
// import * as Device from 'expo-device';
// import * as Notifications from 'expo-notifications';
// import { Platform } from 'react-native';

export async function registerForPushNotificationsAsync() {
  // Mock: O Expo Go no Android (SDK 53+) removeu o suporte a Push e frequentemente
  // trava ao carregar o módulo 'expo-notifications'. 
  // Em um app de produção (com Development Build), este código real seria ativado.
  console.log('Notificações simuladas (modo Expo Go compatível)');
}

export async function scheduleTaskNotification(title: string, body: string, dateStr: string, timeStr: string) {
  // Mock da notificação
  console.log(`[Mock] Notificação agendada para ${dateStr} às ${timeStr}: ${title}`);
}
