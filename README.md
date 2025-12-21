# votacions

Web estática para **puntuar fotos** (1–5 estrellas) con acceso restringido a un grupo de usuarios.

- Hosting: **GitHub Pages**
- Backend: **Firebase** (Authentication + Firestore)
- Orden de fotos: **aleatorio estable por usuario**
- Se **ocultan** la media y el número de votos.

## Estructura

```
/ (raíz del repo)
├── index.html
├── styles.css
├── images.json          # Se genera con generate_images_manifest.py
├── generate_images_manifest.py
└── /images              # Copia aquí tus fotos
```

## Pasos

1. Copia tus fotos a `./images`.
2. Ejecuta `python generate_images_manifest.py` para generar `images.json`.
3. En Firebase:
   - Crea proyecto y **habilita Email/Password** en Authentication.
   - **Añade los usuarios** (no hay registro público).
   - **Firestore**: pega las reglas de abajo.
   - En **Authentication → Settings → Authorized domains**, añade tu dominio de GitHub Pages (p. ej., `tu-usuario.github.io`).
4. Abre `index.html` y pega tu `firebaseConfig`.
5. Sube el repo a GitHub y activa **Settings → Pages**.

## Reglas de Firestore

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthed() {
      return request.auth != null;
    }

    match /images/{imageId}/ratings/{userId} {
      allow read: if isAuthed();
      allow write: if isAuthed() && userId == request.auth.uid
        && request.resource.data.stars is number
        && request.resource.data.stars >= 1
        && request.resource.data.stars <= 5;
    }

    match /images/{imageId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

## Notas
- Cada usuario sólo puede puntuar una vez por foto (se guarda en `images/{imageId}/ratings/{uid}`).
- Si alguien olvida la contraseña, puede usar **"¿Olvidaste tu contraseña?"** en la pantalla de login.
- No se muestran estadísticas globales (media y nº de votos) en la UI.
