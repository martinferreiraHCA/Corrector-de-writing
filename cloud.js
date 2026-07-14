/* ===== Nube (Firebase): base de datos común de correcciones, SIN login =====
   Módulo ES. Si FIREBASE_CONFIG es null o la carga falla, window.Cloud queda en null
   y el sitio funciona igual que siempre (solo localStorage).

   No hay autenticación visible: se usa una sesión anónima de Firebase (invisible
   para el usuario) solo para que las reglas de Firestore puedan exigir
   "request.auth != null" y la base no quede abierta a escrituras externas. */

window.Cloud = null;

const cfg = typeof FIREBASE_CONFIG !== "undefined" ? FIREBASE_CONFIG : null;

if (cfg && cfg.apiKey) {
  try {
    const V = "10.12.2";
    const [{ initializeApp }, authMod, fsMod] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`),
    ]);

    const app = initializeApp(cfg);
    const auth = authMod.getAuth(app);
    const db = fsMod.getFirestore(app);

    // Sesión anónima invisible (requiere habilitar "Anónimo" en Authentication)
    await authMod.signInAnonymously(auth);

    window.Cloud = {
      /* Guarda una corrección en la colección común "corrections" */
      async saveCorrection(data) {
        const ref = await fsMod.addDoc(fsMod.collection(db, "corrections"), {
          uid: auth.currentUser?.uid || "",
          createdAt: fsMod.serverTimestamp(),
          ...data,
        });
        return ref.id;
      },

      /* Últimas correcciones de toda la comunidad (para el corpus) */
      async fetchCorpus(max = 500) {
        const q = fsMod.query(
          fsMod.collection(db, "corrections"),
          fsMod.orderBy("createdAt", "desc"),
          fsMod.limit(max)
        );
        const snap = await fsMod.getDocs(q);
        return snap.docs.map((d) => {
          const data = d.data();
          return { id: d.id, ...data, createdAt: data.createdAt?.toDate?.() || null };
        });
      },
    };
  } catch (err) {
    console.warn("Firebase no disponible; el sitio sigue funcionando sin nube.", err);
    window.Cloud = null;
  }
}

window.CloudReady = true;
document.dispatchEvent(new CustomEvent("cloud-ready"));
