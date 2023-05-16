import { createApp } from "vue";
import { Quasar } from "quasar";
import App from "./App.vue";
import { defineCustomElements } from "@ionic/pwa-elements/loader";

// Import icon libraries
import "@quasar/extras/material-icons/material-icons.css";

// Import Quasar css
import "quasar/src/css/index.sass";

defineCustomElements(window);
const app = createApp(App);

app.use(Quasar, {
  plugins: {}, // import Quasar plugins and add here
});

app.mount("#app");
