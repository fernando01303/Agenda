import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

export interface Task {
  id: string;
  title: string;
  description: string;
  date: string; // ISO format
  time: string; // HH:mm format
  category: string;
  color: string;
  isCompleted: boolean;
  reminderMinutesBefore?: number;
}

const TASKS_STORAGE_KEY = '@agenda_tasks';

export const getTasks = async (): Promise<Task[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Error reading tasks', e);
    return [];
  }
};

export const addTask = async (taskData: Omit<Task, 'id' | 'isCompleted'>): Promise<Task> => {
  try {
    const tasks = await getTasks();
    const newTask: Task = {
      ...taskData,
      id: uuid.v4() as string,
      isCompleted: false,
    };
    const newTasks = [...tasks, newTask];
    await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(newTasks));
    return newTask;
  } catch (e) {
    console.error('Error adding task', e);
    throw e;
  }
};

export const toggleTaskCompletion = async (taskId: string): Promise<void> => {
  try {
    const tasks = await getTasks();
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
    );
    await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(updatedTasks));
  } catch (e) {
    console.error('Error toggling task', e);
    throw e;
  }
};

export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    const tasks = await getTasks();
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(updatedTasks));
  } catch (e) {
    console.error('Error deleting task', e);
    throw e;
  }
};

export interface RoutineActivity {
  id: string;
  title: string;
  date: string; // ISO format YYYY-MM-DD
  time?: string; // HH:mm format, optional
  duration?: string; // optional text, e.g. "30 min"
  isCompleted: boolean;
}

const ROUTINES_STORAGE_KEY = '@agenda_routines';

export const getRoutineActivities = async (): Promise<RoutineActivity[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(ROUTINES_STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Error reading routines', e);
    return [];
  }
};

export const addRoutineActivity = async (data: Omit<RoutineActivity, 'id' | 'isCompleted'>): Promise<RoutineActivity> => {
  try {
    const routines = await getRoutineActivities();
    const newRoutine: RoutineActivity = {
      ...data,
      id: uuid.v4() as string,
      isCompleted: false,
    };
    const newRoutines = [...routines, newRoutine];
    await AsyncStorage.setItem(ROUTINES_STORAGE_KEY, JSON.stringify(newRoutines));
    return newRoutine;
  } catch (e) {
    console.error('Error adding routine activity', e);
    throw e;
  }
};

export const toggleRoutineActivity = async (id: string): Promise<void> => {
  try {
    const routines = await getRoutineActivities();
    const updatedRoutines = routines.map(r => 
      r.id === id ? { ...r, isCompleted: !r.isCompleted } : r
    );
    await AsyncStorage.setItem(ROUTINES_STORAGE_KEY, JSON.stringify(updatedRoutines));
  } catch (e) {
    console.error('Error toggling routine activity', e);
    throw e;
  }
};

export const deleteRoutineActivity = async (id: string): Promise<void> => {
  try {
    const routines = await getRoutineActivities();
    const updatedRoutines = routines.filter(r => r.id !== id);
    await AsyncStorage.setItem(ROUTINES_STORAGE_KEY, JSON.stringify(updatedRoutines));
  } catch (e) {
    console.error('Error deleting routine activity', e);
    throw e;
  }
};

// ============================================================
// REGISTRO - Etiquetas e Registros Diários
// ============================================================

export interface ActivityTag {
  id: string;
  name: string;
  color: string;
}

export interface DayLog {
  id: string;
  date: string; // YYYY-MM-DD
  tagId: string;
  tagName: string;
  tagColor: string;
  description?: string;
}

const TAGS_STORAGE_KEY = '@agenda_tags';
const DAYLOGS_STORAGE_KEY = '@agenda_daylogs';

// --- Tags CRUD ---

export const getTags = async (): Promise<ActivityTag[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(TAGS_STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Error reading tags', e);
    return [];
  }
};

export const addTag = async (name: string, color: string): Promise<ActivityTag> => {
  try {
    const tags = await getTags();
    const newTag: ActivityTag = {
      id: uuid.v4() as string,
      name,
      color,
    };
    await AsyncStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify([...tags, newTag]));
    return newTag;
  } catch (e) {
    console.error('Error adding tag', e);
    throw e;
  }
};

export const deleteTag = async (tagId: string): Promise<void> => {
  try {
    const tags = await getTags();
    await AsyncStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(tags.filter(t => t.id !== tagId)));
    // Also remove all day logs associated with this tag
    const logs = await getDayLogs();
    await AsyncStorage.setItem(DAYLOGS_STORAGE_KEY, JSON.stringify(logs.filter(l => l.tagId !== tagId)));
  } catch (e) {
    console.error('Error deleting tag', e);
    throw e;
  }
};

// --- DayLogs CRUD ---

export const getDayLogs = async (): Promise<DayLog[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(DAYLOGS_STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Error reading day logs', e);
    return [];
  }
};

export const addDayLog = async (data: Omit<DayLog, 'id'>): Promise<DayLog> => {
  try {
    const logs = await getDayLogs();
    const newLog: DayLog = {
      ...data,
      id: uuid.v4() as string,
    };
    await AsyncStorage.setItem(DAYLOGS_STORAGE_KEY, JSON.stringify([...logs, newLog]));
    return newLog;
  } catch (e) {
    console.error('Error adding day log', e);
    throw e;
  }
};

export const deleteDayLog = async (logId: string): Promise<void> => {
  try {
    const logs = await getDayLogs();
    await AsyncStorage.setItem(DAYLOGS_STORAGE_KEY, JSON.stringify(logs.filter(l => l.id !== logId)));
  } catch (e) {
    console.error('Error deleting day log', e);
    throw e;
  }
};

// --- Filter / Stats ---

export const getFilteredDayLogs = async (tagId: string, startDate: string, endDate: string): Promise<DayLog[]> => {
  try {
    const logs = await getDayLogs();
    return logs.filter(l => {
      if (l.tagId !== tagId) return false;
      return l.date >= startDate && l.date <= endDate;
    });
  } catch (e) {
    console.error('Error filtering day logs', e);
    return [];
  }
};

