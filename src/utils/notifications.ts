import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Falha ao obter token para notificação push!');
      return;
    }
  } else {
    console.log('Deve usar dispositivo físico para notificações Push');
  }
}

export async function scheduleTaskNotification(
  title: string,
  body: string,
  dateStr: string,
  timeStr: string,
  reminderMinutesBefore: number = 0
) {
  // Parse original task date and time
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  
  const triggerDate = new Date(year, month - 1, day, hour, minute, 0);
  
  // Subtract reminder minutes
  triggerDate.setMinutes(triggerDate.getMinutes() - reminderMinutesBefore);

  // Se o triggerDate já passou, não agendar
  if (triggerDate.getTime() <= new Date().getTime()) {
    console.log('Não foi possível agendar notificação: data já passou.');
    return;
  }

  // Montar texto dinâmico
  let notificationTitle = `⏰ ${title}`;
  let notificationBody = reminderMinutesBefore > 0 
    ? `Começa em ${reminderMinutesBefore} minutos!` 
    : `Começa agora!`;

  if (body) {
    notificationBody += `\n${body}`;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: notificationTitle,
      body: notificationBody,
      sound: true,
    },
    trigger: { 
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate 
    },
  });

  console.log(`Notificação agendada para ${triggerDate.toLocaleString()}: ${notificationTitle}`);
}
