<template>
  <section class="hero">
    <p class="eyebrow">CrossFit · Hyrox · Open Box</p>
    <h1>Allenati con noi, <span>prenota in un clic</span></h1>
    <p>
      CrossStreet Box è il box di CrossFit e Hyrox nel cuore della città.
      Guarda il calendario delle lezioni, scegli il tuo orario e prenota il posto.
    </p>
    <RouterLink to="/lezioni" class="button">Vedi le lezioni</RouterLink>
  </section>

  <section class="categories">
    <article>
      <h2>CrossFit</h2>
      <p>WOD guidati dai coach, per tutti i livelli.</p>
    </article>
    <article>
      <h2>Hyrox</h2>
      <p>Corsa e stazioni funzionali per preparare la gara.</p>
    </article>
    <article>
      <h2>Open Box</h2>
      <p>Il box a disposizione per allenarti in autonomia.</p>
    </article>
  </section>

  <section class="how">
    <h2>Come funziona</h2>
    <ol>
      <li><strong>Registrati</strong> con nome, email e password.</li>
      <li><strong>Scegli la lezione</strong> dal calendario e prenota il tuo posto.</li>
      <li><strong>Cambi idea?</strong> Disdici da Le mie prenotazioni, il posto torna libero.</li>
    </ol>
  </section>
</template>

<style scoped>
/* Fascia scura in alto, come la barra di navigazione */
.hero {
  background: var(--color-dark);
  color: var(--color-light);
  border-radius: 8px;
  padding: 3rem 2rem;
  margin: 2rem 0;
}

.eyebrow {
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-accent);
  margin-bottom: 0.75rem;
}

.hero h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.hero h1 span {
  color: var(--color-accent);
}

.hero p {
  max-width: 36rem;
  margin-bottom: 1.5rem;
}

.categories {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.categories article {
  border-left: 4px solid var(--color-accent);
  background: var(--color-surface);
  padding: 1rem 1.25rem;
}

.categories h2 {
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
}

.how {
  padding-bottom: 3rem;
}

.how h2 {
  font-size: 1.3rem;
  margin-bottom: 0.75rem;
}

.how ol {
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

@media (max-width: 760px) {
  .hero {
    padding: 2rem 1.25rem;
    margin: 1rem 0 1.5rem;
  }

  .hero h1 {
    font-size: 1.9rem;
  }
}
</style>
