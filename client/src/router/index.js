import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ClassesView from '../views/ClassesView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import NotFoundView from '../views/NotFoundView.vue'

// Una rotta per pagina. Le pagine riservate (prenotazioni e admin)
// arrivano quando ci sarà il login, insieme ai controlli di accesso.
const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/lezioni', name: 'classes', component: ClassesView },
  { path: '/accedi', name: 'login', component: LoginView },
  { path: '/registrati', name: 'register', component: RegisterView },
  // Qualsiasi indirizzo che non corrisponde alle rotte sopra
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
]

// createWebHistory dà indirizzi puliti (/lezioni invece di /#/lezioni).
// In produzione l'hosting deve rimandare ogni indirizzo a index.html,
// altrimenti ricaricando la pagina su /lezioni si ottiene un 404.
const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
