import type { ChatMessage } from "./api";

export interface ChatHistory {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: number;
  updatedAt: number;
}

const DB_NAME = "armonia-chat-db";
const STORE_NAME = "chats";
const DB_VERSION = 1;

class ChatStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error("Failed to open database"));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, {
            keyPath: "id",
          });
          objectStore.createIndex("timestamp", "timestamp", { unique: false });
          objectStore.createIndex("updatedAt", "updatedAt", { unique: false });
        }
      };
    });
  }

  private async ensureDb(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error("Database not initialized");
    }
    return this.db;
  }

  async saveChat(chat: ChatHistory): Promise<void> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      
      // Serialize Date objects to ISO strings for IndexedDB
      const serializedChat = {
        ...chat,
        messages: chat.messages.map((msg) => ({
          ...msg,
          timestamp: msg.timestamp instanceof Date 
            ? msg.timestamp.toISOString() 
            : msg.timestamp,
        })),
      };
      
      const request = store.put(serializedChat);

      request.onerror = () => {
        reject(new Error("Failed to save chat"));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  async getChat(id: string): Promise<ChatHistory | null> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onerror = () => {
        reject(new Error("Failed to get chat"));
      };

      request.onsuccess = () => {
        const chat = request.result as ChatHistory | undefined;
        if (chat) {
          // Convert timestamp strings back to Date objects
          chat.messages = chat.messages.map((msg) => ({
            ...msg,
            timestamp: typeof msg.timestamp === 'string' 
              ? new Date(msg.timestamp) 
              : msg.timestamp,
          }));
        }
        resolve(chat || null);
      };
    });
  }

  async getAllChats(): Promise<ChatHistory[]> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("timestamp");
      const request = index.openCursor(null, "next"); // Sort by timestamp ascending (oldest first)

      const chats: ChatHistory[] = [];

      request.onerror = () => {
        reject(new Error("Failed to get chats"));
      };

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const chat = cursor.value as ChatHistory;
          // Convert timestamp strings back to Date objects
          chat.messages = chat.messages.map((msg) => ({
            ...msg,
            timestamp: typeof msg.timestamp === 'string' 
              ? new Date(msg.timestamp) 
              : msg.timestamp,
          }));
          chats.push(chat);
          cursor.continue();
        } else {
          resolve(chats);
        }
      };
    });
  }

  async deleteChat(id: string): Promise<void> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => {
        reject(new Error("Failed to delete chat"));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  async updateChat(id: string, updates: Partial<ChatHistory>): Promise<void> {
    const chat = await this.getChat(id);
    if (!chat) {
      throw new Error("Chat not found");
    }

    const updatedChat: ChatHistory = {
      ...chat,
      ...updates,
      updatedAt: Date.now(),
    };

    await this.saveChat(updatedChat);
  }

  async deleteOldChats(maxAgeHours: number = 24): Promise<number> {
    const db = await this.ensureDb();
    const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert hours to milliseconds
    const cutoffTime = Date.now() - maxAge;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("timestamp");
      const request = index.openCursor(IDBKeyRange.upperBound(cutoffTime));

      let deletedCount = 0;

      request.onerror = () => {
        reject(new Error("Failed to delete old chats"));
      };

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const chat = cursor.value as ChatHistory;
          // Delete chat if it's older than maxAgeHours
          if (chat.timestamp < cutoffTime) {
            cursor.delete();
            deletedCount++;
          }
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };
    });
  }
}

export const chatStorage = new ChatStorage();

