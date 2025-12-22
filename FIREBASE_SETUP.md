# Configuración de Firebase para Votacions

Esta guía explica cómo configurar Firebase para autenticar usuarios y guardar votaciones en la app.

## 1. Crear un proyecto Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en **"Crear un proyecto"**
3. Ingresa el nombre del proyecto (p.e. `votacions`)
4. Acepta los términos y crea el proyecto
5. Espera a que se complete la inicialización

## 2. Habilitar Autenticación por Email/Contraseña

1. En la consola Firebase, ve a **Autenticación** (izquierda)
2. Haz clic en la pestaña **Sign-in method**
3. Busca **Email/Contraseña** y haz clic
4. Activa **Email/Contraseña** y guarda
5. Ve a la pestaña **Usuarios** y haz clic **Añadir usuario**
   - Ingresa un email (p.e. `tu@ejemplo.com`)
   - Ingresa una contraseña segura
   - Haz clic **Crear usuario**

## 3. Obtener la configuración de Firebase

1. En la consola Firebase, ve al icono de engranaje (arriba izquierda) → **Configuración del proyecto**
2. Ve a la pestaña **General**
3. Desplázate hasta encontrar la sección **Tu aplicación** → **Web** (icono `</>`)
4. Copia la configuración que aparece:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## 4. Actualizar index.html con la configuración

1. Abre [index.html](index.html) en tu editor
2. Busca la sección `// Firebase Config`
3. Reemplaza los valores `YOUR_API_KEY`, `YOUR_AUTH_DOMAIN`, etc. con los que copiaste del paso 3
4. Guarda el archivo y sube los cambios:

```bash
git add index.html
git commit -m "Update Firebase config"
git push origin main
```

## 5. Probar la autenticación

1. Recarga la página [https://cavecavet.github.io/votacions/](https://cavecavet.github.io/votacions/)
2. Ingresa el email y contraseña que creaste en el paso 2
3. Si todo funciona, deberías ver la galería de fotos
4. Las puntuaciones se guardan automáticamente en `localStorage`

## 6. Guardar votaciones en GitHub (opcional)

Para guardar votaciones en tu repositorio GitHub:

1. Crea un Personal Access Token en GitHub:
   - Ve a [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
   - Haz clic **Generate new token**
   - Selecciona el scope `repo` (acceso a repositorios)
   - Genera el token y **cópialo** (no lo guardes en el repo)

2. En la app, haz clic en **"Guardar en GitHub"**
3. Sigue los prompts:
   - Owner: `tu_usuario_github`
   - Repositorio: `votacions`
   - Ruta: `data/ratings.json` (se creará automáticamente)
   - Personal Access Token: pega el token que generaste

4. Las votaciones se guardarán en `data/ratings.json` en tu repo

## 7. Usar Firestore para guardar votaciones (recomendado)

Para persistencia permanente sin token manual:

1. En Firebase Console, ve a **Firestore Database**
2. Haz clic **Crear base de datos**
3. Selecciona **Modo producción** y elige tu región
4. Crea una colección llamada `ratings`
5. En `index.html`, añade código para guardar en Firestore cuando se puntúa:

```javascript
// En la función rate(stars):
async function rate(stars) {
  if (!currentUser) return;
  if (!IMAGES || !IMAGES[index]) return;
  
  const imageId = IMAGES[index].id;
  const key = `${currentUser.email}_${imageId}`;
  ratings[key] = stars;
  
  // Guardar en localStorage
  saveRatingsToLocalStorage();
  
  // Guardar en Firestore (opcional)
  if (firestore) {
    try {
      const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      const ratingRef = doc(firestore, 'ratings', key);
      await setDoc(ratingRef, {
        email: currentUser.email,
        imageId: imageId,
        stars: stars,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error('Error saving to Firestore:', err);
    }
  }
  
  // Update UI
  saveMsgEl.textContent = "¡Guardado!";
  myRatingEl.textContent = stars;
  renderStars(stars);
}
```

## 8. Seguridad de Firestore

Para que solo usuarios autenticados puedan leer/escribir:

1. En Firebase Console, ve a **Firestore Database** → **Reglas**
2. Reemplaza las reglas con:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/ratings_data/{document=**} {
      allow read, write: if request.auth.uid == uid;
    }
  }
}
```

3. Haz clic **Publicar**

## 9. Reset de Contraseña

Cuando un usuario hace clic en "¿Olvidaste tu contraseña?":

1. Firebase envía un email de reset a la dirección registrada
2. El email se envía desde `noreply@firebase.com`
3. **Comprueba spam/promociones** si no lo ves en la bandeja
4. **El usuario debe existir en Firebase Authentication** antes de poder resetear su contraseña

Si no recibe el email:
- Verifica que el usuario esté registrado en **Authentication** → **Usuarios**
- Algunos proveedores de email bloquean correos de Firebase; prueba con otro email
- Espera unos minutos (Firebase puede tener retrasos)

## Troubleshooting

- **"Firebase no inicializado"**: Comprueba que la configuración en `index.html` sea correcta
- **"Email o contraseña incorrectos"**: Verifica que el usuario exista en Firebase Authentication
- **CORS errors**: Los errores CORS al usar GitHub API son normales; usa `localStorage` como fallback
- **Ratings no se guardan**: Comprueba que `localStorage` esté habilitado en tu navegador

## Referencias

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Firebase Firestore Docs](https://firebase.google.com/docs/firestore)
- [Firebase Console](https://console.firebase.google.com/)
