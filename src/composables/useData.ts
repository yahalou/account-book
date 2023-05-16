import { ref, onMounted, watch } from "vue";
import {
  Camera,
  CameraResultType,
  CameraSource,
  Photo,
} from "@capacitor/camera";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Preferences } from "@capacitor/preferences";
import { isPlatform } from "@ionic/vue";
import { Capacitor } from "@capacitor/core";

interface UserPhoto {
  filepath: string; // 文件名
  webviewPath?: string; // file://...
}

export interface Item {
  photo: UserPhoto;
  name: string;
  price: number;
  description: string;
  id: number;
}

const items = ref<Item[]>([]);
let maxID = ref(0);

async function convertBlobToBase64(blob: Blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });
}

async function savePicture(photo: Photo, fileName: string): Promise<UserPhoto> {
  // 1. 将photo转为base64
  let base64Data: string;
  // "hybrid" will detect mobile - iOS or Android
  if (isPlatform("hybrid")) {
    const file = await Filesystem.readFile({
      path: photo.path!,
    });
    base64Data = file.data;
  } else {
    // Fetch the photo, read as a blob, then convert to base64 format
    const response = await fetch(photo.webPath!);
    const blob = await response.blob();
    base64Data = (await convertBlobToBase64(blob)) as string;
  }
  // 2. 保存base64
  const savedFile = await Filesystem.writeFile({
    path: fileName,
    data: base64Data,
    directory: Directory.Data,
  });

  if (isPlatform("hybrid")) {
    // Display the new image by rewriting the 'file://' path to HTTP
    // Details: https://ionicframework.com/docs/building/webview#file-protocol
    return {
      filepath: savedFile.uri,
      webviewPath: Capacitor.convertFileSrc(savedFile.uri),
    };
  } else {
    // Use webPath to display the new image instead of base64 since it's
    // already loaded into memory
    return {
      filepath: fileName,
      webviewPath: photo.webPath,
    };
  }
}

async function takePhoto(): Promise<UserPhoto> {
  const photo = await Camera.getPhoto({
    resultType: CameraResultType.Uri,
    source: CameraSource.Camera,
    quality: 20,
  });
  const fileName = new Date().getTime() + ".jpeg";
  const savedFileImage = await savePicture(photo, fileName);

  return savedFileImage;
}

async function deletePhoto(photo: UserPhoto) {
  // delete photo file from filesystem
  const filename = photo.filepath.substr(photo.filepath.lastIndexOf("/") + 1);
  await Filesystem.deleteFile({
    path: filename,
    directory: Directory.Data,
  });
}

async function deleteItem(item: Item) {
  await deletePhoto(item.photo);
  items.value = items.value.filter((p) => p.id !== item.id);
}

const ITEM_STORAGE = "items";
async function loadSaved() {
  const itemList = await Preferences.get({ key: ITEM_STORAGE });
  const itemsInPreferences = itemList.value ? JSON.parse(itemList.value) : [];

  // If running on the web...
  if (!isPlatform("hybrid")) {
    for (const item of itemsInPreferences) {
      const file = await Filesystem.readFile({
        path: item.photo.filepath,
        directory: Directory.Data,
      });
      // Web platform only: Load the photo as base64 data
      item.photo.webviewPath = `data:image/jpeg;base64,${file.data}`;
    }
  }

  items.value = itemsInPreferences;
  items.value.forEach((e) => (maxID.value = Math.max(maxID.value, e.id)));
  maxID.value++;
}

function cacheItems() {
  Preferences.set({
    key: ITEM_STORAGE,
    value: JSON.stringify(items.value),
  });
}

watch(items, () => {
  cacheItems();
});

function saveItems(item: Item) {
  items.value = items.value.filter((e) => e.id !== item.id);
  items.value.push(item);
  maxID.value++;
}

function deleteItems(item: Item) {
  deletePhoto(item.photo);
  items.value = items.value.filter((e) => e.id !== item.id);
}

export const useData = () => {
  onMounted(loadSaved);
  return {
    takePhoto,
    items,
    maxID,
    saveItems,
    deleteItems,
    deletePhoto,
  };
};
