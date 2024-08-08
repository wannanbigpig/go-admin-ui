import { createWebHistory, createRouter } from "vue-router";
import routes from "./routes";
import { beforeEach, afterEach } from "./guard";

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(beforeEach);
router.afterEach(afterEach);

export default router;
