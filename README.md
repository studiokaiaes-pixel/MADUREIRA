# SISTEMA DE MADUREIRA 3.0 — Documentación Técnica Completa

Plataforma integral de gestión pastoral, secretaría eclesiástica, expedientes de miembros, emisión documental en PDF y administración jerárquica multi-sede para la **Iglesia Assembleia de Deus — Ministério de Madureira (CONAMAD)**.

---

## Tabla de Contenidos

1. [Resumen del Sistema](#1-resumen-del-sistema)
2. [Stack Tecnológico y Dependencias](#2-stack-tecnológico-y-dependencias)
3. [Estructura Exacta del Proyecto](#3-estructura-exacta-del-proyecto)
4. [Arquitectura, Roles y Enrutamiento](#4-arquitectura-roles-y-enrutamiento)
5. [Base de Datos Relacional (16 Tablas)](#5-base-de-datos-relacional-16-tablas)
6. [Flujos Funcionales Detallados](#6-flujos-funcionales-detallados)
7. [Generación de Documentos PDF](#7-generación-de-documentos-pdf)
8. [Referencia Completa de API (Endpoints)](#8-referencia-completa-de-api-endpoints)
9. [Instalación, Scripts y Variables de Entorno](#9-instalación-scripts-y-variables-de-entorno)
10. [Credenciales Iniciales Sembradas (Demo)](#10-credenciales-iniciales-sembradas-demo)
11. [Limitaciones Técnicas y Notas de Implementación](#11-limitaciones-técnicas-y-notas-de-implementación)

---

## 1. Resumen del Sistema

El proyecto (**`SISTEMA DE MADUREIRA 3.0`** según `metadata.json`) es una aplicación web full-stack compuesta por:
- Un **servidor único en Node.js + Express** (`server.ts`) que expone la API REST `/api/*` y sirve la aplicación React (mediante `vite.middlewares` en desarrollo y archivos estáticos de `dist/` en producción) en el puerto `3000`.
- Una **base de datos PostgreSQL embebida** mediante **PGlite** (`@electric-sql/pglite`) administrada con **Drizzle ORM** (`src/db/index.ts`, `src/db/schema.ts`), con persistencia en disco dentro de `.data/local_pglite`.
- Un **cliente SPA en React 19 + TypeScript + Tailwind CSS 4** que adapta completamente la interfaz según el rol del usuario autenticado:
  - **Visitantes**: experiencia de presentación (`OnboardingExperience`), directorio público de congregaciones (`PublicPortal`) y acceso/registro (`AuthForm`).
  - **Miembros (`member`)**: portal móvil/web exclusivo (`MemberPortal`) con credencial digital, Ficha Oficial A4, solicitudes de cartas, cultos, comunicados y atención pastoral.
  - **Pastores y Secretarios locales**: panel integrado móvil/web (`AdminDashboard`) o suite modular lateral (`Sidebar` + módulos dedicados) con aislamiento estricto por congregación (`congregationId`).
  - **Supervisión General (`root`)**: consola oculta/fantasma (`RootConsole`) para administrar filiales, aprovisionar pastores/secretarios con generador de contraseñas y PDF de credenciales de acceso, auditar logs e inspeccionar cualquier sede en modo vista previa (`PreviewBanner`).

---

## 2. Stack Tecnológico y Dependencias

Definido en `package.json`:

### Dependencias activas en ejecución
| Tecnología | Versión (`package.json`) | Uso exacto en el proyecto |
| :--- | :--- | :--- |
| **React / React DOM** | `^19.0.1` | Interfaz de usuario SPA (`src/App.tsx` y `src/components/*`). |
| **TypeScript** | `^7.0.2` | Tipado estático en frontend y backend (`tsconfig.json`). |
| **Vite** | `^8.3.0` | Bundler y servidor de desarrollo integrado vía middleware (`vite.config.ts`). |
| **Tailwind CSS** | `^4.3.3` (`@tailwindcss/vite`) | Estilos utilitarios (`src/index.css`). |
| **Express** | `^4.21.2` | Servidor HTTP y API REST (`server.ts`). |
| **TSX** | `^4.21.0` | Ejecución directa de `server.ts` (`npm run dev` y `npm start`). |
| **Drizzle ORM** | `^0.45.4` | Definición de esquema y consultas tipadas (`src/db/schema.ts`). |
| **PGlite** | `^0.5.15` (`@electric-sql/pglite`) | Motor PostgreSQL embebido con persistencia en `.data/local_pglite`. |
| **jsPDF** | `^4.2.1` | Generación client-side de PDFs (Ficha A4, Credencial ID-1, Cartas y Credenciales de Acceso). |
| **Lucide React** | `^0.546.0` | Iconografía de toda la interfaz. |
| **Motion** | `^12.23.24` | Librería de animaciones disponible para componentes UI. |

### Dependencias/configuración presentes en el repositorio pero no activadas en runtime
- `@google/genai` (`^2.4.0`), `firebase` (`^13.2.0`), `firebase-admin` (`^14.5.0`), `pg` (`^8.23.1`), `drizzle-kit` (`^0.31.11`), `dotenv` (`^17.2.3`).
- Archivos `firebase-applet-config.json` y `src/db/drizzle.config.ts` (configuración para PostgreSQL externo vía `SQL_HOST`, `SQL_DB_NAME`, `SQL_ADMIN_USER`, `SQL_ADMIN_PASSWORD`).
- En la ejecución actual (`server.ts` y `src/db/index.ts`), **no se importan** ni Firebase, ni `@google/genai`, ni `pg`; toda la lógica corre localmente con Express + PGlite.

---

## 3. Estructura Exacta del Proyecto

```text
/
├── .env.example                       # Plantilla de variables de entorno (GEMINI_API_KEY, APP_URL)
├── firebase-applet-config.json        # Configuración de proyecto Firebase (referencia, sin uso activo en runtime)
├── index.html                         # Entrada HTML, metadatos SEO/OG y fuentes (Inter, Playfair Display, JetBrains Mono)
├── metadata.json                      # Nombre y capacidades declaradas de la aplicación
├── package.json                       # Scripts y dependencias
├── server.ts                          # Servidor Express, middleware de autenticación/RBAC, API REST y Vite SSR/static
├── tsconfig.json                      # Configuración TypeScript (noEmit, bundler resolution, alias @/*)
├── vite.config.ts                     # Configuración Vite + React + Tailwind v4 + control DISABLE_HMR
├── public/
│   └── assets/aistudio/               # Recursos gráficos (logos ADMM, plantillas de tarjeta CONAMAD, imágenes de cartas)
└── src/
    ├── App.tsx                        # Orquestador principal de sesión, vistas por rol y navegación modular
    ├── api.ts                         # Cliente HTTP fetch con gestión de token Bearer ('kryptos_auth_token')
    ├── index.css                      # Estilos globales Tailwind CSS
    ├── main.tsx                       # Punto de montaje React en #root
    ├── types.ts                       # Tipos e interfaces TypeScript compartidas
    ├── data/
    │   ├── authFlow.json              # Definición declarativa del flujo de autenticación
    │   └── onboardingFlow.json        # Definición declarativa de las pantallas de onboarding
    ├── db/
    │   ├── drizzle.config.ts          # Configuración Drizzle Kit para Postgres externo (SQL_HOST, etc.)
    │   ├── index.ts                   # Instancia PGlite (.data/local_pglite), DDL inicial y datos semilla
    │   └── schema.ts                  # Esquema relacional Drizzle (16 tablas PostgreSQL)
    ├── utils/
    │   ├── generateAccessCredentialPdf.ts # Generador PDF de credenciales de acceso (Modelos 1, 2 y 3)
    │   ├── generateCredentialPdf.ts       # Generador PDF de credencial física/digital ID-1 (85.6 x 54 mm)
    │   ├── generateFichaPdf.ts            # Generador PDF de Ficha Oficial de Miembro A4 y resolución de datos de sede
    │   └── letterTemplates.ts             # Plantillas de cartas oficiales, rellenado automático y generador PDF A4
    └── components/
        ├── AdminDashboard.tsx         # Panel integrado del Pastor Administrador (pantallas 07–17, móvil/desktop)
        ├── AdminExpedienteView.tsx    # Vista de expediente individual dentro del flujo integrado / portal
        ├── AuditModule.tsx            # Visor de registros de auditoría institucional
        ├── AuthForm.tsx               # Login, registro público por ciudad y recuperación de contraseña por documento
        ├── AvatarCustomizerModal.tsx  # Personalización de avatar
        ├── CartasModal.tsx            # Redacción, vista previa, aprobación, envío al pastor y descarga PDF de cartas
        ├── CommunicationsModule.tsx   # Publicación y listado de comunicados institucionales
        ├── CongregationsModule.tsx    # Directorio y alta/edición de congregaciones
        ├── CredentialsModule.tsx      # Emisión y consulta de credenciales digitales CONAMAD
        ├── DepartmentsModule.tsx      # Gestión de departamentos y ministerios
        ├── DocumentationModule.tsx    # Secretaría documental, plantillas y seguimiento de trámites
        ├── EditMemberFichaModal.tsx   # Edición de datos de la ficha oficial de miembro
        ├── EventsModule.tsx           # Calendario de cultos/eventos e inscripción de asistencia
        ├── HumationAvatar.tsx         # Componente visual de avatar
        ├── MemberDossierView.tsx      # Expediente completo del miembro (resumen, historial, documentos, solicitudes)
        ├── MemberPortal.tsx           # Portal exclusivo para usuarios con rol 'member'
        ├── MemberRequestsModule.tsx   # Bandeja de atención pastoral (peticiones de oración, consultas, sugerencias)
        ├── MemberTutorialModal.tsx    # Modal guía interactiva para miembros
        ├── MembersModule.tsx          # Directorio, filtros, altas, cambios de estado y traslados de miembros
        ├── Navbar.tsx                 # Barra superior (oculta para rol 'admin')
        ├── OfficialMemberFichaModal.tsx # Vista previa imprimible/PDF de la Ficha Oficial de Miembro
        ├── OnboardingExperience.tsx   # Pantallas 1–6 de bienvenida antes de entrar al portal o login
        ├── PastorMobileTabBar.tsx     # Barra de pestañas móvil para el flujo pastoral
        ├── PastorModulesHub.tsx       # Hub de módulos pastorales
        ├── PreviewBanner.tsx          # Banner superior al usar vista previa Root sobre un administrador
        ├── PublicPortal.tsx           # Portal público sin login (iglesias, horarios, cultos, comunicados)
        ├── ReportsModule.tsx          # Informes estadísticos de membresía y secretaría
        ├── RootConsole.tsx            # Consola Root Fantasma (aprovisionamiento, permisos, sedes, avisos, auditoría)
        ├── SecretaryDashboard.tsx     # Panel resumen inicial de secretaría/asesor en suite modular
        ├── SettingsModule.tsx         # Configuración de espacio y datos institucionales de sede (incluido NIF)
        ├── Sidebar.tsx                # Menú lateral dinámico filtrado por rol y funciones asignadas
        ├── SpotlightTour.tsx          # Tour guiado por secciones de la interfaz
        └── VisualCredentialCard.tsx   # Tarjeta visual digital del carnet CONAMAD
```

---

## 4. Arquitectura, Roles y Enrutamiento

### Diagrama de Enrutamiento Principal (`src/App.tsx`)

```text
Usuario entra a /
   │
   ├─► ¿No autenticado (!currentUser)?
   │      ├─ guestView === 'onboarding'    ─► OnboardingExperience (Pantallas 1..6)
   │      ├─ guestView === 'public_portal' ─► PublicPortal (Iglesias, eventos, comunicados)
   │      └─ guestView === 'login'         ─► AuthForm (Login / Registro / Recuperar contraseña)
   │
   └─► Autenticado (currentUser)
          ├─ isViewingPublicPortal === true ─► PublicPortal (con botón retorno al panel)
          ├─ role === 'member'              ─► MemberPortal (aislado, nunca accede a admin)
          ├─ role === 'root'
          │     ├─ previewState.isActive    ─► PreviewBanner + AdminDashboard (en sigilo)
          │     └─ normal                   ─► RootConsole
          ├─ role === 'admin'               ─► AdminDashboard (panel integrado)
          └─ otros roles de gestión         ─► Sidebar + Módulo según currentSection
             (local_pastor, general_pastor, local_secretary,
              general_secretary, secretary, pastor_advisor, superadmin)
```

### Matriz Exacta de Roles y Alcance (`server.ts` y `Sidebar.tsx`)

1. **`root` / `superadmin` (Alcance Global)**:
   - Acceso universal en `requireRole`.
   - En `RootConsole` gestiona todas las sedes, aprueba/descarta registros de cualquier filial, aprovisiona administradores/secretarios/asesores, inicia vista previa fantasma (`previewTargetAdminId`) y publica avisos que aparecen firmados como **`"Soporte del Sistema"`** para mantener sigilo.
2. **`general_pastor` / `general_secretary` (Alcance Global de Secretaría)**:
   - Pueden consultar miembros, expedientes, documentos, eventos y auditoría globalmente.
3. **`admin` / `local_pastor` (Pastor Titular de Sede)**:
   - Aislado estrictamente a su `congregationId`.
   - Puede gestionar miembros, aprobaciones de registro de su sede, actualizar datos institucionales de su congregación (incluido el **NIF**), designar/actualizar al secretario local (`POST /api/admin/secretary`), y **aprobar/enviar cartas y documentos**.
4. **`local_secretary` / `secretary` (Secretaría / Admin Junior)**:
   - Aislado a su `congregationId`.
   - En `Sidebar.tsx`, `secretary` y `local_secretary` ven: `inicio`, `miembros`, `expedientes`, `documentacion`, `eventos`, `credenciales`.
   - En documentación/cartas: **no puede aprobar, entregar ni rechazar** directamente (`403` en `POST /api/documents/requests/:id/status`); debe preparar y **enviar al Pastor Titular** (`status: 'pending_approval'`).
5. **`pastor_advisor` (Pastor Asesor / Secundario — Múltiples Funciones)**:
   - Al crearse en `RootConsole`, `assignedFeature` almacena una lista separada por comas de funciones seleccionadas (por defecto `'expedientes'`; disponibles: `expedientes`, `eventos`, `atencion`, `documentacion`, `comunicaciones`, `credenciales`).
   - `Sidebar.tsx` y `SecretaryDashboard.tsx` filtran dinámicamente sus accesos según esa lista (si tiene `expedientes`, también habilita `miembros`).
   - En documentación/cartas, al igual que secretaría, debe **enviar al Pastor Titular para aprobación** y no puede aprobar directamente.
6. **`member` (Miembro)**:
   - Acceso exclusivo a `MemberPortal`.
   - Solo puede consultar su propio expediente (`member.userId === u.id`), editar sus propios datos personales en `PUT /api/members/:id` (sin modificar `ministerialFunction` ni `observations`, reservados al personal), descargar su Ficha A4 y Credencial Digital, solicitar cartas y enviar peticiones en Atención Pastoral.

---

## 5. Base de Datos Relacional (16 Tablas)

Definida en `src/db/schema.ts` e inicializada automáticamente en `src/db/index.ts` mediante `initLocalDatabase()`:

| Tabla | Propósito | Campos clave |
| :--- | :--- | :--- |
| **`congregations`** | Sedes eclesiásticas / filiales | `id`, `code` (unique), `name`, `city`, `nif`, `address`, `postal_code`, `phone`, `email`, `pastor_name`, `secretary_name`, `service_schedules`, `status` |
| **`users`** | Cuentas de acceso y roles | `id`, `uid` (unique), `email` (unique), `name`, `password_hash`, `role`, `congregation_id`, `assigned_feature`, `status` |
| **`members`** | Expedientes canónicos de miembros | `id`, `user_id`, `congregation_id`, `member_number` (unique), `first_name`, `last_name`, `id_document`, `birth_date`, `nationality`, `phone`, `email`, `address`, `city`, `postal_code`, `admission_date`, `baptism_date`, `status`, `ministerial_function`, `department_name`, `pastor_responsible`, `secretary_responsible` |
| **`member_history`** | Trazabilidad de cambios en expedientes | `id`, `member_id`, `change_type`, `description`, `performed_by`, `previous_state`, `new_state`, `created_at` |
| **`member_documents`** | Documentos archivados/emitidos por miembro | `id`, `member_id`, `title`, `document_type`, `file_url`, `file_hash`, `issued_by`, `created_at` |
| **`document_templates`** | Catálogo de plantillas documentales | `id`, `code` (unique), `title`, `category`, `content_template`, `requires_pastoral_signature`, `requires_qr`, `is_active` |
| **`document_requests`** | Solicitudes y flujo de cartas/trámites | `id`, `dossier_number` (unique), `member_id`, `template_code`, `document_title`, `congregation_id`, `status`, `assigned_to`, `observations`, `resolved_at`, `verification_token`, `pdf_generated_url` |
| **`departments`** | Departamentos y ministerios por filial | `id`, `congregation_id`, `name`, `description`, `category`, `responsible_name`, `status` |
| **`department_members`** | Relación N:M departamentos–miembros | `id`, `department_id`, `member_id`, `role_in_department`, `joined_at` |
| **`events`** | Cultos, congresos, seminarios y reuniones | `id`, `congregation_id`, `title`, `event_type`, `description`, `location`, `starts_at`, `ends_at`, `responsible_name`, `max_capacity` |
| **`event_attendance`** | Registro y confirmación de asistencia | `id`, `event_id`, `member_id`, `registered_at`, `confirmed_attendance`, `confirmed_at` |
| **`announcements`** | Comunicados globales o por congregación | `id`, `title`, `content`, `target_scope`, `congregation_id`, `author_name`, `is_published`, `published_at` |
| **`member_requests`** | Atención pastoral y avisos de seguridad | `id`, `member_id`, `category`, `subject`, `description`, `is_confidential`, `status`, `assigned_to`, `response_text`, `responded_at` |
| **`digital_credentials`** | Credenciales digitales únicas con QR | `id`, `member_id` (unique), `qr_payload_token`, `issue_date`, `expiration_date`, `status`, `apple_wallet_ready`, `google_wallet_ready` |
| **`notifications`** | Notificaciones internas de sistema por usuario | `id`, `user_id`, `title`, `message`, `type`, `read_at`, `link_url` |
| **`audit_logs`** | Bitácora inmutable de auditoría institucional | `id`, `user_id`, `user_name`, `user_role`, `congregation_id`, `action`, `entity_type`, `entity_id`, `ip_address`, `changes_payload` |

---

## 6. Flujos Funcionales Detallados

### 6.1. Autenticación, Registro y Recuperación de Contraseña (`AuthForm.tsx` + `server.ts`)
1. **Login (`POST /api/auth/login`)**:
   - Valida correo (case-insensitive) y contraseña.
   - Bloquea cuentas con `status === 'pending'` (`403 ACCOUNT_PENDING_APPROVAL`) o `status === 'suspended'` (`403 ACCOUNT_SUSPENDED`), y en miembros verifica además que su registro en `members` no esté en `pending`.
   - Genera token aleatorio `sec_<48 hex>` guardado en el `Map` `sessions` en memoria del servidor y en `localStorage['kryptos_auth_token']` en cliente.
   - Devuelve usuario, expediente de miembro, credencial y registra el acceso en `audit_logs`.
2. **Registro Público (`POST /api/auth/register`)**:
   - Crea usuario (`role: 'member'`, `status: 'pending'`) y expediente en `members` (`status: 'pending'`) asociado a la congregación elegida (`cityWorkspaceId`), dejando trazabilidad en `member_history` y `audit_logs`.
   - El miembro no puede iniciar sesión hasta ser aprobado por un Pastor/Admin/Secretario/Root (`POST /api/admin/registrations/:id/approve`), momento en el que se activan `users`, `members` y se genera su registro en `digital_credentials`.
3. **Recuperación de Contraseña (`POST /api/auth/recover-password`)**:
   - Exige `email`, `idDocument` (DNI/NIE/CPF/Pasaporte) y `newPassword` (mín. 6 caracteres).
   - Compara el documento normalizado contra `members.idDocument` (si no tenía documento guardado aún, lo asocia al expediente).
   - Actualiza `users.passwordHash` y genera **triple notificación automática**:
     1. Registro en `notifications` para pastores/administradores de la sede.
     2. Registro confidencial en `member_requests` dirigido al pastor de la filial.
     3. Registro de evento `auth_recovery` en `audit_logs`.

### 6.2. Aprovisionamiento de Usuarios en `RootConsole.tsx`
Al pulsar crear usuario/administrador en `RootConsole`:
1. **Paso `'form'`**: captura nombre, correo, contraseña inicial (con **generador criptográfico de 12 caracteres** usando `crypto.getRandomValues`, botón mostrar/ocultar y copiar al portapapeles), sede existente o nueva ciudad, y rol (`local_pastor`, `pastor_advisor` con selector múltiple de funciones, o `secretary`).
2. **Paso `'permissions'`**: selección granular de permisos de módulos (`AVAILABLE_FEATURES`).
3. **Confirmación (`POST /api/root/admins`) → Paso `'created'`**:
   - Persiste el usuario en `users` (normalizando `assignedFeature` separado por comas si es `pastor_advisor`).
   - Descarga automáticamente el **PDF oficial de Credenciales de Acceso** correspondiente al rol y muestra en pantalla una vista previa completa con botón **Descargar PDF para Enviar**.

### 6.3. Flujo de Cartas Oficiales y Documentación (`CartasModal.tsx`, `DocumentationModule.tsx`, `MemberPortal.tsx`)
1. **Modelos de Cartas (`src/utils/letterTemplates.ts`)**:
   - **Activos (`ACTIVE_LETTER_TEMPLATES`)**:
     1. `carta_recomendacion` — Carta de Recomendación (viaje temporal, sin baja de membresía).
     2. `carta_traslado` — Carta de Traslado de Miembro (traslado definitivo a otra iglesia).
     3. `carta_invitacion_ministerial` — Carta de Invitación (Ministerial).
     4. `carta_invitacion_evento` — Carta de Invitación (Invitados / Evento, con tabla dinámica de invitados: nombre, pasaporte, fecha de nacimiento y nacionalidad).
   - **Deshabilitados**:
     - `carta_presentacion` marcada con `disabled: true` (excluida de `ACTIVE_LETTER_TEMPLATES`).
     - La función/solicitud de **Certificados** (`cert_membresia`, `cert_bautismo`) está deshabilitada en `MemberPortal.tsx` (tarjeta visual deshabilitada y opciones eliminadas del selector de solicitud del miembro).
2. **Autorrelleno inteligente**:
   - Al seleccionar un miembro, `createDefaultLetterValues(member, congregation)` rellena automáticamente nombre completo, documento de identidad, mes/año de ingreso, cargo/ministerio y datos institucionales de contacto de la sede (`resolveFichaChurchInfo`). En el portal del miembro, solo se le piden los datos faltantes de su perfil o los específicos de la carta antes de enviar la solicitud.
3. **Flujo de Aprobación según Rol**:
   - **Miembro**: envía solicitud (`status: 'received'`), visualiza el estado y descarga el PDF una vez aprobada/entregada.
   - **Secretaría (`secretary` / `local_secretary`) o Pastor Secundario (`pastor_advisor`)**: redacta o revisa la carta y solo ve acciones de **"Preparar y Enviar al Pastor"** / **"Enviar al Pastor (Para Aprobación)"** (`status: 'pending_approval'`). El backend bloquea con `403` si intentan pasar a `approved`, `delivered` o `rejected`.
   - **Pastor Titular (`admin`, `local_pastor`, `general_pastor`, `superadmin`, `root`)**: no ve el botón de enviarse a sí mismo; aprueba y envía directamente (`approved` / `delivered`), archivando el registro en `member_documents` sin duplicar por `verificationToken`.
4. **Alertas en tiempo real / sin leer**:
   - En `AdminDashboard.tsx`, el botón **Docs** muestra punto rojo exclusivamente cuando `pendingDocsCount > 0` (solicitudes en estado distinto de `approved`, `delivered` o `rejected`) o peticiones reales de `member_requests` abiertas.
   - En `MemberPortal.tsx`, el punto de alerta en **Docs** se activa únicamente ante documentos recién resueltos/no vistos y se limpia al visitar la pantalla persistiendo el estado en `localStorage`.

### 6.4. Configuración Institucional por Iglesia (NIF y Membrete)
- Cada congregación almacena su `nif`, `name`, `address`, `postalCode`, `city`, `phone`, `email`, `pastorName` y `secretaryName`.
- Editables desde Configuración / Perfil de Iglesia (`PUT /api/admin/congregation` o `PUT /api/congregations/:id`), reflejándose automáticamente en los membretes, NIF y pies de página de Cartas y Fichas A4.

---

## 7. Generación de Documentos PDF

Todos los PDFs se generan en el navegador mediante `jsPDF` + `<canvas>` de alta resolución:

| Módulo | Formato | Contenido generado |
| :--- | :--- | :--- |
| **`generateAccessCredentialPdf.ts`** | A4 Vertical (`1240x1754 px`) | **Credenciales de Acceso · Sistema de Madureira 3.0**: 3 modelos oficiales (**Modelo 1 Administrador**, **Modelo 2 Secretario/a**, **Modelo 3 Pastor Asesor/Secundario** con checklist `☑`/`☐`), tabla de usuario, enlace, contraseña temporal, rol, funciones, fecha, instrucciones de seguridad y acuse de recibo para firma. |
| **`letterTemplates.ts`** | A4 Vertical (`1240x1754 px`) | **Cartas Oficiales**: logotipo ADMM, dirección y NIF de la sede, título del modelo, fecha larga en español, cuerpo dinámico, tabla de invitados (si aplica), firmas de Pastor Presidente y Secretaría y pie institucional. Sin bloque de *Registro de salida*. |
| **`generateFichaPdf.ts`** | A4 Vertical (`1240x1754 px`) | **Ficha Oficial de Miembro**: logotipo ADMM, secciones 1. Datos Personales, 2. Datos de la Iglesia, 3. Consentimiento y Firma (RGPD), 4. Uso Exclusivo de Secretaría y pie dinámico según la sede. |
| **`generateCredentialPdf.ts`** | Tarjeta ID-1 (`85.6 x 54 mm`) | **Credencial Digital CONAMAD**: renderizado sobre la plantilla `/assets/aistudio/MODELO_DE_TARJETA_CONAMAD_a7c79806.webp` con matrícula, cargo normalizado (`PASTOR`, `PRESBÍTERO`, `EVANGELISTA`, `DIÁCONO`, `MISIONERO`, `MIEMBRO`), iglesia y nombre. |

---

## 8. Referencia Completa de API (Endpoints)

Todas las rutas protegidas requieren cabecera `Authorization: Bearer <token>`.

### Rutas Públicas
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/public/cities` | Lista sedes activas con `workspaceId`, `congregationId`, `city`, `churchName`, `pastorName`. |
| `GET` | `/api/public/congregations` | Directorio público con coordenadas geográficas aproximadas (`CITY_COORDINATES`) y horarios. |
| `GET` | `/api/public/congregations/:id` | Detalle público de una sede (datos, últimos 6 eventos, 6 comunicados y departamentos). |
| `GET` | `/api/public/events` | Eventos/cultos públicos (opcional `?congregationId=`). |
| `GET` | `/api/public/announcements` | Comunicados publicados (opcional `?congregationId=`, incluye `global`). |
| `GET` | `/api/public/departments` | Departamentos públicos (opcional `?congregationId=`). |

### Autenticación
| Método | Endpoint | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Público | Autentica credenciales, valida estado activo y devuelve token Bearer + perfil. |
| `POST` | `/api/auth/register` | Público | Crea cuenta de miembro y expediente en estado `pending`. |
| `POST` | `/api/auth/approve-demo` | Público | Activa cuenta y expediente demo por correo electrónico. |
| `POST` | `/api/auth/recover-password` | Público | Valida identidad por documento, cambia contraseña y notifica a pastor/auditoría. |
| `GET` | `/api/auth/me` | Autenticado | Devuelve usuario actual, miembro, credencial, congregación y estado de preview. |
| `POST` | `/api/auth/logout` | Autenticado | Elimina la sesión del mapa en memoria. |

### Secretaría, Miembros y Expedientes
| Método | Endpoint | Roles permitidos | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/secretary/stats` | Autenticado | Totales de membresía, congregaciones, departamentos, trámites, eventos y auditoría. |
| `GET` | `/api/members` | Autenticado | Lista miembros (miembro solo el suyo; roles locales solo su sede; globales todo/filtro). |
| `GET` | `/api/members/:id/dossier` | Autenticado | Expediente completo: datos, `history`, `documents`, `requests` y `credential`. |
| `POST` | `/api/members` | `superadmin`, `general_secretary`, `local_secretary`, `root` | Alta manual de miembro + generación automática de credencial digital e historial. |
| `PUT` | `/api/members/:id` | Staff autorizado o titular (`userId === u.id`) | Actualiza datos del expediente (el titular no puede editar cargo ministerial ni observaciones). |
| `POST` | `/api/members/:id/transfer` | `superadmin`, `general_secretary`, `general_pastor`, `local_pastor`, `root` | Traslada miembro a otra congregación y registra historial/auditoría. |
| `POST` | `/api/members/:id/status` | Staff global/local y `admin` | Cambia estado (`pending`, `active`, `inactive`, etc.) y activa usuario si pasa a `active`. |
| `GET` | `/api/members/:id/credential` | Autenticado | Obtiene o autogenera credencial digital del miembro. |

### Documentación, Congregaciones, Departamentos, Eventos, Comunicados y Atención
| Método | Endpoint | Roles permitidos | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/documents/templates` | Autenticado | Lista plantillas activas de `document_templates`. |
| `GET` | `/api/documents/requests` | Autenticado | Lista solicitudes documentales filtradas por rol, sede o `previewTargetAdminId`. |
| `POST` | `/api/documents/requests` | Autenticado | Crea trámite documental (`received` para miembros; staff puede crear en `pending_approval`). |
| `POST` | `/api/documents/requests/:id/status` | Staff (bloquea `approved`/`delivered`/`rejected` a secretarios y `pastor_advisor`) | Avanza estado del trámite y archiva en `member_documents` al aprobar/entregar. |
| `GET` | `/api/congregations` | Autenticado | Lista congregaciones con conteo de miembros (`memberCount`). |
| `POST` | `/api/congregations` | `superadmin`, `general_secretary`, `root` | Crea nueva congregación. |
| `PUT` | `/api/congregations/:id` | Global o responsable local de su misma sede | Actualiza datos institucionales de una congregación. |
| `GET` / `POST` | `/api/departments` | Autenticado / Staff para `POST` | Lista o crea departamentos por congregación. |
| `GET` / `POST` | `/api/events` | Autenticado / Staff para `POST` | Lista o crea eventos aislados por `congregationId`. |
| `POST` | `/api/events/:id/register` | Autenticado | Confirma inscripción/asistencia de un miembro a un evento. |
| `GET` / `POST` | `/api/announcements` | Autenticado / Staff para `POST` | Lista o publica comunicados (Root publica como `"Soporte del Sistema"`). |
| `GET` / `POST` | `/api/member-requests` | Autenticado | Lista o crea peticiones/consultas de atención pastoral. |
| `POST` | `/api/member-requests/:id/respond` | Staff pastoral/secretaría | Responde y marca petición como `answered`. |
| `GET` | `/api/audit-logs` | Staff y `admin` | Consulta últimos 100 registros de `audit_logs` (globales o de la sede). |

### Administración Local de Filial y Consola Root
| Método | Endpoint | Roles permitidos | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/workspace` | Autenticado | Devuelve resumen del espacio de trabajo de la sede (soporta modo preview de Root). |
| `GET` / `PUT` | `/api/admin/congregation` | Autenticado / Staff para `PUT` | Consulta o actualiza datos de la iglesia del admin (incluyendo `nif`). |
| `GET` / `POST` | `/api/admin/secretary` | Pastores/Admin/Root | Consulta, asigna o actualiza la cuenta `local_secretary` de la filial. |
| `POST` | `/api/admin/members` | Staff / `admin` | Incorpora miembro rápido en la sede actual. |
| `DELETE` | `/api/admin/members/:id` | Staff / `admin` | Marca miembro como `inactive` dentro de su filial. |
| `PUT` | `/api/admin/settings` | Autenticado | Eco de guardado de ajustes locales de workspace. |
| `GET` | `/api/admin/pending-registrations` | Staff / `admin` | Lista miembros en estado `pending` (de su sede, o todos si es rol global). |
| `POST` | `/api/admin/registrations/:id/approve` | Staff / `admin` | Aprueba registro pendiente, activa usuario y genera credencial digital. |
| `POST` | `/api/admin/registrations/:id/reject` | Staff / `admin` | Marca solicitud como `inactive` y suspende usuario vinculado. |
| `GET` / `POST` | `/api/root/admins` | `superadmin`, `root` | Lista o aprovisiona administradores, pastores asesores (múltiples funciones) y secretarios. |
| `PUT` | `/api/root/admins/:id/features` | `superadmin`, `root` | Endpoint de actualización de features de administrador. |
| `GET` | `/api/root/pending-registrations` | `superadmin`, `root` | Lista global de registros pendientes. |
| `POST` | `/api/root/preview/start` & `/stop` | `superadmin`, `root` | Activa o desactiva la sesión de supervisión en vista previa sobre un administrador. |
| `GET` / `POST` | `/api/root/config` | `superadmin`, `root` | Lee o actualiza configuración global del servidor. |
| `POST` | `/api/root/purge` & `/reset-demo` | `superadmin`, `root` | Registra purga de trazas efímeras o reinicio en auditoría. |

---

## 9. Instalación, Scripts y Variables de Entorno

### Requisitos
- Node.js (con soporte ES Modules y `tsx`)
- `npm`

### Variables de Entorno (`.env.example`)
```env
# GEMINI_API_KEY: Opcional / reservada para integraciones de IA en entorno AI Studio
GEMINI_API_KEY="MY_GEMINI_API_KEY"

# APP_URL: URL base donde se aloja la aplicación
APP_URL="MY_APP_URL"

# PORT (opcional, por defecto 3000 en server.ts)
PORT=3000

# DISABLE_HMR (opcional, "true" desactiva watch/HMR en vite.config.ts)
DISABLE_HMR=false
```
*(Si se utiliza `drizzle-kit` con `src/db/drizzle.config.ts` hacia PostgreSQL externo, requiere además `SQL_HOST`, `SQL_DB_NAME`, `SQL_ADMIN_USER` y `SQL_ADMIN_PASSWORD`.)*

### Comandos Disponibles (`package.json`)
```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor Express + Vite en desarrollo (puerto 3000)
npm run dev

# 3. Verificación de tipos TypeScript
npm run lint

# 4. Compilar frontend de producción en dist/
npm run build

# 5. Ejecutar servidor en modo producción (tras npm run build y NODE_ENV=production)
npm start

# 6. Limpiar artefactos compilados
npm run clean
```

---

## 10. Credenciales Iniciales Sembradas (Demo)

Sembradas automáticamente en `src/db/index.ts` cuando la tabla `congregations` está vacía y aseguradas al arranque:

| Rol | Sede | Correo | Contraseña |
| :--- | :--- | :--- | :--- |
| **Root (Supervisión General)** | Global | `root@admadureira.org` | `root#master99` |
| **Admin / Pastor** | Rio de Janeiro | `admin@admadureira.org` | `admin12345` |
| **Admin / Pastor** | São Paulo | `pastor.sp@admadureira.org` | `admin12345` |
| **Admin / Pastor** | Brasília | `pastor.df@admadureira.org` | `admin12345` |
| **Admin / Pastor** | Madrid | `pastor.madrid@admadureira.org` | `admin12345` |
| **Secretario Local** | Rio de Janeiro | `secretario.rio@admadureira.org` | `sec12345` |
| **Secretario Local** | São Paulo | `secretario.sp@admadureira.org` | `sec12345` |
| **Secretario Local** | Brasília | `secretario.df@admadureira.org` | `sec12345` |
| **Secretario Local** | Madrid | `secretario.madrid@admadureira.org` | `sec12345` |
| **Miembro Activo** | Rio de Janeiro | `gabriel.menezes@admadureira.org` | `miembro123` |
| **Miembro Pendiente** | São Paulo | `beatriz.lima@admadureira.org` | `miembro123` |
| **Miembro Activo** | Madrid | `kaue.barbosa2022@gmail.com` | `17012007Alice` |

---

## 11. Limitaciones Técnicas y Notas de Implementación

1. **Sesiones en memoria (`server.ts`)**: el mapa `sessions = new Map()` vive en la memoria del proceso Node.js. Reiniciar el servidor invalida los tokens activos y requiere volver a iniciar sesión.
2. **Almacenamiento de contraseñas (`server.ts`, `src/db/index.ts`)**: aunque la columna se denomina `password_hash`, actualmente las contraseñas se comparan y guardan en texto plano (sin `bcrypt`/`argon2`/`scrypt`). Se recomienda incorporar hashing seguro antes de desplegar en producción real.
3. **Configuración global de Root (`POST /api/root/config` y `PUT /api/root/admins/:id/features`)**: estos endpoints actualmente devuelven respuesta exitosa simulada sin persistir cambios de configuración global en base de datos, y `PUT /api/admin/settings` actúa como eco del payload enviado.
4. **Chat de Atención Pastoral en `MemberPortal.tsx`**: el hilo rápido de chat en la vista de atención del miembro mantiene mensajes iniciales/simulados en estado local del navegador, mientras que las solicitudes formales (`POST /api/member-requests`) sí se persisten en PGlite.
5. **Integraciones externas declaradas pero no conectadas**: `firebase`, `firebase-admin`, `pg` y `@google/genai` figuran en `package.json` (junto con `firebase-applet-config.json` y `src/db/drizzle.config.ts`), pero actualmente el sistema opera íntegramente sobre PGlite local (`.data/local_pglite`).
