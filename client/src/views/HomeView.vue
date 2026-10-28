<template>
  <section class="hero">
    <h1>Allenati con noi, prenota in un clic</h1>
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
</template>

<style scoped>
.hero {
  padding: 3rem 0 2rem;
}

.hero h1 {
  font-size: 2.25rem;
  line-height: 1.15;
  margin-bottom: 1rem;
}

.hero p {
  max-width: 36rem;
  margin-bottom: 1.5rem;
}

.categories {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: 1rem;
  padding-bottom: 3rem;
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
</style>
