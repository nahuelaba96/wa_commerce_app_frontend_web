# WhatsApp IA Commerce — Frontend

Aplicación web de WhatsApp IA Commerce, desarrollada con Angular 22.2, Angular Material y TypeScript. Incluye pantallas de inicio de sesión y registro, dashboard, productos, conversaciones y configuración.

## Requisitos

- Node.js compatible con Angular CLI 22.
- npm (el proyecto declara `npm@11.17.0` como package manager).
- Microservicios de autenticación y backend disponibles para probar los flujos completos.

## Instalación y desarrollo local

Desde la raíz de `whatsapp-ai-frontend/`:

```sh
npm ci
npm start
```

La aplicación de desarrollo queda disponible en `http://localhost:4200/` y recarga automáticamente los cambios.

## Servicios API

Las URLs base de desarrollo están definidas en `src/app/core/config/api.config.ts`:

- Backend: `http://localhost:8080/api`
- Autenticación: `http://localhost:8081/api/auth`

Para otros entornos, ajustar la configuración de API del frontend y coordinar los orígenes permitidos con `BACKEND_CORS_ALLOWED_ORIGINS` y `AUTH_ALLOWED_ORIGINS` en los servicios correspondientes.

La autenticación utiliza access tokens Bearer para las solicitudes al backend y cookies de refresh enviadas con credenciales al servicio de autenticación. El servicio de autenticación debe estar configurado para aceptar el origen explícito del frontend.

## Build y pruebas

```sh
npm run build
npm test
```

Los scripts `build` y `test` del `package.json` ejecutan esos comandos. Las pruebas unitarias usan el runner configurado por Angular (`Vitest`).

No hay un script ni una configuración e2e definida actualmente en `package.json` y `angular.json`; no ejecutar `ng e2e` hasta que se incorpore un framework de pruebas end-to-end.
