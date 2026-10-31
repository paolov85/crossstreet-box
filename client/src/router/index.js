import { createRouter, createWebHistory } from 'vue-router'
import { session } from '../auth'
import HomeView from '../views/HomeView.vue'
import ClassesView from '../views/ClassesView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import MyBookingsView from '../views/MyBookingsView.vue'
import AdminView from '../views/AdminView.vue'
import NotFoundView from '../views/NotFoundView.vue'

// Una rotta per pagina. Il campo meta dice chi può aprirla:
// - requiresAuth: solo chi ha fatto il login
// - requiresAdmin: solo gli admin
// - guestOnly: solo chi non ha fatto il login (non ha senso riaprire
//   la pagina di accesso quando si è già dentro)
const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/lezioni', name: 'classes', component: ClassesView },
  { path: '/accedi', name: 'login', component: LoginView, meta: { guestOnly: true } },
  { path: '/registrati', name: 'register', component: RegisterView, meta: { guestOnly: true } },
  { path: '/prenotazioni', name: 'my-bookings', component: MyBookingsView, meta: { requiresAuth: true } },
  { path: '/admin', name: 'admin', component: AdminView, meta: { requiresAuth: true, requiresAdmin: true } },
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

// Route guard: viene eseguita prima di ogni cambio di pagina e decide
// se lasciar passare (return true) o mandare altrove.
// È solo una comodità per l'utente: la protezione vera sta nel server,
// che senza un token valido risponde 401 qualunque cosa faccia il browser.
router.beforeEach((to) => {
  const isLoggedIn = session.user !== null

  if (to.meta.requiresAuth && !isLoggedIn) {
    // Salvo la pagina richiesta, così dopo il login si torna lì
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiresAdmin && session.user.role !== 'admin') {
    return { name: 'home' }
  }

  if (to.meta.guestOnly && isLoggedIn) {
    return { name: 'classes' }
  }

  return true
})

export default router
