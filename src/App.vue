<template>
  <q-layout view="hHh lpR fFf">
    <q-header reveal elevated class="bg-primary text-white">
      <div class="q-pa-sm">
        <div class="row no-wrap">
          <q-toolbar class="bg-primary text-white rounded-borders col-2">
            <q-icon name="account_balance_wallet" size="md"></q-icon>
          </q-toolbar>
          <q-toolbar class="col-10">
            <q-input
              dark
              dense
              standout
              v-model="search"
              input-class="text-right"
              class="q-ml-md"
              style="width: 100%"
              debounce="500"
            >
              <template v-slot:append>
                <q-icon v-if="search === ''" name="search" />
                <q-icon
                  v-else
                  name="clear"
                  class="cursor-pointer"
                  @click="search = ''"
                />
              </template>
            </q-input>
          </q-toolbar>
        </div>
      </div>
    </q-header>

    <q-page-container>
      <div class="q-pa-sm row q-gutter-sm">
        <div class="row col-6" style="width: 48%" v-for="item in filterItems">
          <q-card
            class="my-card"
            @click="
              showCard = true;
              itemToShow = JSON.parse(JSON.stringify(item));
            "
          >
            <q-img
              :src="item.photo.webviewPath"
              style="max-height: 200px"
              spinner-color="primary"
              loading="lazy"
            />

            <q-card-section>
              <div class="text-h5">{{ item.name }}</div>
              <div class="text-subtitle1 text-red-6 text-weight-bolder">
                {{ item.price }} 元
              </div>
            </q-card-section>

            <q-card-section class="q-pt-none item-description">
              {{ item.description }}
            </q-card-section>
          </q-card>
        </div>
      </div>
      <q-page-sticky position="bottom-right" :offset="[18, 18]">
        <q-btn fab icon="photo_camera" color="primary" @click="addItem" />
      </q-page-sticky>
    </q-page-container>
  </q-layout>
  <q-dialog v-model="showCard" @before-hide="beforeLeave">
    <q-card>
      <q-img :src="itemToShow.photo.webviewPath" style="max-height: 300px" />

      <q-card-section v-if="!editing">
        <div class="row no-wrap items-center">
          <div class="col">
            <div class="col text-h5">
              {{ itemToShow.name }}
            </div>
          </div>
        </div>
      </q-card-section>
      <q-card-section class="q-pt-none" v-if="!editing">
        <div class="text-h6 text-red-6 text-weight-bolder">
          {{ itemToShow.price }} 元
        </div>

        <div
          class="text-body text-grey item-description"
          style="min-width: 300px"
        >
          {{ itemToShow.description }}
        </div>
      </q-card-section>

      <q-card-section v-if="editing">
        <q-btn
          fab
          color="primary"
          icon="photo_camera"
          class="absolute"
          style="top: 0; right: 12px; transform: translateY(-50%)"
          @click="patchItem"
        />

        <div class="row no-wrap items-center">
          <div class="col">
            <q-input
              v-model="itemToShow.name"
              input-class="text"
              class="q-ml-md"
              label="名称"
            >
            </q-input>
          </div>
        </div>
      </q-card-section>
      <q-card-section class="q-pt-none" v-if="editing">
        <q-input
          v-model="itemToShow.price"
          type="number"
          label="进价"
          style="max-width: 100px"
          class="q-ml-md"
          suffix="元"
        >
        </q-input>
        <div class="q-pa-md" style="min-width: 300px">
          <q-input
            v-model="itemToShow.description"
            type="textarea"
            label="描述"
          />
        </div>
      </q-card-section>
      <q-separator />

      <q-card-actions align="right">
        <q-btn
          v-if="!editing"
          flat
          color="primary"
          label="修改"
          @click="editing = !editing"
        />

        <q-btn
          v-if="editing"
          flat
          color="negative"
          label="删除"
          @click="
            deleteItems(itemToShow);
            editing = false;
            showCard = false;
          "
        />
        <q-btn
          v-if="editing"
          flat
          color="primary"
          label="保存"
          @click="
            saveItems(itemToShow);
            editing = false;
          "
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useData, Item } from "@/composables/useData";

const search = ref("");
const showCard = ref(false); // 控制card展示
const editing = ref(false); // 是否是编辑界面

const isAdding = ref(false);

const { items, takePhoto, maxID, saveItems, deleteItems, deletePhoto } =
  useData();

const filterItems = computed(() => {
  if (search.value === "") return items.value;
  else return items.value.filter((e) => e.name.indexOf(search.value) !== -1);
});

let itemToShow = ref<Item>({
  photo: { filepath: "", webviewPath: "" },
  name: "",
  price: 1,
  description: "",
  id: maxID.value,
});

function initialLizeItem() {
  itemToShow.value = {
    photo: { filepath: "", webviewPath: "" },
    name: "",
    price: 1,
    description: "",
    id: maxID.value,
  };
}

async function addItem() {
  isAdding.value = true;
  initialLizeItem();
  const tempPhoto = await takePhoto();
  editing.value = true;
  itemToShow.value.photo = tempPhoto;
  showCard.value = true;
}

async function patchItem() {
  const tempPhoto = await takePhoto();
  editing.value = true;
  itemToShow.value.photo = tempPhoto;
}

function beforeLeave() {
  editing.value = false;
  if (isAdding.value) {
    if (items.value.filter((e) => e.id === itemToShow.value.id).length === 0) {
      deletePhoto(itemToShow.value.photo);
    }
  }
  isAdding.value = false;
}
</script>

<style scoped>
.my-card {
  width: 100%;
  max-width: 250px;
}

.item-description {
  word-wrap: break-word;
}
</style>
